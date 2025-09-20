import { describe, expect, it, vi } from "vitest";

import { StoryOrchestrator } from "@/lib/services/story-orchestrator";
import { StoryIntent, StoryJobProgress } from "@/lib/types/story";

const intent: StoryIntent = {
  theme: "Moon sprites share dreams",
  lesson: "compassion",
  ageRange: "Ages 3-6",
  tone: "playful",
  pageCount: 3,
  styleKeywords: ["sparkle", "midnight"],
  characters: [
    {
      id: "luna",
      name: "Luna",
      description: "Sprite with glowing antennae",
    },
  ],
};

describe("StoryOrchestrator", () => {
  it("composes story, images, and persistence while reporting progress", async () => {
    const storyPages = Array.from({ length: intent.pageCount }, (_, idx) => ({
      pageNumber: idx + 1,
      headline: `Scene ${idx + 1}`,
      narrative: "Test narrative",
      illustrationPrompt: "Prompt",
      keyMoments: ["Beat"],
    }));

    const storyGenerator = {
      generate: vi.fn().mockResolvedValue({
        title: "Test Title",
        subtitle: "Test Subtitle",
        dedication: "For dreamers",
        moral: "Kindness matters",
        aestheticNotes: "Notes",
        pages: storyPages,
      }),
    };

    const imageGenerator = {
      generate: vi
        .fn()
        .mockImplementation(async (_book, page) => `data:image/png;base64,page-${page.pageNumber}`),
    };

    const persist = vi.fn().mockResolvedValue(undefined);
    const orchestrator = new StoryOrchestrator({
      storyGenerator,
      imageGenerator,
      persist,
    });

    const progressTrace: StoryJobProgress[] = [];

    const result = await orchestrator.generateBook(intent, (entry) => {
      progressTrace.push(entry);
    });

    expect(storyGenerator.generate).toHaveBeenCalledWith(intent);
    expect(imageGenerator.generate).toHaveBeenCalledTimes(intent.pageCount);
    expect(persist).toHaveBeenCalledTimes(1);

    const persistedBook = persist.mock.calls[0][0];
    expect(persistedBook.status).toBe("completed");
    expect(persistedBook.pages.every((page) => page.imageUrl)).toBe(true);

    expect(result.book.pages.map((page) => page.imageUrl)).toEqual([
      "data:image/png;base64,page-1",
      "data:image/png;base64,page-2",
      "data:image/png;base64,page-3",
    ]);

    const [, secondCall] = imageGenerator.generate.mock.calls;
    const [, , secondOptions] = secondCall;
    expect(secondOptions?.priorFrames).toEqual(["data:image/png;base64,page-1"]);
    expect(secondOptions?.priorSummaries).toEqual([
      {
        pageNumber: 1,
        headline: "Scene 1",
        illustrationPrompt: "Prompt",
        keyMoments: ["Beat"],
      },
    ]);

    const [, , thirdOptions] = imageGenerator.generate.mock.calls[2];
    expect(thirdOptions?.priorFrames).toEqual([
      "data:image/png;base64,page-1",
      "data:image/png;base64,page-2",
    ]);
    expect(thirdOptions?.priorSummaries).toEqual([
      {
        pageNumber: 1,
        headline: "Scene 1",
        illustrationPrompt: "Prompt",
        keyMoments: ["Beat"],
      },
      {
        pageNumber: 2,
        headline: "Scene 2",
        illustrationPrompt: "Prompt",
        keyMoments: ["Beat"],
      },
    ]);

    const statuses = progressTrace.map((entry) => entry.status);
    expect(statuses[0]).toBe("pending-story");
    expect(statuses).toContain("pending-images");
    expect(statuses.at(-1)).toBe("completed");
  });
});
