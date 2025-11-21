import Link from "next/link";
import { notFound } from "next/navigation";

import { StandaloneReader } from "@/components/StandaloneReader";
import { findBook } from "@/lib/repository/book-repository";

interface BookPageProps {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ page?: string }>;
}

export const dynamic = "force-dynamic";

export default async function BookPage({ params, searchParams }: BookPageProps) {
  const { id } = await params;
  const query = searchParams ? await searchParams : undefined;
  const requestedPage = query?.page ? Number(query.page) : 1;

  const book = await findBook(id);
  if (!book) {
    notFound();
  }

  const createdLabel = (() => {
    if (!book.createdAt) return null;
    const parsed = new Date(book.createdAt);
    if (Number.isNaN(parsed.getTime())) return null;
    return parsed.toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  })();

  return (
    <main className="relative min-h-screen w-full overflow-hidden bg-gradient-to-br from-ink via-midnight to-plum text-pale">
      <div className="absolute inset-0 bg-starfield opacity-70 pointer-events-none" aria-hidden />
      <div className="relative mx-auto max-w-6xl px-4 sm:px-8 py-12 flex flex-col gap-10">
        <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted">
          <Link href="/studio" className="text-sunset underline underline-offset-4">
            ← Back to studio
          </Link>
          {createdLabel && <span className="text-faint">Created {createdLabel}</span>}
        </div>
        <StandaloneReader book={book} initialPage={requestedPage} />
      </div>
    </main>
  );
}
