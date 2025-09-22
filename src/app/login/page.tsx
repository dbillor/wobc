import Link from "next/link";
import { Suspense } from "react";

import { LoginForm } from "./LoginForm";

export const metadata = {
  title: "Sign in | Nanobanana Story Studio",
};

export default function LoginPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-ink via-midnight to-plum text-pale px-4 sm:px-8 py-16 relative overflow-hidden">
      <div className="absolute inset-0 bg-starfield pointer-events-none" aria-hidden />
      <div className="relative flex flex-col items-center gap-8">
        <div className="text-center space-y-2">
          <p className="text-xs uppercase tracking-[0.35em] text-sunset">Nanobanana Studio</p>
          <h1 className="text-3xl font-semibold">Sign in to craft illustrated stories</h1>
        </div>
        <Suspense fallback={<span className="sr-only">Loading sign-in form...</span>}>
          <LoginForm />
        </Suspense>
        <p className="text-xs text-dim">Forgot the passcode? Hint: we keep it in the family.</p>
        <Link href="/" className="text-xs text-sunset underline">
          Return home
        </Link>
      </div>
    </main>
  );
}
