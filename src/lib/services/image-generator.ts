import {
  GoogleGenerativeAI,
  GoogleGenerativeAIFetchError,
} from "@google/generative-ai";
import type { GenerateContentResult } from "@google/generative-ai";

import { GeneratedBook, StoryPage } from "@/lib/types/story";

interface GenerateOptions {
  frameSeed?: string;
  priorFrames?: string[];
  priorSummaries?: Array<{
    pageNumber: number;
    headline: string;
    illustrationPrompt: string;
    keyMoments: string[];
  }>;
}

type GeminiPart =
  | { text: string }
  | { inlineData: { mimeType: string; data: string } };

const DEFAULT_PLACEHOLDER_BASE = "https://placehold.co/768x1024/1b1b3a/eeeeff.png";
const DEFAULT_GEMINI_MODEL =
  process.env.GEMINI_IMAGE_MODEL ?? process.env.NANOBANANA_MODEL ?? "gemini-2.5-flash-image-preview";

export interface ImageGeneratorDeps {
  client?: GoogleGenerativeAI | null;
  model?: string;
}

export class ImageGenerator {
  private client: GoogleGenerativeAI | null;
  private model: string;

  constructor(deps: ImageGeneratorDeps = {}) {
    if (deps.client !== undefined) {
      this.client = deps.client;
    } else {
      const apiKey = process.env.GEMINI_API_KEY ?? process.env.NANOBANANA_API_KEY;
      this.client = apiKey ? new GoogleGenerativeAI(apiKey) : null;
    }

    this.model = deps.model ?? DEFAULT_GEMINI_MODEL;
  }

  async generate(
    book: Pick<GeneratedBook, "title" | "moral" | "aestheticNotes" | "intent">,
    page: StoryPage,
    options: GenerateOptions = {}
  ): Promise<string> {
    if (!this.client) {
      return this.buildPlaceholder(page.pageNumber, book.intent.theme);
    }

    const model = this.client.getGenerativeModel({ model: this.model });
    const parts = this.buildGeminiParts(book, page, options);

    try {
      const result = await model.generateContent({
        contents: [
          {
            role: "user",
            parts,
          },
        ],
      });

      const imagePart = this.extractInlineImage(result);
      if (imagePart) {
        return `data:${imagePart.mimeType};base64,${imagePart.data}`;
      }

      const textFallback = this.extractText(result);
      if (textFallback) {
        throw new Error(`Gemini returned text instead of an image: ${textFallback.slice(0, 160)}`);
      }
    } catch (error) {
      if (this.shouldFallbackToPlaceholder(error)) {
        return this.buildPlaceholder(page.pageNumber, book.intent.theme);
      }
      throw new Error(
        `Gemini image generation failed: ${error instanceof Error ? error.message : "unknown error"}`
      );
    }

    return this.buildPlaceholder(page.pageNumber, book.intent.theme);
  }

