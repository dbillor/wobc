import { z } from "zod";

export const storyPageSchema = z.object({
  pageNumber: z.number().int().min(1).max(30),
  headline: z.string().min(3).max(120),
  narrative: z.string().min(30).max(800),
  illustrationPrompt: z.string().min(10).max(1500),
  keyMoments: z.array(z.string().min(3)).min(1).max(5),
});

export const storyResponseSchema = z.object({
  title: z.string().min(3).max(140),
  subtitle: z.string().min(3).max(200),
  dedication: z.string().min(3).max(400),
  moral: z.string().min(5).max(240),
  aestheticNotes: z.string().min(5).max(1500),
  pages: z.array(storyPageSchema).min(6).max(30),
});

export type StoryResponsePayload = z.infer<typeof storyResponseSchema>;
