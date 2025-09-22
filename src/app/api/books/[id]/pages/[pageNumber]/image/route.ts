import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { Readable } from "node:stream";

import { NextRequest, NextResponse } from "next/server";

import { findPageImageFile } from "@/lib/repository/page-image-repository";

export const runtime = "nodejs";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string; pageNumber: string }> }
) {
  const { id, pageNumber } = await context.params;
  const numericPage = Number(pageNumber);

  if (!Number.isInteger(numericPage) || numericPage < 1) {
    return NextResponse.json({ error: "Invalid page" }, { status: 400 });
  }

  const file = await findPageImageFile(id, numericPage);
  if (!file) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const fileStats = await stat(file.filePath);
  const nodeStream = Readable.toWeb(createReadStream(file.filePath));

  return new NextResponse(nodeStream as unknown as ReadableStream, {
    headers: {
      "Content-Type": file.mimeType,
      "Content-Length": fileStats.size.toString(),
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
