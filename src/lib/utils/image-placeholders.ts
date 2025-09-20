const PLACEHOLDER_HOST = "placehold.co";

const safeTheme = (theme: string) => theme.replace(/[^a-z0-9]+/gi, " ").trim();

/**
 * Ensure placeholder URLs request PNG assets so Next.js doesn't block SVG responses.
 */
export function normalizePlaceholderUrl(
  url: string,
  pageNumber: number,
  theme: string
): string {
  if (!url || !url.startsWith("http") || !url.includes(PLACEHOLDER_HOST)) {
    return url;
  }

  try {
    const placeholderUrl = new URL(url);
    placeholderUrl.searchParams.set("format", "png");

    if (!placeholderUrl.pathname.endsWith(".png")) {
      const segments = placeholderUrl.pathname.split("/");
      const last = segments.pop() ?? "";
      if (!last.endsWith(".png")) {
        segments.push(`${last}.png`);
        const normalizedPath = segments.join("/");
        placeholderUrl.pathname = normalizedPath.startsWith("/")
          ? normalizedPath
          : `/${normalizedPath}`;
      }
    }

    if (!placeholderUrl.searchParams.has("text")) {
      placeholderUrl.searchParams.set(
        "text",
        `Page ${pageNumber}\n${safeTheme(theme)}`
      );
    }

    return placeholderUrl.toString();
  } catch {
    return url;
  }
}
