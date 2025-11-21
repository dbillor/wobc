'use client';

import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import type { TouchEvent } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { normalizePlaceholderUrl } from "@/lib/utils/image-placeholders";
import { useBookStore } from "@/state/book-store";

const pageVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 60 : -60,
    rotate: direction > 0 ? 1.5 : -1.5,
    opacity: 0,
    scale: 0.98,
  }),
  center: {
    x: 0,
    rotate: 0,
    opacity: 1,
    scale: 1,
    transition: { duration: 0.4, ease: "easeOut" },
  },
  exit: (direction: number) => ({
    x: direction > 0 ? -60 : 60,
    rotate: direction > 0 ? -1.4 : 1.4,
    opacity: 0,
    scale: 0.98,
    transition: { duration: 0.3, ease: "easeIn" },
  }),
};

export function BookViewer() {
  const book = useBookStore((state) => state.book);
  const activePage = useBookStore((state) => state.activePage);
  const setActivePage = useBookStore((state) => state.setActivePage);
  const closeBook = useBookStore((state) => state.closeBook);
  const [showPrompt, setShowPrompt] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);
  const [direction, setDirection] = useState<1 | -1>(1);
  const touchStartX = useRef<number | null>(null);

  const currentPage = useMemo(() => {
    if (!book) return null;
    return book.pages.find((page) => page.pageNumber === activePage) ?? null;
  }, [book, activePage]);

  const pageCopyLines = useMemo(() => {
    if (!currentPage) return [] as string[];
    const copy = currentPage.pageText || currentPage.narrative;
    return copy
      .split(/\n+/)
      .map((entry) => entry.trim())
      .filter(Boolean);
  }, [currentPage]);

  const goPrev = useCallback(() => {
    setDirection(-1);
    setActivePage(activePage - 1);
  }, [activePage, setActivePage]);

  const goNext = useCallback(() => {
    setDirection(1);
    setActivePage(activePage + 1);
  }, [activePage, setActivePage]);

  const handleTouchStart = useCallback((event: TouchEvent) => {
    touchStartX.current = event.touches[0]?.clientX ?? null;
  }, []);

  const handleTouchEnd = useCallback(
    (event: TouchEvent) => {
      if (touchStartX.current === null) return;
      const delta =
        (event.changedTouches[0]?.clientX ?? touchStartX.current) - touchStartX.current;
      if (delta > 48) {
        goPrev();
      } else if (delta < -48) {
        goNext();
      }
      touchStartX.current = null;
    },
    [goNext, goPrev]
  );

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
        setDirection(1);
        goNext();
      }
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        setDirection(-1);
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
    setShowTranscript(false);
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
      <div className="absolute inset-0 -z-20 bg-gradient-to-br from-[rgb(9,3,27)] via-[rgb(16,10,38)] to-[rgb(28,14,60)]" />
      <div className="absolute inset-0 -z-10 opacity-70 bg-[radial-gradient(circle_at_18%_20%,rgba(255,126,219,0.10),transparent_42%),radial-gradient(circle_at_80%_12%,rgba(117,80,255,0.12),transparent_46%),radial-gradient(circle_at_40%_78%,rgba(255,255,255,0.08),transparent_40%)]" />

      <header className="flex items-center justify-between px-4 md:px-8 pt-4 pb-2">
        <div className="flex flex-col gap-1">
          <p className="text-[11px] uppercase tracking-[0.32em] text-[#7d6e61]">
            World of Bookcraft
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-xl md:text-2xl font-semibold leading-tight">{book.title}</h2>
            <span className="reader-chip">
              Page {activePage.toString().padStart(2, "0")} / {totalPages.toString().padStart(2, "0")}
            </span>
          </div>
          <p className="text-xs text-[#766c78] max-w-2xl">{book.subtitle}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden md:inline text-xs text-[#827689]">Swipe or use arrow keys</span>
          <button type="button" onClick={closeBook} className="reader-button">
            Close ✕
          </button>
        </div>
      </header>

      <div className="flex-1 flex flex-col gap-4 px-3 md:px-8 pb-6">
        <div className="w-full max-w-6xl mx-auto flex-1 flex flex-col gap-4">
          <div className="relative flex-1 flex items-center justify-center">
            <AnimatePresence mode="wait" custom={direction}>
              <motion.figure
                key={currentPage.pageNumber}
                custom={direction}
                variants={pageVariants}
                initial="enter"
                animate="center"
                exit="exit"
                className="reader-page-frame"
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
              >
                {imageSrc ? (
                  <Image
                    src={imageSrc}
                    alt={currentPage.headline}
                    fill
                    sizes="(max-width: 768px) 100vw, 720px"
                    className="object-cover"
                    unoptimized
                    priority
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-center text-[#807486]">
                    Illustration placeholder
                  </div>
                )}
                <div className="reader-page-vignette" />
                <div className="reader-page-number">
                  <span className="font-semibold text-sm">{currentPage.headline}</span>
                  <span className="text-xs text-[#6b5d6c]">Page {currentPage.pageNumber}</span>
                </div>
                <AnimatePresence>
                  {showTranscript && (
                    <motion.div
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 12 }}
                      transition={{ duration: 0.25 }}
                      className="reader-transcript"
                    >
                      <p className="text-[11px] uppercase tracking-[0.22em] text-[#796b6f]">
                        On-page text
                      </p>
                      <div className="flex flex-col gap-2 text-sm leading-relaxed text-[#352f3d]">
                        {pageCopyLines.length ? (
                          pageCopyLines.map((line, index) => <p key={index}>{line}</p>)
                        ) : (
                          <p>Text renders directly inside the illustration.</p>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.figure>
            </AnimatePresence>
            <button
              type="button"
              onClick={goPrev}
              disabled={activePage === 1}
              className="reader-nav reader-nav-left"
              aria-label="Previous page"
            >
              ◀
            </button>
            <button
              type="button"
              onClick={goNext}
              disabled={activePage === totalPages}
              className="reader-nav reader-nav-right"
              aria-label="Next page"
            >
              ▶
            </button>
          </div>

          <div className="reader-card grid gap-3 md:grid-cols-[1fr_auto] items-start">
            <div className="flex flex-wrap gap-2">
              {currentPage.keyMoments.length ? (
                currentPage.keyMoments.map((moment) => (
                  <span key={moment} className="reader-chip subtle">
                    {moment}
                  </span>
                ))
              ) : (
                <span className="text-xs text-[#7a6f7e]">Key beats will appear here.</span>
              )}
            </div>
            <div className="flex flex-wrap gap-2 justify-start md:justify-end">
              <button
                type="button"
                className="reader-button secondary"
                onClick={() => setShowTranscript((state) => !state)}
              >
                {showTranscript ? "Hide transcript" : "Show transcript"}
              </button>
              <button
                type="button"
                className="reader-button secondary"
                onClick={() => setShowPrompt((state) => !state)}
              >
                {showPrompt ? "Hide art notes" : "Art direction"}
              </button>
            </div>
            {showPrompt && (
              <div className="reader-subcard md:col-span-2">
                <p className="text-[11px] uppercase tracking-[0.25em] text-[#7f6c6f]">
                  Illustrator prompt
                </p>
                <p className="text-sm text-[#3c3443] leading-relaxed whitespace-pre-line">
                  {currentPage.illustrationPrompt}
                </p>
              </div>
            )}
          </div>

          <div className="reader-card grid gap-3 md:grid-cols-3 text-sm text-[#493f50]">
            <div>
              <strong className="text-ink">Dedication:</strong> {book.dedication}
            </div>
            <div>
              <strong className="text-ink">Moral:</strong> {book.moral}
            </div>
            <div>
              <strong className="text-ink">Aesthetic:</strong> {book.aestheticNotes}
            </div>
          </div>

          <div className="flex items-center gap-3 justify-center text-sm text-[#6d6072]">
            <span className="reader-chip subtle">
              {activePage.toString().padStart(2, "0")}
            </span>
            <div className="reader-progress">
              <div className="reader-progress-fill" style={{ width: `${progress}%` }} />
            </div>
            <span className="reader-chip subtle">
              {totalPages.toString().padStart(2, "0")}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
