import { NextRequest, NextResponse } from "next/server";

import { findBook } from "@/lib/repository/book-repository";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const book = await findBook(id);

  if (!book) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ book });
}
