import { NextRequest, NextResponse } from "next/server";

import { createStoryOrchestrator } from "@/lib/services/story-orchestrator";
import { listBooks } from "@/lib/repository/book-repository";
import { parseStoryIntent } from "@/lib/validation/story-intent";
import { StoryJobProgress } from "@/lib/types/story";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET() {
  const books = await listBooks();
  return NextResponse.json({ books });
}

export async function POST(request: NextRequest) {
  const orchestrator = createStoryOrchestrator();

  try {
    const payload = await request.json();
    const intent = parseStoryIntent(payload.intent ?? payload);

    const steps: StoryJobProgress[] = [];

    const { book, progress } = await orchestrator.generateBook(intent, (entry) => {
      steps.push(entry);
    });

    return NextResponse.json({ book, progressTrace: steps, finalProgress: progress });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Book generation failed", error);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
