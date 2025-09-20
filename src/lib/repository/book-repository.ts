import { promises as fs } from "node:fs";
import path from "node:path";

import { GeneratedBook } from "@/lib/types/story";
import { normalizePlaceholderUrl } from "@/lib/utils/image-placeholders";

const DATA_DIR = path.join(process.cwd(), "data");
const BOOKS_PATH = path.join(DATA_DIR, "books.json");

async function ensureDataDir() {
  await fs.mkdir(DATA_DIR, { recursive: true });
}

async function readBooks(): Promise<GeneratedBook[]> {
  try {
    const raw = await fs.readFile(BOOKS_PATH, "utf-8");
    const parsed = JSON.parse(raw) as GeneratedBook[];
    return parsed.map(normalizeBookImages);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return [];
    }
    throw error;
  }
}

async function writeBooks(books: GeneratedBook[]) {
  await ensureDataDir();
  await fs.writeFile(BOOKS_PATH, JSON.stringify(books, null, 2), "utf-8");
}

export async function listBooks() {
  return readBooks();
}

export async function findBook(id: string) {
  const books = await readBooks();
  return books.find((book) => book.id === id) ?? null;
}

export async function saveBook(book: GeneratedBook) {
  const books = await readBooks();
  const normalized = normalizeBookImages(book);
  const existingIndex = books.findIndex((item) => item.id === normalized.id);

  if (existingIndex >= 0) {
    books[existingIndex] = normalized;
  } else {
    books.push(normalized);
  }

  await writeBooks(books);
}

export async function deleteBook(id: string) {
  const books = await readBooks();
  const filtered = books.filter((book) => book.id !== id);
  await writeBooks(filtered);
}

function normalizeBookImages(book: GeneratedBook): GeneratedBook {
  let mutated = false;

  const pages = book.pages.map((page) => {
    if (!page.imageUrl) {
      return page;
    }

    const normalizedUrl = normalizePlaceholderUrl(
      page.imageUrl,
      page.pageNumber,
      book.intent.theme
    );

    if (normalizedUrl === page.imageUrl) {
      return page;
    }

    mutated = true;
    return {
      ...page,
      imageUrl: normalizedUrl,
    };
  });

  if (!mutated) {
    return book;
  }

  return {
    ...book,
    pages,
  };
}
