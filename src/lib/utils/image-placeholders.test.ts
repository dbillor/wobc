import { describe, expect, it } from "vitest";

import { normalizePlaceholderUrl } from "@/lib/utils/image-placeholders";

describe("normalizePlaceholderUrl", () => {
  it("returns original url when not a placeholder", () => {
    expect(normalizePlaceholderUrl("https://example.com/image.png", 1, "Theme")).toBe(
      "https://example.com/image.png"
    );
  });

  it("appends .png and format parameter for legacy placeholder urls", () => {
    const normalized = normalizePlaceholderUrl(
      "https://placehold.co/768x1024/1b1b3a/eeeeff?text=Page%201",
      2,
      "Starlit forest"
    );

    const parsed = new URL(normalized);

    expect(parsed.pathname.endsWith(".png")).toBe(true);
    expect(parsed.searchParams.get("format")).toBe("png");
    expect(parsed.searchParams.get("text")).toBe("Page 1");
  });

  it("leaves modern placeholder urls intact", () => {
    const url = "https://placehold.co/768x1024/1b1b3a/eeeeff.png?text=Page+1&format=png";
    expect(normalizePlaceholderUrl(url, 3, "Theme")).toBe(url);
  });
});
