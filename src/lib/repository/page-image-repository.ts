import { promises as fs } from "node:fs";
import path from "node:path";

const DATA_ROOT = path.join(process.cwd(), "data");
const IMAGE_ROOT = path.join(DATA_ROOT, "book-images");

const MIME_TO_EXTENSION: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/webp": "webp",
};

const EXTENSION_TO_MIME = Object.fromEntries(
  Object.entries(MIME_TO_EXTENSION).map(([mime, ext]) => [ext, mime])
) as Record<string, string>;

function getBookDir(bookId: string) {
  return path.join(IMAGE_ROOT, bookId);
}

function getPageBasename(pageNumber: number) {
  return `page-${pageNumber.toString().padStart(2, "0")}`;
}

function inferExtension(mimeType: string) {
  return MIME_TO_EXTENSION[mimeType] ?? "png";
}

function inferMimeTypeFromFile(fileName: string) {
  const ext = path.extname(fileName).replace(/\./, "").toLowerCase();
  return EXTENSION_TO_MIME[ext] ?? "image/png";
}

function isDataUrl(candidate: string) {
  return candidate.startsWith("data:");
}

function parseDataUrl(dataUrl: string) {
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) {
    throw new Error("Unsupported data URL format");
  }
  const [, mimeType, base64] = match;
  return { mimeType, base64 };
}

async function ensureBookDir(bookId: string) {
  await fs.mkdir(getBookDir(bookId), { recursive: true });
}

async function removeOtherPageFiles(bookId: string, pageNumber: number, keepFile: string) {
  const dir = getBookDir(bookId);
  let entries: string[] = [];
  try {
    entries = await fs.readdir(dir);
  } catch (error) {
    if ((error as NodeJS.ErrnoException)?.code === "ENOENT") {
      return;
    }
    throw error;
  }

  const basename = getPageBasename(pageNumber);
  await Promise.all(
    entries
      .filter((entry) => entry.startsWith(basename) && path.join(dir, entry) !== keepFile)
      .map((entry) => fs.unlink(path.join(dir, entry)).catch((err) => {
        if ((err as NodeJS.ErrnoException)?.code === "ENOENT") {
          return;
        }
        throw err;
      }))
  );
}

export async function persistPageImageFromDataUrl(
  bookId: string,
  pageNumber: number,
  dataUrl: string
) {
  if (!isDataUrl(dataUrl)) {
    return null;
  }

  const { mimeType, base64 } = parseDataUrl(dataUrl);
  const extension = inferExtension(mimeType);

  await ensureBookDir(bookId);
  const fileName = `${getPageBasename(pageNumber)}.${extension}`;
  const filePath = path.join(getBookDir(bookId), fileName);
  const buffer = Buffer.from(base64, "base64");
  await fs.writeFile(filePath, buffer);
  await removeOtherPageFiles(bookId, pageNumber, filePath);

  return {
    filePath,
    relativePath: `/api/books/${bookId}/pages/${pageNumber}/image`,
    mimeType,
  } as const;
}

export async function findPageImageFile(bookId: string, pageNumber: number) {
  const dir = getBookDir(bookId);
  try {
    const entries = await fs.readdir(dir);
    const basename = getPageBasename(pageNumber);
    const match = entries.find((entry) => entry.startsWith(basename));
    if (!match) {
      return null;
    }
    const filePath = path.join(dir, match);
    return {
      filePath,
      mimeType: inferMimeTypeFromFile(match),
    } as const;
  } catch (error) {
    if ((error as NodeJS.ErrnoException)?.code === "ENOENT") {
      return null;
    }
    throw error;
  }
}

export async function deleteBookImages(bookId: string) {
  const dir = getBookDir(bookId);
  try {
    await fs.rm(dir, { recursive: true, force: true });
  } catch (error) {
    if ((error as NodeJS.ErrnoException)?.code === "ENOENT") {
      return;
    }
    throw error;
  }
}
