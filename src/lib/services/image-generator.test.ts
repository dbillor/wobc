import { describe, expect, it, vi } from "vitest";

import { GoogleGenerativeAIFetchError } from "@google/generative-ai";
import type { GoogleGenerativeAI } from "@google/generative-ai";

import { ImageGenerator } from "@/lib/services/image-generator";
import { GeneratedBook, StoryPage } from "@/lib/types/story";

const intent = {
  theme: "Starlit forest",
  lesson: "gentleness",
  ageRange: "Ages 1-3",
  tone: "gentle" as const,
  pageCount: 3,
  styleKeywords: ["soft moss"],
  characters: [],
};

describe("ImageGenerator", () => {
  it("returns placeholder URL when API credentials are missing", async () => {
    const generator = new ImageGenerator();

    const book = {
      title: "Test",
      moral: "Kindness wins",
      aestheticNotes: "Pastel",
      intent,
    } as Pick<GeneratedBook, "title" | "moral" | "aestheticNotes" | "intent">;

    const page: StoryPage = {
      pageNumber: 1,
      headline: "Intro",
      narrative: "",
      illustrationPrompt: "",
      keyMoments: [],
    };

    const url = await generator.generate(book, page);

    expect(url).toMatch(/placehold\.co/);
    expect(url).toContain("Page%201");
  });

  it("falls back to placeholder when Gemini quota is exceeded", async () => {
    const generateContent = vi
      .fn()
      .mockRejectedValue(
        new GoogleGenerativeAIFetchError(
          "quota hit",
          429,
          "Too Many Requests",
          []
        )
      );

    const client = {
      getGenerativeModel: vi.fn().mockReturnValue({
        generateContent,
      }),
    };

    const generator = new ImageGenerator({
      client: client as unknown as GoogleGenerativeAI,
    });

    const book = {
      title: "Test",
      moral: "Kindness wins",
      aestheticNotes: "Pastel",
      intent,
    } as Pick<GeneratedBook, "title" | "moral" | "aestheticNotes" | "intent">;

    const page: StoryPage = {
      pageNumber: 2,
      headline: "Middle",
      narrative: "",
      illustrationPrompt: "",
      keyMoments: [],
    };

    const url = await generator.generate(book, page);

    expect(generateContent).toHaveBeenCalled();
    expect(url).toMatch(/placehold\.co/);
    expect(url).toContain("Page%202");
  });

  it("falls back to placeholder when Gemini reports a server error", async () => {
    const generateContent = vi
      .fn()
      .mockRejectedValue(
        new GoogleGenerativeAIFetchError(
          "internal error encountered",
          500,
          "Internal Server Error",
          []
        )
      );

    const client = {
      getGenerativeModel: vi.fn().mockReturnValue({
        generateContent,
      }),
    };

    const generator = new ImageGenerator({
      client: client as unknown as GoogleGenerativeAI,
    });

    const book = {
      title: "Test",
      moral: "Kindness wins",
      aestheticNotes: "Pastel",
      intent,
    } as Pick<GeneratedBook, "title" | "moral" | "aestheticNotes" | "intent">;

    const page: StoryPage = {
      pageNumber: 3,
      headline: "Finale",
      narrative: "",
      illustrationPrompt: "",
      keyMoments: [],
    };

    const url = await generator.generate(book, page);

    expect(generateContent).toHaveBeenCalled();
    expect(url).toMatch(/placehold\.co/);
    expect(url).toContain("Page%203");
  });

  it("only attaches character references when the page mentions them", async () => {
    type GeminiPart = {
      inlineData?: { mimeType?: string; data?: string };
      text?: string;
    };

    const recorded: GeminiPart[][] = [];

    const generateContent = vi.fn().mockImplementation(async (request) => {
      recorded.push(request.contents[0].parts);
      return {
        response: {
          candidates: [
            {
              content: {
                parts: [
                  {
                    inlineData: {
                      data: "ZmFrZQ==",
                      mimeType: "image/png",
                    },
                  },
                ],
              },
            },
          ],
        },
      };
    });

    const client = {
      getGenerativeModel: vi.fn().mockReturnValue({
        generateContent,
      }),
    };

    const generator = new ImageGenerator({
      client: client as unknown as GoogleGenerativeAI,
    });

    const characterIntent = {
      ...intent,
      characters: [
        {
          id: "hero",
          name: "Lira",
          description: "Curious star-sprite with shimmering braids",
          referenceImageDataUrl: "data:image/png;base64,REF",
        },
      ],
    };

    const book = {
      title: "Test",
      moral: "Kindness wins",
      aestheticNotes: "Pastel",
      intent: characterIntent,
    } as Pick<GeneratedBook, "title" | "moral" | "aestheticNotes" | "intent">;

    const pageWithout = {
      pageNumber: 1,
      headline: "Forest Glow",
      narrative: "Fireflies gather around a quiet glade.",
      illustrationPrompt: "Soft lights twinkle beside a creek.",
      keyMoments: ["Fireflies shimmer"],
    } satisfies StoryPage;

    const pageWith = {
      pageNumber: 2,
      headline: "Lira Steps Forward",
      narrative: "Lira lifts her braids as she steps into the glow.",
      illustrationPrompt: "Lira smiles beside the creek, fireflies swirling.",
      keyMoments: ["Lira glows"],
    } satisfies StoryPage;

    await generator.generate(book, pageWithout);
    await generator.generate(book, pageWith);

    const [noCharacterParts, withCharacterParts] = recorded;

    const countInline = (parts: GeminiPart[]) =>
      parts.filter((part) => Boolean(part.inlineData?.data)).length;

    expect(countInline(noCharacterParts)).toBe(0);
    expect(countInline(withCharacterParts)).toBeGreaterThan(0);
  });
});
