import { StoryIntent } from "@/lib/types/story";

export const STORY_SYSTEM_PROMPT = `You are StoryWeaver, an award-winning children's author and
illustration director. You craft emotionally resonant picture books
for babies and young children that gently nudge them toward empathy,
courage, and curiosity. You collaborate with an illustration model,
so you must provide rich visual direction while maintaining character
continuity and coherent settings.`;

export const buildStoryUserPrompt = (intent: StoryIntent) => `Create a fully structured picture book inspired by the parent's
intent. Respond in raw minified JSON matching the provided schema. Do not
include any markdown, prose, or commentary. Requirements:
- audience: ${intent.ageRange}
- central theme: ${intent.theme}
- core life lesson: ${intent.lesson}
- tone: ${intent.tone === "custom" ? intent.customTone ?? "gentle" : intent.tone}
- desired page count: ${intent.pageCount}
- illustration style cues: ${intent.styleKeywords.join(", ") || "cozy, luminous"}
- characters: ${
  intent.characters.length
    ? intent.characters
        .map(
          (c) =>
            `${c.name}: ${c.description}${
              c.referenceImageDataUrl ? " (reference image provided)" : ""
            }`
        )
        .join("; ")
    : "create protagonists that align with the theme"
}

Ensure the book has:
1. A title, subtitle/tagline, and dedication that captures the intent.
2. A one-sentence moral for caregivers to share.
3. An overarching aesthetic directive to keep imagery consistent.
4. For each page (up to ${intent.pageCount} entries):
   - pageNumber starting at 1,
   - headline (max 12 words) to anchor the scene,
   - narrative (70-120 words arranged in 2-3 gentle paragraphs, lyrical but clear for read-aloud pacing),
   - illustrationPrompt with concrete descriptors, camera framing,
     lighting, palette, continuity reminders (mention characters by name!),
   - keyMoments array summarizing pivotal beats.
5. Avoid scary imagery; emphasize warmth and inclusivity.
6. Vary pacing: quiet spreads, playful action, reflective breaths.
7. Call out motifs or objects that can recur visually for continuity.
`;
