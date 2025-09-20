'use client';

import { ChangeEvent, FormEvent, useMemo, useState } from "react";
import { v4 as uuid } from "uuid";

import { ToneOption } from "@/lib/types/story";
import { useBookStore } from "@/state/book-store";

interface CharacterDraft {
  id: string;
  name: string;
  description: string;
  referenceImageDataUrl?: string;
}

interface IntentDraft {
  theme: string;
  lesson: string;
  ageRange: string;
  tone: ToneOption;
  customTone: string;
  pageCount: number;
  styleKeywords: string;
  characters: CharacterDraft[];
}

const toneOptions: Array<{ value: ToneOption; label: string; description: string }> = [
  {
    value: "gentle",
    label: "Gentle",
    description: "Soft lullaby cadence, soothing visuals",
  },
  {
    value: "playful",
    label: "Playful",
    description: "Bouncy rhythm, joyful antics, bright palettes",
  },
  {
    value: "adventurous",
    label: "Adventurous",
    description: "Questing spirit, brave discoveries, lush worlds",
  },
  {
    value: "soothing",
    label: "Soothing",
    description: "Bedtime calm, slow breathing beats, moonlit glow",
  },
  {
    value: "wondrous",
    label: "Wondrous",
    description: "Cosmic awe, sparkling mysteries, curious hearts",
  },
  {
    value: "custom",
    label: "Custom",
    description: "Describe your own tone for a bespoke feel",
  },
];

const defaultIntent: IntentDraft = {
  theme: "A brave little star learns to shine",
  lesson: "believing in yourself and accepting help",
  ageRange: "Ages 2-5",
  tone: "wondrous",
  customTone: "",
  pageCount: 14,
  styleKeywords: "dreamy pastel pixel art, warm glow, soft shadows",
  characters: [],
};

const MAX_CHARACTERS = 4;

