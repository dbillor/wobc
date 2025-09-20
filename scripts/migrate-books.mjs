import { promises as fs } from "node:fs";
import path from "node:path";
import process from "node:process";

const DATA_DIR = path.join(process.cwd(), "data");
const LEGACY_FILE = path.join(DATA_DIR, "books.json");
const BOOKS_DIR = path.join(DATA_DIR, "books");
const FILENAME_SUFFIX = ".json";
const MAX_SLUG_LENGTH = 60;

function slugify(title) {
  const fallback = "story";
  const trimmed = (title ?? "").toString().trim().toLowerCase();
  if (!trimmed) return fallback;

  const normalized = trimmed
    .normalize("NFKD")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return normalized.slice(0, MAX_SLUG_LENGTH) || fallback;
}

function buildFileName(book) {
  const slug = slugify(book.title);
  return `${slug}-${book.id}${FILENAME_SUFFIX}`;
}

async function ensureBooksDir() {
  await fs.mkdir(BOOKS_DIR, { recursive: true });
}

async function removeExistingFilesForId(id, keepPath) {
  const entries = await fs.readdir(BOOKS_DIR, { withFileTypes: true }).catch(
    (error) => {
      if (error.code === "ENOENT") {
        return [];
      }
      throw error;
    }
  );

  await Promise.all(
    entries
      .filter((entry) =>
        entry.isFile()
          ? entry.name === `${id}${FILENAME_SUFFIX}` ||
            entry.name.endsWith(`-${id}${FILENAME_SUFFIX}`)
          : false
      )
      .map((entry) => {
        const entryPath = path.join(BOOKS_DIR, entry.name);
        if (entryPath === keepPath) return null;
        return fs.unlink(entryPath).catch((error) => {
          if (error.code !== "ENOENT") throw error;
        });
      })
      .filter(Boolean)
  );
}

async function migrate() {
  let raw;
  try {
    raw = await fs.readFile(LEGACY_FILE, "utf-8");
  } catch (error) {
    if (error.code === "ENOENT") {
      console.log("No legacy books.json found. Nothing to migrate.");
      return;
    }
    throw error;
  }

  let data;
  try {
    data = JSON.parse(raw);
  } catch (error) {
    console.error("Failed to parse books.json; aborting.");
    throw error;
  }

  if (!Array.isArray(data)) {
    throw new Error("Legacy books.json did not contain an array");
  }

  await ensureBooksDir();

  for (const book of data) {
    if (!book || typeof book !== "object") continue;
    if (!book.id) {
      console.warn("Skipping book without id", book);
      continue;
    }

    const fileName = buildFileName(book);
    const filePath = path.join(BOOKS_DIR, fileName);
    const payload = JSON.stringify(book, null, 2);

    await fs.writeFile(filePath, payload, "utf-8");
    await removeExistingFilesForId(book.id, filePath);
    console.log(`Created ${path.relative(process.cwd(), filePath)}`);
  }

  const backupPath = `${LEGACY_FILE}.bak`;
  await fs.rename(LEGACY_FILE, backupPath);
  console.log(`Legacy file renamed to ${path.relative(process.cwd(), backupPath)}`);
}

migrate().catch((error) => {
  console.error("Migration failed", error);
  process.exitCode = 1;
});
