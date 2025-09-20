'use client';

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";

const loadingBeats = [
  {
    title: "Sketching constellations",
    body: "Finding the perfect arc for each page spread...",
  },
  {
    title: "Humming lullaby logic",
    body: "Layering emotional beats so the lesson feels gentle and deep.",
  },
  {
    title: "Binding pixel threads",
    body: "Weaving consistent character cues for Nanobanana to follow.",
  },
  {
    title: "Charging starlight palettes",
    body: "Dusting each prompt with dreamy lighting and soft-focus magic.",
  },
];

export function LoadingCarousel() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((value) => (value + 1) % loadingBeats.length);
    }, 2400);

    return () => clearInterval(timer);
  }, []);

  const beat = loadingBeats[index];

  return (
    <div className="pixel-card w-full max-w-2xl py-10 text-center flex flex-col items-center gap-4 animate-pulse-subtle">
      <AnimatePresence mode="wait">
        <motion.div
          key={beat.title}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.4 }}
          className="flex flex-col gap-2"
        >
          <p className="text-xs uppercase tracking-[0.35em] text-sunset">Generating</p>
          <h2 className="text-2xl font-semibold text-pale">{beat.title}</h2>
          <p className="text-sm text-pastel/80 max-w-md mx-auto">{beat.body}</p>
        </motion.div>
      </AnimatePresence>
      <div className="flex gap-2">
        {loadingBeats.map((_, idx) => (
          <span
            key={idx}
            className={`h-2 w-10 rounded-full bg-pastel/20 ${idx === index ? "bg-sunset" : ""}`}
          />
        ))}
      </div>
    </div>
  );
}

