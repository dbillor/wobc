import Link from "next/link";
import { cookies } from "next/headers";

import { AUTH_COOKIE_NAME } from "@/lib/auth/constants";

export default async function HomePage() {
  const cookieStore = await cookies();
  const hasSession = Boolean(cookieStore.get(AUTH_COOKIE_NAME)?.value);

  const primaryCta = hasSession ? "/studio" : "/login";
  const childCta = hasSession ? "/studio?audience=child" : "/login?audience=child";
  const adultCta = hasSession ? "/studio?audience=adult" : "/login?audience=adult";

  return (
    <main className="min-h-screen w-full bg-gradient-to-br from-ink via-midnight to-plum text-pale px-4 sm:px-8 py-16 relative overflow-hidden">
      <div className="absolute inset-0 bg-starfield pointer-events-none" aria-hidden />
      <div className="relative mx-auto max-w-6xl flex flex-col gap-16">
        <header className="text-center flex flex-col items-center gap-6">
          <p className="text-xs uppercase tracking-[0.35em] text-sunset">World of Bookcraft</p>
          <h1 className="text-4xl md:text-5xl font-semibold tracking-tight">
            Weave illustrated worlds for every kind of reader.
          </h1>
          <p className="text-sm md:text-base max-w-2xl text-muted">
            World of Bookcraft is your AI-guided storytelling studio. Craft pixel-inspired bedtime adventures for little dreamers or explore
            contemplative, art-directed narratives for adult readers—all with cohesive prose, illustration prompts, and character continuity.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link href={primaryCta} className="pixel-button">
              {hasSession ? "Enter the studio" : "Unlock the studio"}
            </Link>
          </div>
        </header>

        <section className="grid gap-6 md:gap-8 md:grid-cols-2">
          <article className="pixel-card bg-[rgba(30,15,60,0.48)] border border-lighterInk/60 p-8 flex flex-col gap-4">
            <p className="text-xs uppercase tracking-[0.35em] text-sunset">For little listeners</p>
            <h2 className="text-2xl font-semibold">Baby & toddler picture books</h2>
            <p className="text-sm text-muted">
              Compose gentle narratives with clear lessons, recurring motifs, and cozy palettes. Tailor tones, lessons, and characters, then let
              our muse generate bedtime-perfect spreads with Nanobanana illustration prompts.
            </p>
            <div className="mt-auto">
              <Link href={childCta} className="pixel-button-sm">
                {hasSession ? "Open child-friendly workspace" : "Start a bedtime tale"}
              </Link>
            </div>
          </article>
          <article className="pixel-card bg-[rgba(18,8,40,0.55)] border border-lighterInk/60 p-8 flex flex-col gap-4">
            <p className="text-xs uppercase tracking-[0.35em] text-sunset">For deep thinkers</p>
            <h2 className="text-2xl font-semibold">Adult & philosophical narratives</h2>
            <p className="text-sm text-muted">
              Shift into mature storytelling that favors lyrical paragraphs, symbolic art direction, and complex emotional arcs. Prompt Nanobanana to paint
              moody illustrated scenes that honor your themes and protagonists.
            </p>
            <div className="mt-auto">
              <Link href={adultCta} className="pixel-button-sm">
                {hasSession ? "Explore adult mode" : "Begin a contemplative chronicle"}
              </Link>
            </div>
          </article>
        </section>

        <section className="pixel-card border border-lighterInk/60 p-8 grid gap-8 md:grid-cols-3 text-sm text-muted">
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-pale">Continuity aware</h3>
            <p>
              Each spread shares character reminders, lighting cues, and motifs so illustration outputs line up—even when you pivot from cozy nurseries
              to brooding observatories.
            </p>
          </div>
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-pale">Flexible tone</h3>
            <p>
              Pick from curated vibes or supply your own cadence. Our prompt engine adapts to sing-song storytelling for toddlers or reflective prose for
              grown readers.
            </p>
          </div>
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-pale">Illustration ready</h3>
            <p>
              Nanobanana receives camera notes, palette guidance, and continuity references, keeping your visual canon intact across both playful and profound modes.
            </p>
          </div>
        </section>

        <footer className="text-center text-xs text-dim flex flex-col gap-2">
          <p>Need to hop back in later? Save your generated books in the studio library and revisit any page.</p>
          {!hasSession && (
            <p>
              Already have the family passcode? <Link href="/login" className="text-sunset underline">Sign in to begin</Link>.
            </p>
          )}
        </footer>
      </div>
    </main>
  );
}
