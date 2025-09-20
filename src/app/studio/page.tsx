import { StudioShell } from "@/components/StudioShell";

export default function StudioPage() {
  return (
    <main className="min-h-screen w-full bg-gradient-to-br from-ink via-midnight to-plum text-pale px-4 sm:px-8 py-16 relative overflow-hidden">
      <div className="absolute inset-0 bg-starfield pointer-events-none" aria-hidden />
      <div className="relative mx-auto max-w-6xl flex flex-col items-center gap-12">
        <StudioShell />
      </div>
    </main>
  );
}
