'use client';

import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";

import { GeneratedBook } from "@/lib/types/story";
import { normalizePlaceholderUrl } from "@/lib/utils/image-placeholders";

interface StandaloneReaderProps {
  book: GeneratedBook;
  initialPage?: number;
}

function clampPage(page: number, total: number) {
  if (!Number.isFinite(page)) return 1;
  return Math.min(Math.max(page, 1), total);
}

export function StandaloneReader({ book, initialPage = 1 }: StandaloneReaderProps) {
  const totalPages = book.pages.length;
  const [pageNumber, setPageNumber] = useState(() =>
    clampPage(initialPage, totalPages)
  );

  useEffect(() => {
    setPageNumber(clampPage(initialPage, totalPages));
  }, [initialPage, totalPages]);

  const goPrev = useCallback(() => {
    setPageNumber((current) => clampPage(current - 1, totalPages));
  }, [totalPages]);

  const goNext = useCallback(() => {
    setPageNumber((current) => clampPage(current + 1, totalPages));
  }, [totalPages]);

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        goPrev();
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        goNext();
      }
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [goNext, goPrev]);

  const currentPage = useMemo(() => {
    return (
      book.pages.find((entry) => entry.pageNumber === pageNumber) ?? book.pages[0]
    );
  }, [book.pages, pageNumber]);

  const imageSrc = currentPage?.imageUrl
    ? normalizePlaceholderUrl(
        currentPage.imageUrl,
        currentPage.pageNumber,
        book.intent.theme
      )
    : undefined;

  const copyLines = useMemo(() => {
    if (!currentPage) return [];
    const copy = currentPage.pageText || currentPage.narrative;
    if (!copy) return [];
    return copy
      .split(/\n+/)
      .map((line) => line.trim())
      .filter(Boolean);
  }, [currentPage]);

  if (!currentPage) {
    return null;
  }

  const progressPercent = Math.round((pageNumber / totalPages) * 100);

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-2">
        <p className="text-[11px] uppercase tracking-[0.32em] text-sunset">
          Reader
        </p>
        <h1 className="text-3xl md:text-4xl font-semibold text-pale">{book.title}</h1>
        <p className="text-sm md:text-base text-muted max-w-3xl">{book.subtitle}</p>
      </header>

      <div className="rounded-3xl border border-lighterInk/60 bg-[rgba(12,6,28,0.78)] shadow-[0_28px_80px_rgba(0,0,0,0.38)] p-4 sm:p-6 flex flex-col gap-6">
        <div className="relative w-full max-w-5xl mx-auto aspect-[3/4] bg-gradient-to-b from-[#0c081c] via-[#120e28] to-[#1b1436] rounded-2xl overflow-hidden flex items-center justify-center">
          {imageSrc ? (
            <Image
              src={imageSrc}
              alt={currentPage.headline}
              fill
              className="object-contain drop-shadow-[0_18px_48px_rgba(0,0,0,0.45)]"
              sizes="(max-width: 768px) 100vw, 900px"
              unoptimized
              priority
            />
          ) : (
            <div className="text-faint text-sm">No illustration available for this page.</div>
          )}
        </div>

        {copyLines.length > 0 && (
          <div className="bg-[rgba(255,255,255,0.03)] border border-lighterInk/60 rounded-2xl p-4 sm:p-5 text-sm text-muted leading-relaxed">
            {copyLines.map((line, index) => (
              <p key={line + index} className={index > 0 ? "mt-2" : undefined}>
                {line}
              </p>
            ))}
          </div>
        )}

        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={goPrev}
                disabled={pageNumber === 1}
                className="px-3 py-2 rounded-xl border border-lighterInk-soft bg-[rgba(255,255,255,0.06)] text-sm font-semibold text-pale hover:bg-[rgba(255,255,255,0.1)] disabled:opacity-40 disabled:cursor-not-allowed"
              >
                ← Prev
              </button>
              <button
                type="button"
                onClick={goNext}
                disabled={pageNumber === totalPages}
                className="px-3 py-2 rounded-xl border border-lighterInk-soft bg-[rgba(255,255,255,0.06)] text-sm font-semibold text-pale hover:bg-[rgba(255,255,255,0.1)] disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Next →
              </button>
            </div>
            <div className="text-xs uppercase tracking-[0.22em] text-faint">
              Page {pageNumber.toString().padStart(2, "0")} /{" "}
              {totalPages.toString().padStart(2, "0")}
            </div>
          </div>
          <div className="h-2 rounded-full bg-[rgba(255,255,255,0.08)] overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-sunset to-pastel transition-[width] duration-200 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
