'use client';

import { useEffect } from "react";
import { motion } from "framer-motion";

import { useBookStore } from "@/state/book-store";

export function LibraryShelf() {
  const library = useBookStore((state) => state.library);
  const fetchLibrary = useBookStore((state) => state.fetchLibrary);
  const selectBook = useBookStore((state) => state.selectBook);
  const currentBook = useBookStore((state) => state.book);

  useEffect(() => {
    fetchLibrary().catch(() => undefined);
  }, [fetchLibrary]);

  if (!library.length) {
    return (
      <div className="pixel-card w-full max-w-5xl text-center text-sm text-faint">
        No books saved yet. Spin up an adventure to start your cosmic shelf.
      </div>
    );
  }

  return (
    <section className="w-full max-w-5xl">
      <header className="flex items-center justify-between mb-4">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-sunset">Library</p>
          <h3 className="text-lg text-muted">Your handcrafted picture books</h3>
        </div>
      </header>
      <div className="grid gap-4 md:grid-cols-3">
        {library.map((book) => {
          const isActive = currentBook?.id === book.id;
          return (
            <motion.button
              key={book.id}
              whileHover={{ y: -4 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => selectBook(book.id)}
              className={`pixel-card text-left flex flex-col gap-3 ${
                isActive ? "outline outline-2" : ""
              }`}
              style={{ outlineColor: isActive ? "rgba(255, 126, 219, 0.6)" : undefined }}
            >
              <p className="text-xs uppercase tracking-[0.35em] text-sunset">
                {new Date(book.createdAt).toLocaleDateString()}
              </p>
              <h4 className="text-base font-semibold text-pale">{book.title}</h4>
              <p className="text-sm text-dim overflow-hidden text-ellipsis" style={{ display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical" }}>
                {book.subtitle}
              </p>
              <div className="text-xs text-faint">
                {book.pages.length} pages • {book.intent.tone} tone
              </div>
            </motion.button>
          );
        })}
      </div>
    </section>
  );
}
