import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "World of Bookcraft",
  description:
    "Write luminous baby books with rich prompts, gorgeous art direction, and pixel-perfect continuity.",
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
