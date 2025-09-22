import { z } from "zod";

import { StoryIntent } from "@/lib/types/story";

export const characterInputSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(60),
  description: z.string().min(5).max(600),
  referenceImageDataUrl: z
    .string()
    .refine(
      (value) =>
        value.startsWith("data:image") ||
        value.startsWith("http://") ||
        value.startsWith("https://"),
      "Expected data URI or http(s) URL"
    )
    .optional(),
});

export const storyIntentSchema = z.object({
  audience: z.enum(["child", "adult"]),
  theme: z.string().min(3),
  lesson: z.string().min(3),
  ageRange: z.string().min(3),
  tone: z.enum(["gentle", "playful", "adventurous", "soothing", "wondrous", "custom"]),
  customTone: z.string().optional(),
  pageCount: z.number().int().min(8).max(30),
  styleKeywords: z.array(z.string().min(2)).max(8),
  characters: z.array(characterInputSchema).max(6),
});

export type StoryIntentInput = z.infer<typeof storyIntentSchema>;

export const parseStoryIntent = (input: unknown): StoryIntent => {
  const parsed = storyIntentSchema.parse(input);
  return {
    ...parsed,
  } satisfies StoryIntent;
};
