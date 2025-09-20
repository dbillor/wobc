import { promises as fs } from "node:fs";
import path from "node:path";

import { GeneratedBook } from "@/lib/types/story";
import { normalizePlaceholderUrl } from "@/lib/utils/image-placeholders";

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

async function readBookFile(filePath: string) {
  const raw = await fs.readFile(filePath, "utf-8");
  const parsed = JSON.parse(raw) as GeneratedBook;
  return normalizeBookImages(parsed);
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
  const normalized = normalizeBookImages(book);
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
  } catch (error) {
    handleMissingFile(error);
  }
}