export function IntentForm() {
  const [draft, setDraft] = useState<IntentDraft>(defaultIntent);
  const [characterPreviewId, setCharacterPreviewId] = useState<string | null>(null);
  const status = useBookStore((state) => state.status);
  const error = useBookStore((state) => state.error);
  const submitIntent = useBookStore((state) => state.submitIntent);

  const isSubmitting = status === "submitting";

  const canAddCharacter = draft.characters.length < MAX_CHARACTERS;

  const styleKeywordChips = useMemo(
    () =>
      draft.styleKeywords
        .split(",")
        .map((word) => word.trim())
        .filter(Boolean),
    [draft.styleKeywords]
  );

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const styleKeywords = styleKeywordChips.slice(0, 8);

    await submitIntent({
      theme: draft.theme.trim(),
      lesson: draft.lesson.trim(),
      ageRange: draft.ageRange.trim(),
      tone: draft.tone,
      customTone: draft.tone === "custom" ? draft.customTone.trim() : undefined,
      pageCount: draft.pageCount,
      styleKeywords,
      characters: draft.characters,
    });
  };

  const updateCharacter = (id: string, updates: Partial<CharacterDraft>) => {
    setDraft((current) => ({
      ...current,
      characters: current.characters.map((character) =>
        character.id === id ? { ...character, ...updates } : character
      ),
    }));
  };

  const addCharacter = () => {
    if (!canAddCharacter) return;
    setDraft((current) => ({
      ...current,
      characters: [
        ...current.characters,
        {
          id: uuid(),
          name: "",
          description: "",
        },
      ],
    }));
  };

  const removeCharacter = (id: string) => {
    setDraft((current) => ({
      ...current,
      characters: current.characters.filter((character) => character.id !== id),
    }));
  };

  const handleImageUpload = async (
    event: ChangeEvent<HTMLInputElement>,
    id: string
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result?.toString();
      if (!dataUrl) return;
      updateCharacter(id, { referenceImageDataUrl: dataUrl });
      setCharacterPreviewId(id);
    };
    reader.readAsDataURL(file);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-4xl pixel-card border-2 border-lighterInk rounded-3xl px-8 py-10 shadow-[6px_6px_0px_#0d0d1a] text-dim flex flex-col gap-8"
    >
      <header className="flex flex-col gap-2 text-center">
        <p className="text-xs uppercase tracking-[0.35em] text-sunset">World of Bookcraft</p>
        <h1 className="text-3xl md:text-4xl font-semibold text-pale">
          Create or write your story.
        </h1>
        <p className="text-sm md:text-base text-muted">
          Drop in your theme, the lesson you wish to share, and any tiny heroes to feature.
          Our high-reasoning muse will weave a story and illustration prompts that stay true across every page.
        </p>
      </header>

      <section className="grid gap-6 md:grid-cols-2">
        <label className="pixel-card">
          <span className="pixel-label">Theme / World</span>
          <textarea
            required
            rows={3}
            value={draft.theme}
            onChange={(event) => setDraft((state) => ({ ...state, theme: event.target.value }))}
            className="pixel-input"
            placeholder="A compassionate robot learns to hug"
          />
        </label>
        <label className="pixel-card">
          <span className="pixel-label">Core Lesson</span>
          <textarea
            required
            rows={3}
            value={draft.lesson}
            onChange={(event) => setDraft((state) => ({ ...state, lesson: event.target.value }))}
            className="pixel-input"
            placeholder="Bravery includes asking for help"
          />
        </label>
      </section>

      <section className="grid gap-6 md:grid-cols-[1.2fr_0.8fr]">
        <label className="pixel-card">
          <span className="pixel-label">Audience</span>
          <input
            required
            type="text"
            value={draft.ageRange}
            onChange={(event) => setDraft((state) => ({ ...state, ageRange: event.target.value }))}
            className="pixel-input"
            placeholder="Ages 0-3"
          />
        </label>
        <label className="pixel-card">
          <span className="pixel-label">Page Count (6-30)</span>
          <input
            type="range"
            min={8}
            max={30}
            value={draft.pageCount}
            onChange={(event) =>
              setDraft((state) => ({ ...state, pageCount: Number(event.target.value) }))
            }
            className="pixel-slider"
          />
          <span className="text-xs text-dim mt-2">
            {draft.pageCount} scenes to explore
          </span>
        </label>
      </section>

      <section className="grid gap-4">
        <span className="pixel-label">Story Tone</span>
        <div className="grid gap-3 md:grid-cols-3">
          {toneOptions.map((option) => {
            const isActive = draft.tone === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => setDraft((state) => ({ ...state, tone: option.value }))}
                className={`pixel-toggle ${isActive ? "pixel-toggle-active" : ""}`}
              >
                <span className="text-sm font-semibold uppercase tracking-wider">
                  {option.label}
                </span>
                <span className="text-xs text-dim leading-snug">
                  {option.description}
                </span>
              </button>
            );
          })}
        </div>
        {draft.tone === "custom" && (
          <label className="pixel-card">
            <span className="pixel-label">Describe your custom vibe</span>
            <input
              type="text"
              value={draft.customTone}
              onChange={(event) =>
                setDraft((state) => ({ ...state, customTone: event.target.value }))
              }
              className="pixel-input"
              placeholder="Misty dawn calm with gentle humor"
            />
          </label>
        )}
      </section>

      <section className="pixel-card">
        <span className="pixel-label">Visual Motifs & Styling (comma separated)</span>
        <textarea
          rows={2}
          value={draft.styleKeywords}
          onChange={(event) =>
            setDraft((state) => ({ ...state, styleKeywords: event.target.value }))
          }
          className="pixel-input"
        />
        <div className="flex flex-wrap gap-2 mt-3">
          {styleKeywordChips.map((chip) => (
            <span
              key={chip}
              className="pixel-chip"
            >
              {chip}
            </span>
          ))}
          {!styleKeywordChips.length && (
            <span className="text-xs text-dim">
              Add at least one keyword to guide the illustration model.
            </span>
          )}
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <header className="flex items-center justify-between">
          <span className="pixel-label">Stars of the story</span>
          <button
            type="button"
            onClick={addCharacter}
            disabled={!canAddCharacter}
            className="pixel-button-sm"
          >
            + Add character
          </button>
        </header>
        {draft.characters.length === 0 && (
          <p className="text-xs text-dim">
            No characters yet. We can invent them based on your theme.
          </p>
        )}
        <div className="grid gap-4 md:grid-cols-2">
          {draft.characters.map((character) => (
            <article key={character.id} className="pixel-card flex flex-col gap-3">
              <div className="flex items-start justify-between gap-3">
                <label className="flex-1">
                  <span className="pixel-label">Name</span>
                  <input
                    type="text"
                    required
                    value={character.name}
                    onChange={(event) =>
                      updateCharacter(character.id, { name: event.target.value })
                    }
                    className="pixel-input"
                  />
                </label>
                <button
                  type="button"
                  onClick={() => removeCharacter(character.id)}
                  className="pixel-chip px-3 py-1"
                >
                  Remove
                </button>
              </div>
              <label>
                <span className="pixel-label">Personality & look</span>
                <textarea
                  required
                  rows={3}
                  value={character.description}
                  onChange={(event) =>
                    updateCharacter(character.id, {
                      description: event.target.value,
                    })
                  }
                  className="pixel-input"
                  placeholder="Curious baby elephant with oversized moon boots"
                />
              </label>
              <label className="flex flex-col gap-2">
                <span className="pixel-label">Reference image (optional)</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(event) => handleImageUpload(event, character.id)}
                  className="pixel-file"
                />
                {character.referenceImageDataUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={character.referenceImageDataUrl}
                    alt={`${character.name || "Character"} reference`}
                    className={`w-full h-40 object-cover rounded-xl border-2 ${
                      characterPreviewId === character.id ? "outline outline-4" : ""
                    }`}
                    style={{
                      borderColor: "rgba(43, 35, 77, 0.6)",
                      outlineColor:
                        characterPreviewId === character.id
                          ? "rgba(255, 126, 219, 0.6)"
                          : undefined,
                    }}
                    onLoad={() => setCharacterPreviewId(null)}
                  />
                )}
              </label>
            </article>
          ))}
        </div>
      </section>

      {error && (
        <p className="pixel-alert">{error}</p>
      )}

      <footer className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="text-xs md:text-sm text-dim max-w-xl">
          We will craft up to {draft.pageCount} spreads, each paired with a tailored Nanobanana illustration prompt to maintain character continuity and mood across the entire book.
        </div>
        <button
          type="submit"
          className="pixel-button"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Rendering story..." : "Generate cosmic bedtime book"}
        </button>
      </footer>
    </form>
  );
}
