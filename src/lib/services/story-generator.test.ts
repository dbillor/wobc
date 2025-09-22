import { describe, expect, it } from "vitest";

import { StoryGenerator } from "@/lib/services/story-generator";
import { StoryIntent } from "@/lib/types/story";

describe("StoryGenerator", () => {
  const intent: StoryIntent = {
    audience: "child",
    theme: "A lighthouse teaches bravery",
    lesson: "Asking for guidance",
    ageRange: "Ages 2-4",
    tone: "soothing",
    pageCount: 8,
    styleKeywords: ["misty glow", "pixel tide"],
    characters: [
      {
        id: "beam",
        name: "Beam",
        description: "Warm-hearted lighthouse keeper bot",
      },
    ],
  };

  it("falls back to deterministic mock output when API key is absent", async () => {
    const generator = new StoryGenerator();

    const story = await generator.generate(intent);

    expect(story.title).toContain(intent.theme);
    expect(story.pages).toHaveLength(intent.pageCount);
    story.pages.forEach((page, index) => {
      expect(page.pageNumber).toBe(index + 1);
      expect(page.illustrationPrompt).toContain(intent.theme);
    });
  });
});
