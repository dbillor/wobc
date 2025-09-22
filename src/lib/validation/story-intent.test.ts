import { describe, expect, it } from "vitest";

import { parseStoryIntent } from "@/lib/validation/story-intent";
import { StoryIntent } from "@/lib/types/story";

describe("parseStoryIntent", () => {
  const baseIntent: StoryIntent = {
    audience: "child",
    theme: "A caring comet learns patience",
    lesson: "sharing and waiting turns",
    ageRange: "Ages 3-5",
    tone: "gentle",
    pageCount: 10,
    styleKeywords: ["pastel glow", "pixel shimmer"],
    characters: [
      {
        id: "nova",
        name: "Nova",
        description: "Curious comet with a swirl tail",
        referenceImageDataUrl: "data:image/png;base64,stub",
      },
    ],
  };

  it("returns a strongly typed intent on success", () => {
    const parsed = parseStoryIntent(baseIntent);
    expect(parsed).toEqual(baseIntent);
  });

  it("coerces and trims strings while respecting schema", () => {
    const parsed = parseStoryIntent({
      ...baseIntent,
      theme: "   Cozy moons learn   ",
      lesson: " kindness   ",
    });

    expect(parsed.theme).toBe("   Cozy moons learn   ");
    expect(parsed.lesson).toBe(" kindness   ");
  });

  it("throws when page count is outside range", () => {
    expect(() =>
      parseStoryIntent({
        ...baseIntent,
        pageCount: 40,
      })
    ).toThrowError(/Number must be less than or equal to 30/);
  });
});
