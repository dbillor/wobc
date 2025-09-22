import { promises as fs } from "node:fs";
import path from "node:path";

import { GeneratedBook } from "@/lib/types/story";
import { normalizePlaceholderUrl } from "@/lib/utils/image-placeholders";
import {
  deleteBookImages,
  persistPageImageFromDataUrl,
} from "@/lib/repository/page-image-repository";

const DATA_DIR = path.join(process.cwd(), "data");
const BOOKS_DIR = path.join(DATA_DIR, "books");

const FILENAME_SUFFIX = ".json";
const MAX_SLUG_LENGTH = 60;

async function ensureBooksDir() {
  await fs.mkdir(BOOKS_DIR, { recursive: true });
}

function slugify(title: string) {
  const fallback = "story";
  const trimmed = title.trim().toLowerCase();
  if (!trimmed) return fallback;

  const normalized = trimmed
    .normalize("NFKD")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  const candidate = normalized.slice(0, MAX_SLUG_LENGTH) || fallback;
  return candidate;
}

function buildFileName(book: GeneratedBook) {
  const slug = slugify(book.title);
  return `${slug}-${book.id}${FILENAME_SUFFIX}`;
}

function buildFilePath(fileName: string) {
  return path.join(BOOKS_DIR, fileName);
}

async function findFileById(id: string) {
  await ensureBooksDir();
  const entries = await fs.readdir(BOOKS_DIR, { withFileTypes: true });
  const match = entries.find(
    (entry) => entry.isFile() && entry.name.endsWith(`-${id}${FILENAME_SUFFIX}`)
  );
  return match ? buildFilePath(match.name) : null;
}

interface NormalizedBookResult {
  book: GeneratedBook;
  mutated: boolean;
}

async function normalizeBookImages(book: GeneratedBook): Promise<NormalizedBookResult> {
  if (!book.id) {
    return { book, mutated: false };
  }

  let mutated = false;
  let normalizedBook = book;

  if (!normalizedBook.intent?.audience) {
    normalizedBook = {
      ...normalizedBook,
      intent: {
        ...normalizedBook.intent,
        audience: "child",
      },
    };
    mutated = true;
  }

  const pages = await Promise.all(
    normalizedBook.pages.map(async (page) => {
      if (!page.imageUrl) {
        return page;
      }

      if (page.imageUrl.startsWith("data:image")) {
        try {
          const persisted = await persistPageImageFromDataUrl(
            book.id,
            page.pageNumber,
            page.imageUrl
          );
          if (persisted) {
            mutated = true;
            return {
              ...page,
              imageUrl: persisted.relativePath,
            };
          }
        } catch (error) {
          console.warn(
            `Failed to persist inline image for book ${book.id} page ${page.pageNumber}:`,
            error
          );
        }
      }

      const normalizedUrl = normalizePlaceholderUrl(
        page.imageUrl,
        page.pageNumber,
        normalizedBook.intent.theme
      );

      if (normalizedUrl === page.imageUrl) {
        return page;
      }

      mutated = true;
      return {
        ...page,
        imageUrl: normalizedUrl,
      };
    })
  );

  if (!mutated) {
    return { book: normalizedBook, mutated: false };
  }

  return {
    book: {
      ...normalizedBook,
      pages,
    },
    mutated: true,
  };
}

async function readBookFile(filePath: string) {
  const raw = await fs.readFile(filePath, "utf-8");
  const parsed = JSON.parse(raw) as GeneratedBook;
  const { book, mutated } = await normalizeBookImages(parsed);
  if (mutated) {
    try {
      await fs.writeFile(filePath, JSON.stringify(book, null, 2), "utf-8");
    } catch (error) {
      console.warn(`Failed to rewrite normalized book ${book.id}:`, error);
    }
  }
  return book;
}

async function removeStaleFiles(id: string, keepPath: string) {
  const entries = await fs.readdir(BOOKS_DIR, { withFileTypes: true });

  await Promise.all(
    entries
      .filter(
        (entry) =>
          entry.isFile() &&
          entry.name.endsWith(`-${id}${FILENAME_SUFFIX}`) &&
          buildFilePath(entry.name) !== keepPath
      )
      .map((entry) => fs.unlink(buildFilePath(entry.name)).catch(handleMissingFile))
  );
}

function handleMissingFile(error: unknown) {
  if (error && typeof error === "object" && "code" in error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return;
    }
  }
  throw error;
}

export async function listBooks() {
  await ensureBooksDir();
  const entries = await fs.readdir(BOOKS_DIR, { withFileTypes: true });
  const jsonFiles = entries.filter(
    (entry) => entry.isFile() && entry.name.endsWith(FILENAME_SUFFIX)
  );

  const books: GeneratedBook[] = [];
  for (const entry of jsonFiles) {
    try {
      const book = await readBookFile(buildFilePath(entry.name));
      books.push(book);
    } catch (error) {
      console.warn(`Failed to read book file ${entry.name}:`, error);
    }
  }

  return books.sort((a, b) => {
    const aDate = a.createdAt ?? "";
    const bDate = b.createdAt ?? "";
    return bDate.localeCompare(aDate);
  });
}

export async function findBook(id: string) {
  const filePath = await findFileById(id);
  if (!filePath) {
    return null;
  }
  try {
    return await readBookFile(filePath);
  } catch (error) {
    console.warn(`Failed to read book ${id} from ${filePath}:`, error);
    return null;
  }
}

export async function saveBook(book: GeneratedBook) {
  await ensureBooksDir();
  const { book: normalized } = await normalizeBookImages(book);
  const fileName = buildFileName(normalized);
  const filePath = buildFilePath(fileName);
  await fs.writeFile(filePath, JSON.stringify(normalized, null, 2), "utf-8");
  await removeStaleFiles(normalized.id, filePath);
}

export async function deleteBook(id: string) {
  const filePath = await findFileById(id);
  if (!filePath) {
    return;
  }
  try {
    await fs.unlink(filePath);
    await deleteBookImages(id);
  } catch (error) {
    handleMissingFile(error);
  }
}
