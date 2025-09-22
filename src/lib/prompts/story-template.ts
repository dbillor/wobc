import { StoryIntent } from "@/lib/types/story";

export const buildStorySystemPrompt = (intent: StoryIntent) => {
  if (intent.audience === "adult") {
    return `You are StoryWeaver, an award-winning literary author and
illustration director for illustrated works aimed at adults. You craft
philosophically rich, emotionally layered narratives that balance
lyrical prose with clear structure. You collaborate with an illustration
model, so provide incisive visual direction that sustains symbolism,
character continuity, and coherent settings while embracing mature
themes.`;
  }

  return `You are StoryWeaver, an award-winning children's author and
illustration director. You craft emotionally resonant picture books
for babies and young children that gently nudge them toward empathy,
courage, and curiosity. You collaborate with an illustration model,
so you must provide rich visual direction while maintaining character
continuity and coherent settings.`;
};

export const buildStoryUserPrompt = (intent: StoryIntent) => {
  const isAdult = intent.audience === "adult";
  const toneDescription =
    intent.tone === "custom" ? intent.customTone ?? "gentle" : intent.tone;

  const narrativeGuidance = isAdult
    ? "narrative (120-220 words arranged in 2-3 lyrical yet precise paragraphs, suitable for adult readers who enjoy philosophical reflection)"
    : "narrative (70-120 words arranged in 2-3 gentle paragraphs, lyrical but clear for read-aloud pacing)";

  const safetyGuidance = isAdult
    ? "Invite emotional complexity and layered symbolism while keeping content suitable for general adult audiences (no explicit gore or sexual content)."
    : "Avoid scary imagery; emphasize warmth and inclusivity.";

  const pacingGuidance = isAdult
    ? "Vary pacing so each spread explores a fresh facet of the central idea—alternate between quiet introspection, sensory detail, and moments of external movement or dialogue."
    : "Vary pacing: quiet spreads, playful action, reflective breaths.";

  const motifGuidance = isAdult
    ? "Highlight motifs, metaphors, or objects that can recur visually to reinforce philosophical throughlines."
    : "Call out motifs or objects that can recur visually for continuity.";

  const bookDescriptor = isAdult ? "illustrated narrative" : "picture book";

  return `Create a fully structured ${bookDescriptor} inspired by the creator's
intent. Respond in raw minified JSON matching the provided schema. Do not
include any markdown, prose, or commentary. Requirements:
- audience focus: ${intent.ageRange} (${intent.audience})
- central theme: ${intent.theme}
- core insight or lesson: ${intent.lesson}
- tone: ${toneDescription}
- desired page count: ${intent.pageCount}
- illustration style cues: ${intent.styleKeywords.join(", ") || (isAdult ? "textured, symbolic" : "cozy, luminous")}
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
1. A title, subtitle/tagline, and dedication that capture the intent.
2. A one-sentence moral or distilled insight for readers to carry forward.
3. An overarching aesthetic directive to keep imagery consistent.
4. For each page (up to ${intent.pageCount} entries):
   - pageNumber starting at 1,
   - headline (max 12 words) to anchor the scene,
   - ${narrativeGuidance},
   - illustrationPrompt with concrete descriptors, camera framing,
     lighting, palette, continuity reminders (mention characters by name!),
   - keyMoments array summarizing pivotal beats.
5. ${safetyGuidance}
6. ${pacingGuidance}
7. ${motifGuidance}
8. Keep each page distinct—evolve locations, props, symbolism, and emotional beats so no two spreads feel redundant, yet tie them together with the core characters and motifs.
`;
};

