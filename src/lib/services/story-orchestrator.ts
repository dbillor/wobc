import { randomUUID } from "node:crypto";

import {
  GeneratedBook,
  StoryGenerationResult,
  StoryIntent,
  StoryJobProgress,
} from "@/lib/types/story";
import {
  StoryGenerator,
  createStoryGenerator,
} from "@/lib/services/story-generator";
import {
  ImageGenerator,
  createImageGenerator,
} from "@/lib/services/image-generator";
import { saveBook } from "@/lib/repository/book-repository";
import { persistPageImageFromDataUrl } from "@/lib/repository/page-image-repository";

interface StoryOrchestratorDeps {
  storyGenerator?: Pick<StoryGenerator, "generate">;
  imageGenerator?: Pick<ImageGenerator, "generate">;
  persist?: (book: GeneratedBook) => Promise<void>;
}

export type ProgressHandler = (progress: StoryJobProgress) => void;

export class StoryOrchestrator {
  private storyGenerator;
  private imageGenerator;
  private persist;

  constructor(deps: StoryOrchestratorDeps = {}) {
    this.storyGenerator = deps.storyGenerator ?? createStoryGenerator();
    this.imageGenerator = deps.imageGenerator ?? createImageGenerator();
    this.persist = deps.persist ?? saveBook;
  }

  async generateBook(
    intent: StoryIntent,
    onProgress?: ProgressHandler
  ): Promise<StoryGenerationResult> {
    const jobId = randomUUID();

    const baseProgress: StoryJobProgress = {
      jobId,
      status: "pending-story",
      message: "Preparing prompt for story generation",
      completedPages: 0,
      totalPages: intent.pageCount,
    };

    onProgress?.(baseProgress);

    const story = await this.storyGenerator.generate(intent);

    onProgress?.({
      ...baseProgress,
      status: "pending-images",
      message: "Story outline generated. Starting illustration renders...",
    });

    const book: GeneratedBook = {
      id: randomUUID(),
      createdAt: new Date().toISOString(),
      intent,
      status: "pending-images",
      ...story,
    };

    const priorFrames: string[] = [];
    const priorSummaries: Array<{
      pageNumber: number;
      headline: string;
      illustrationPrompt: string;
      keyMoments: string[];
    }> = [];

    for (const page of book.pages) {
      try {
        const generatedImage = await this.imageGenerator.generate(book, page, {
          frameSeed: `${book.id}-${page.pageNumber}`,
          priorFrames: priorFrames.slice(-2),
          priorSummaries: priorSummaries.slice(-3),
        });
        if (generatedImage?.startsWith("data:image")) {
          let storedUrl: string | null = null;
          try {
            storedUrl = (
              await persistPageImageFromDataUrl(
                book.id,
                page.pageNumber,
                generatedImage
              )
            )?.relativePath ?? null;
          } catch (persistError) {
            console.warn(
              `Failed to persist image for book ${book.id} page ${page.pageNumber}:`,
              persistError
            );
          }
          page.imageUrl = storedUrl ?? generatedImage;
          priorFrames.push(generatedImage);
          if (priorFrames.length > 2) {
            priorFrames.splice(0, priorFrames.length - 2);
          }
        } else {
          page.imageUrl = generatedImage;
          priorFrames.length = 0;
        }
      } catch (error) {
        page.imageUrl = undefined;
        onProgress?.({
          ...baseProgress,
          status: "errored",
          message: `Failed to render page ${page.pageNumber}: ${
            error instanceof Error ? error.message : "unknown error"
          }`,
          completedPages: page.pageNumber - 1,
          errors: [
            error instanceof Error ? error.message : "Unknown generator error",
          ],
        });
        throw error;
      }

      onProgress?.({
        ...baseProgress,
        status: "pending-images",
        message: `Rendered page ${page.pageNumber}`,
        completedPages: page.pageNumber,
      });

      priorSummaries.push({
        pageNumber: page.pageNumber,
        headline: page.headline,
        illustrationPrompt: page.illustrationPrompt,
        keyMoments: page.keyMoments,
      });
    }

    book.status = "completed";

    await this.persist(book);

    const finalProgress: StoryJobProgress = {
      ...baseProgress,
      status: "completed",
      message: "Storybook is ready!",
      bookId: book.id,
      completedPages: book.pages.length,
    };

    onProgress?.(finalProgress);

    return {
      book,
      progress: finalProgress,
    };
  }
}

export const createStoryOrchestrator = (deps?: StoryOrchestratorDeps) =>
  new StoryOrchestrator(deps);
