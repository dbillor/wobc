'use client';

import Image from "next/image";
import { motion } from "framer-motion";
import { useCallback, useEffect, useMemo, useState } from "react";

import { normalizePlaceholderUrl } from "@/lib/utils/image-placeholders";
import { useBookStore } from "@/state/book-store";

export function BookViewer() {
  const book = useBookStore((state) => state.book);
  const activePage = useBookStore((state) => state.activePage);
  const setActivePage = useBookStore((state) => state.setActivePage);
  const closeBook = useBookStore((state) => state.closeBook);
  const [showPrompt, setShowPrompt] = useState(false);

  const currentPage = useMemo(() => {
    if (!book) return null;
    return book.pages.find((page) => page.pageNumber === activePage) ?? null;
  }, [book, activePage]);

  const narrativeParagraphs = useMemo(() => {
    if (!currentPage) return [] as string[];
    return currentPage.narrative
      .split(/(?<=[.!?])\s+/)
      .filter(Boolean);
  }, [currentPage]);

  const goPrev = useCallback(() => {
    setActivePage(activePage - 1);
  }, [activePage, setActivePage]);

  const goNext = useCallback(() => {
    setActivePage(activePage + 1);
  }, [activePage, setActivePage]);

  useEffect(() => {
    if (!book) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeBook();
        return;
      }
      if (event.key === "ArrowRight") {
        event.preventDefault();
        goNext();
      }
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        goPrev();
      }
    };

    window.addEventListener("keydown", handleKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKey);
    };
  }, [book, goNext, goPrev, closeBook]);

  useEffect(() => {
    setShowPrompt(false);
  }, [currentPage?.pageNumber]);

  if (!book || !currentPage) {
    return null;
  }

  const totalPages = book.pages.length;
  const progress = Math.round((activePage / totalPages) * 100);
  const imageSrc = currentPage.imageUrl
    ? normalizePlaceholderUrl(
        currentPage.imageUrl,
        currentPage.pageNumber,
        book.intent.theme
      )
    : undefined;

  return (
    <section className="fixed inset-0 z-50 flex flex-col text-pale">
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-[#09021a] via-[#13073b] to-[#1f0c4f]" />
      <div className="absolute inset-0 -z-20 opacity-40 bg-[radial-gradient(circle_at_top_left,_rgba(255,126,219,0.25),transparent_55%),_radial-gradient(circle_at_bottom_right,_rgba(117,80,255,0.25),transparent_55%)]" />

      <header className="flex items-center justify-between px-4 md:px-8 pt-4 pb-2 text-sm md:text-base text-dim">
        <div className="flex items-center gap-2 text-xs uppercase tracking-[0.35em] text-sunset">
          <span>Storytime</span>
          <span className="text-dim lowercase tracking-normal">•</span>
          <span className="text-xs md:text-sm uppercase tracking-[0.35em] text-dim">
            {book.title}
          </span>
        </div>
        <button type="button" onClick={closeBook} className="pixel-button-sm">
          Close ✕
        </button>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center px-2 md:px-8 pb-6">
        <div className="relative w-full max-w-6xl h-full flex flex-col">
          <div className="pixel-book flex-1 grid md:grid-cols-[1.4fr_0.6fr] gap-6 md:gap-8 items-center h-full">
            <figure className="pixel-image-frame relative w-full h-full">
              {imageSrc ? (
                <Image
                  src={imageSrc}
                  alt={currentPage.headline}
                  fill
                  sizes="(max-width: 1024px) 100vw, 720px"
                  className="object-cover"
                  priority
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-center text-faint">
                  Illustration placeholder
                </div>
              )}
            </figure>
            <motion.article
              key={currentPage.pageNumber}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="flex flex-col gap-6 h-full"
            >
              <header>
                <p className="text-xs uppercase tracking-[0.35em] text-sunset">Page {currentPage.pageNumber}</p>
                <h2 className="text-3xl font-semibold mt-3">{currentPage.headline}</h2>
              </header>
              <div className="flex flex-col gap-4 text-lg leading-relaxed text-muted">
                {narrativeParagraphs.map((paragraph, index) => (
                  <p
                    key={index}
                    className="first-letter:text-sunset first-letter:font-semibold first-letter:text-4xl"
                  >
                    {paragraph}
                  </p>
                ))}
              </div>
              <div
                className="relative mt-auto self-start"
                onMouseEnter={() => setShowPrompt(true)}
                onMouseLeave={() => setShowPrompt(false)}
              >
                <button
                  type="button"
                  onFocus={() => setShowPrompt(true)}
                  onBlur={() => setShowPrompt(false)}
                  className="pixel-button-sm"
                >
                  Illustrator notes
                </button>
                {showPrompt && (
                  <div
                    className="pixel-card absolute left-0 mt-2 w-72 md:w-96 text-sm text-dim"
                    style={{
                      background: "rgba(7, 3, 23, 0.9)",
                      borderColor: "rgba(43, 35, 77, 0.6)",
                    }}
                  >
                    <p className="text-xs uppercase tracking-[0.35em] text-sunset">Illustration prompt</p>
                    <p className="text-sm text-dim mt-2 whitespace-pre-line">
                      {currentPage.illustrationPrompt}
                    </p>
                  </div>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {currentPage.keyMoments.map((moment) => (
                  <span
                    key={moment}
                    className="pixel-chip"
                    style={{ background: "rgba(255, 126, 219, 0.88)", color: "var(--ink)" }}
                  >
                    {moment}
                  </span>
                ))}
              </div>
            </motion.article>
          </div>

          <button
            type="button"
            onClick={goPrev}
            disabled={activePage === 1}
            className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 h-2/3 w-16 flex items-center justify-center text-pale/70 hover:text-pale focus:outline-none disabled:opacity-30"
            aria-label="Previous page"
          >
            ◀
          </button>
          <button
            type="button"
            onClick={goNext}
            disabled={activePage === totalPages}
            className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 h-2/3 w-16 flex items-center justify-center text-pale/70 hover:text-pale focus:outline-none disabled:opacity-30"
            aria-label="Next page"
          >
            ▶
          </button>
        </div>
      </div>

      <footer className="px-6 md:px-10 pb-8 flex flex-col gap-4">
        <div className="pixel-card w-full max-w-5xl mx-auto text-sm text-dim grid md:grid-cols-3 gap-3">
          <div>
            <strong>Dedication:</strong> {book.dedication}
          </div>
          <div>
            <strong>Moral:</strong> {book.moral}
          </div>
          <div>
            <strong>Aesthetic notes:</strong> {book.aestheticNotes}
          </div>
        </div>
        <div className="flex items-center justify-center gap-4 text-sm text-pale/70">
          <span>{activePage.toString().padStart(2, "0")}</span>
          <div className="h-2 w-44 rounded-full overflow-hidden bg-pale/20">
            <div className="h-full bg-sunset" style={{ width: `${progress}%` }} />
          </div>
          <span>{totalPages.toString().padStart(2, "0")}</span>
        </div>
      </footer>
    </section>
  );
}