  private buildGeminiParts(
    book: Pick<GeneratedBook, "title" | "moral" | "aestheticNotes" | "intent">,
    page: StoryPage,
    options: GenerateOptions
  ): GeminiPart[] {
    const characterNotes = book.intent.characters.map((character) => ({
      label: character.name,
      detail: character.description,
      hasReference: Boolean(character.referenceImageDataUrl),
      reference: character.referenceImageDataUrl,
    }));

    const tone =
      book.intent.tone === "custom"
        ? book.intent.customTone ?? "gentle"
        : book.intent.tone;

    const isAdult = book.intent.audience === "adult";

    const keyMomentsList = page.keyMoments
      .map((moment, index) => `${index + 1}. ${moment}`)
      .join("\n");

    const sceneDescription = [
      page.narrative.trim(),
      page.illustrationPrompt.trim() ? `Focus on ${page.illustrationPrompt.trim()}.` : undefined,
    ]
      .filter(Boolean)
      .join(" ");

    const priorFrameInline = options.priorFrames
      ?.map((frame) => this.toInlineData(frame))
      .filter(Boolean) as GeminiPart[] | undefined;

    const previousScenes = options.priorSummaries
      ?.slice(-3)
      .map((summary) => {
        const beats = summary.keyMoments
          .map((moment, index) => `${index + 1}. ${moment}`)
          .join(" | ");
        const keyLine = beats ? ` (Key beats: ${beats})` : "";
        return `- Page ${summary.pageNumber}: ${summary.headline} — Focused on ${summary.illustrationPrompt}${keyLine}`;
      })
      .join("\n");

    const pageContext = [
      page.headline,
      page.narrative,
      page.illustrationPrompt,
      page.keyMoments.join(" "),
    ]
      .join(" ")
      .toLowerCase();

    const activeCharacters = characterNotes.filter((character) =>
      pageContext.includes(character.label.toLowerCase())
    );

    const inlineCharacterReferences = activeCharacters
      .filter((character) => character.hasReference && character.reference)
      .map((character) => this.toInlineData(character.reference))
      .filter(Boolean) as GeminiPart[];

    const promptSections = [
      isAdult
        ? "You are Nanobanana, a Gemini concept artist who keeps characters consistent while evolving staging, symbolism, and mood across an illustrated narrative for adult readers."
        : "You are Nanobanana, a Gemini concept artist who keeps characters consistent while evolving staging, mood, and settings across a children's picture book.",
      "\n## Story Overview",
      `- Title: ${book.title}`,
      `- Lesson: ${book.intent.lesson}`,
      `- Moral: ${book.moral}`,
      `- Tone: ${tone}`,
      `- Aesthetic notes: ${book.aestheticNotes}`,
      `- Visual motifs: ${book.intent.styleKeywords.join(", ") || "soft starglow"}`,
      "\n## Scene Description",
      sceneDescription,
      keyMomentsList ? `Key beats to highlight:\n${keyMomentsList}` : undefined,
      previousScenes
        ? `\n## Previous Scenes Recap\n${previousScenes}\nUse these beats for continuity cues, not for repeating the same backdrop or composition.`
        : undefined,
      "\n## Character Continuity",
      activeCharacters.length
        ? activeCharacters
            .map(
              (note) =>
                `- ${note.label}: ${note.detail}${
                  note.hasReference ? " (match provided reference)" : ""
                }`
            )
            .join("\n")
        : "- Maintain protagonist design across the book.",
      characterNotes.length > activeCharacters.length
        ? `Supporting cast reminders:\n${characterNotes
            .filter((note) => !activeCharacters.includes(note))
            .map((note) => `- ${note.label}: ${note.detail}`)
            .join("\n")}`
        : undefined,
      options.priorFrames?.length || inlineCharacterReferences.length
        ? `\n## Continuity References\n- ${[options.priorFrames?.length ?? 0, inlineCharacterReferences.length]
            .filter(Boolean)
            .reduce((a, b) => a + b, 0)} visual reference asset(s) provided inline. Match character proportions, palette, and accessories.`
        : undefined,
      options.frameSeed ? `\n## Seed Hint\n- ${options.frameSeed}` : undefined,
      "\n## Rendering Guidance",
      "- Portrait orientation at 768x1024. Keep characters prominent and expressive.",
      isAdult
        ? "- Lean into the described aesthetic notes to convey mature, contemplative atmosphere."
        : "- Use the dreamy pastel palette described.",
      "- Introduce a fresh camera angle or environmental detail relative to prior pages.",
      "- Let backgrounds shift when the story suggests progress; continuity lives in characters, motifs, and emotional throughline.",
      "- Deliver a single finished illustration as inline image data.",
    ].filter(Boolean);

    const parts: GeminiPart[] = [{ text: promptSections.join("\n") }];

    if (priorFrameInline?.length) {
      for (const frame of priorFrameInline) {
        parts.unshift(frame);
      }
    }

    if (inlineCharacterReferences.length) {
      for (const reference of inlineCharacterReferences) {
        parts.unshift(reference);
      }
    }

    return parts;
  }

  private toInlineData(dataUrl?: string): GeminiPart | null {
    if (!dataUrl || !dataUrl.startsWith("data:")) {
      return null;
    }

    const commaIndex = dataUrl.indexOf(",");
    if (commaIndex === -1) {
      return null;
    }

    const meta = dataUrl.slice(5, commaIndex);
    const base64 = dataUrl.slice(commaIndex + 1);
    const mime = meta.split(";")[0] || "image/png";

    return {
      inlineData: {
        mimeType: mime,
        data: base64,
      },
    };
  }

  private extractInlineImage(result: GenerateContentResult) {
    const candidates = result.response?.candidates ?? [];
    for (const candidate of candidates) {
      const parts = candidate.content?.parts ?? [];
      for (const part of parts) {
        if (part.inlineData?.data && part.inlineData.mimeType?.startsWith("image")) {
          return {
            mimeType: part.inlineData.mimeType,
            data: part.inlineData.data,
          };
        }
      }
    }
    return null;
  }

  private extractText(result: GenerateContentResult) {
    const candidates = result.response?.candidates ?? [];
    for (const candidate of candidates) {
      const parts = candidate.content?.parts ?? [];
      for (const part of parts) {
        if (part.text) {
          return part.text;
        }
      }
    }
    return null;
  }

  private shouldFallbackToPlaceholder(error: unknown) {
    if (error instanceof GoogleGenerativeAIFetchError) {
      const status = error.status ?? 0;
      if (status === 429 || status >= 500) {
        return true;
      }
    }

    if (error instanceof Error) {
      const message = error.message.toLowerCase();
      return (
        message.includes("quota exceeded") ||
        message.includes("too many requests") ||
        message.includes("internal error encountered") ||
        message.includes("server error")
      );
    }

    return false;
  }

  private buildPlaceholder(pageNumber: number, theme: string) {
    const safeTheme = theme.replace(/[^a-z0-9]+/gi, " ").trim();
    const text = encodeURIComponent(`Page ${pageNumber}\n${safeTheme}`);
    return `${DEFAULT_PLACEHOLDER_BASE}?text=${text}`;
  }
}

export const createImageGenerator = (deps?: ImageGeneratorDeps) => new ImageGenerator(deps);
