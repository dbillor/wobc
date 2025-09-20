'use client';

import { create } from "zustand";

import {
  GeneratedBook,
  StoryIntent,
  StoryJobProgress,
} from "@/lib/types/story";

export interface BookStore {
  intent: StoryIntent | null;
  book: GeneratedBook | null;
  progressTrace: StoryJobProgress[];
  status: "idle" | "submitting" | "showing";
  activePage: number;
  error: string | null;
  library: GeneratedBook[];
  setIntent: (intent: StoryIntent) => void;
  submitIntent: (intent: StoryIntent) => Promise<void>;
  setActivePage: (page: number) => void;
  fetchLibrary: () => Promise<void>;
  selectBook: (bookId: string) => void;
  closeBook: () => void;
  reset: () => void;
}

const API_BASE = "/api/books";

export const useBookStore = create<BookStore>((set, get) => ({
  intent: null,
  book: null,
  progressTrace: [],
  status: "idle",
  activePage: 1,
  error: null,
  library: [],
  setIntent: (intent) => set({ intent }),
  setActivePage: (page) =>
    set((state) => ({
      activePage: Math.min(Math.max(page, 1), state.book?.pages.length ?? 1),
    })),
  closeBook: () =>
    set({
      book: null,
      status: "idle",
      activePage: 1,
    }),
  reset: () =>
    set({
      intent: null,
      book: null,
      progressTrace: [],
      status: "idle",
      activePage: 1,
      error: null,
    }),
  submitIntent: async (intent: StoryIntent) => {
    set({ status: "submitting", intent, progressTrace: [], error: null });

    const response = await fetch(API_BASE, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ intent }),
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      const message =
        typeof payload.error === "string" ? payload.error : response.statusText;
      set({ status: "idle", error: message });
      throw new Error(message);
    }

    const payload = (await response.json()) as {
      book: GeneratedBook;
      progressTrace: StoryJobProgress[];
    };

    set({
      book: payload.book,
      progressTrace: payload.progressTrace,
      status: "showing",
      activePage: 1,
      library: [
        payload.book,
        ...get().library.filter((entry) => entry.id !== payload.book.id),
      ],
    });
  },
  fetchLibrary: async () => {
    const response = await fetch(API_BASE);
    if (!response.ok) return;
    const payload = (await response.json()) as { books: GeneratedBook[] };
    set({ library: payload.books });
  },
  selectBook: (bookId: string) => {
    const existing = get().library.find((entry) => entry.id === bookId);
    if (!existing) return;
    set({
      book: existing,
      status: "showing",
      intent: existing.intent,
      activePage: 1,
      progressTrace: [],
      error: null,
    });
  },
}));
