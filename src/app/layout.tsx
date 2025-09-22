import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "World of Bookcraft",
  description:
    "Craft illustrated stories for little dreamers and adult thinkers with rich prompts, adaptive tones, and continuity-aware art direction.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
