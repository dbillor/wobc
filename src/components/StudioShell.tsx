'use client';

import { Suspense, useEffect } from "react";

import { LoadingCarousel } from "@/components/LoadingCarousel";
import { BookViewer } from "@/components/BookViewer";
import { IntentForm } from "@/components/IntentForm";
import { LibraryShelf } from "@/components/LibraryShelf";
import { useBookStore } from "@/state/book-store";

export function StudioShell() {
  const status = useBookStore((state) => state.status);
  const progress = useBookStore((state) => state.progressTrace);
  const book = useBookStore((state) => state.book);

  useEffect(() => {
    if (status === "showing" && book) {
      document.body.classList.add("storybook-active");
      return () => document.body.classList.remove("storybook-active");
    }
  }, [status, book]);

  return (
    <div className="flex flex-col items-center gap-12 pb-20">
      <Suspense fallback={<div className="pixel-card text-sm text-dim">Loading studio controls...</div>}>
        <IntentForm />
      </Suspense>
      {status === "submitting" && <LoadingCarousel />}
      {status === "showing" && book && <BookViewer />}
      {status === "idle" && progress.length > 0 && !book && (
        <div className="pixel-card text-center text-sm text-dim">
          Generation aborted. Adjust your intent and try again.
        </div>
      )}
      <LibraryShelf />
    </div>
  );
}
