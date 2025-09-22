import OpenAI from "openai";

import {
  GeneratedBook,
  StoryIntent,
  StoryPage,
} from "@/lib/types/story";
import {
  buildStorySystemPrompt,
  buildStoryUserPrompt,
} from "@/lib/prompts/story-template";
import {
  StoryResponsePayload,
  storyResponseSchema,
} from "@/lib/validation/story-response";

const DEFAULT_MODEL = process.env.OPENAI_STORY_MODEL ?? "gpt-4.1";

const createClient = () => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return null;
  }

  return new OpenAI({
    apiKey,
    baseURL: process.env.OPENAI_BASE_URL,
  });
};

export class StoryGenerator {
  private client: ReturnType<typeof createClient>;

  constructor() {
    this.client = createClient();
  }

  async generate(
    intent: StoryIntent
  ): Promise<Omit<GeneratedBook, "id" | "createdAt" | "status" | "intent">> {
    if (!this.client) {
      return this.generateMock(intent);
    }

    const response = await this.client.chat.completions.create({
      model: DEFAULT_MODEL,
      messages: [
        {
          role: "system",
          content: buildStorySystemPrompt(intent),
        },
        {
          role: "user",
          content: buildStoryUserPrompt(intent),
        },
      ],
      temperature: 0.7,
      max_tokens: Math.min(12000, Math.max(4000, intent.pageCount * 400)),
      response_format: { type: "json_object" },
    });

    const choice = response.choices?.[0];
    const raw = choice?.message?.content?.trim();

    if (!raw) {
      throw new Error("Story generator returned empty response");
    }

    if (choice?.finish_reason === "length") {
      throw new Error(
        "Story generator response was truncated. Try reducing page count or splitting your prompt."
      );
    }

    return this.parseAndMap(raw);
  }

  private parseAndMap(raw: string) {
    let candidate: unknown;

    try {
      candidate = JSON.parse(raw);
    } catch (error) {
      throw new Error(
        `Story JSON parsing failed: ${
          error instanceof Error ? error.message : "unknown error"
        }\nPayload: ${raw.slice(0, 500)}`
      );
    }

    if (candidate && typeof candidate === "object") {
      const mutable = candidate as Record<string, unknown>;

      if (!mutable.moral && typeof mutable.caregiverMoral === "string") {
        mutable.moral = mutable.caregiverMoral;
      }

      if (!mutable.aestheticNotes) {
        if (typeof mutable.aestheticDirective === "string") {
          mutable.aestheticNotes = mutable.aestheticDirective;
        } else if (typeof mutable.aesthetic === "string") {
          mutable.aestheticNotes = mutable.aesthetic;
        }
      }

      if (Array.isArray(mutable.pages)) {
        mutable.pages = mutable.pages.map((page) => {
          if (page && typeof page === "object") {
            const mutablePage = page as Record<string, unknown>;
            if (!mutablePage.illustrationPrompt && typeof mutablePage.illustrationDirection === "string") {
              mutablePage.illustrationPrompt = mutablePage.illustrationDirection;
            }
            return mutablePage;
          }
          return page;
        });
      }
    }

    let parsed: StoryResponsePayload;

    try {
      parsed = storyResponseSchema.parse(candidate);
    } catch (error) {
      throw new Error(
        `Story JSON parsing failed: ${
          error instanceof Error ? error.message : "unknown error"
        }\nPayload: ${raw.slice(0, 500)}`
      );
    }

    return this.mapToBook(parsed);
  }

  private mapToBook(payload: StoryResponsePayload) {
    const sortedPages = [...payload.pages].sort(
      (a, b) => a.pageNumber - b.pageNumber
    );

    const pages: StoryPage[] = sortedPages.map((page, index) => ({
      pageNumber: index + 1,
      headline: page.headline,
      narrative: page.narrative,
      illustrationPrompt: page.illustrationPrompt,
      keyMoments: page.keyMoments,
      imageUrl: undefined,
    }));

    return {
      title: payload.title,
      subtitle: payload.subtitle,
      dedication: payload.dedication,
      moral: payload.moral,
      aestheticNotes: payload.aestheticNotes,
      pages,
    } satisfies Omit<GeneratedBook, "id" | "createdAt" | "status" | "intent">;
  }

  private generateMock(intent: StoryIntent) {
    const isAdult = intent.audience === "adult";
    const motifs = isAdult
      ? [
          "flickering candlelight",
          "ink-stained journal pages",
          "distant constellations shimmering",
          "rain-soaked cobblestones",
          "soft chiaroscuro spill of twilight",
        ]
      : [
          "twinkling fireflies",
          "soft felt textures",
          "dreamy indigo gradients",
          "gentle humming lullaby notes",
          "floating constellation trails",
        ];

    const pages: StoryPage[] = Array.from({ length: intent.pageCount }, (_, idx) => ({
      pageNumber: idx + 1,
      headline: `Scene ${idx + 1}: ${intent.theme}`,
      narrative: isAdult
        ? "Placeholder narrative for adult illustrated stories. Replace with OpenAI-powered prose when API keys are configured, and expand into reflective, nuanced paragraphs."
        : "Placeholder narrative crafted for offline mode. Replace with OpenAI-powered prose when API keys are configured.",
      illustrationPrompt:
        (isAdult
          ? `Atmospheric ${intent.theme} tableau featuring ${
              intent.characters.map((c) => c.name).join(", ") || "a contemplative protagonist"
            } amid ${motifs[idx % motifs.length]}.`
          : `Whimsical ${intent.theme} moment with ${
              intent.characters.map((c) => c.name).join(", ") || "a curious child"
            } under ${motifs[idx % motifs.length]}.`) +
        (isAdult
          ? " Render as a richly textured illustrated narrative with symbolic lighting and mature palette."
          : " Stylized as a pixel-inspired picture book, consistent characters, cozy palette."),
      keyMoments: [
        isAdult ? "Surface internal conflict" : "Introduce characters",
        isAdult ? "Expose philosophical turning point" : "Reveal gentle conflict",
        isAdult ? "Offer resonant insight" : "Celebrate caring resolution",
      ],
      imageUrl: undefined,
    }));

    return {
      title: `${intent.theme} Adventure`,
      subtitle: isAdult
        ? `An illustrated meditation on ${intent.lesson}`
        : `A ${intent.tone} tale about ${intent.lesson}`,
      dedication: isAdult
        ? "For fellow travelers seeking meaning between the lines."
        : "For every tiny heart eager to imagine.",
      moral: isAdult
        ? `Carry forward this insight: ${intent.lesson}.`
        : `Even the smallest explorer can learn about ${intent.lesson}.`,
      aestheticNotes: isAdult
        ? "Embrace moody lighting, painterly textures, and symbolic staging that speaks to adult readers while keeping characters recognizable."
        : "Lean into soft pixel art lighting, velvety shadows, nostalgic gaming motifs blended with modern storybook warmth.",
      pages,
    } satisfies Omit<GeneratedBook, "id" | "createdAt" | "status" | "intent">;
  }
}

export const createStoryGenerator = () => new StoryGenerator();
