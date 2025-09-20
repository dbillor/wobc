'use client';

import { FormEvent, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const passcode = formData.get("passcode")?.toString() ?? "";

    startTransition(async () => {
      setError(null);
      const response = await fetch("/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ passcode }),
      });

      if (response.ok) {
        router.replace("/studio");
        router.refresh();
        return;
      }

      const payload = await response.json().catch(() => ({ error: "Unable to sign in." }));
      setError(typeof payload.error === "string" ? payload.error : "Unable to sign in.");
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="pixel-card w-full max-w-md p-8 flex flex-col gap-6 text-pale"
    >
      <header className="space-y-2 text-center">
        <h1 className="text-2xl font-semibold">Welcome back</h1>
        <p className="text-sm text-dim">
          Enter the shared passcode to open the Nanobanana story studio.
        </p>
      </header>
      <label className="flex flex-col gap-2 text-sm">
        <span className="uppercase tracking-[0.35em] text-sunset">Passcode</span>
        <input
          name="passcode"
          type="password"
          className="pixel-input"
          placeholder="Enter passcode"
          required
          minLength={3}
          autoFocus
          disabled={isPending}
        />
      </label>
      {error && (
        <div className="pixel-alert" role="alert">
          {error}
        </div>
      )}
      <button type="submit" className="pixel-button" disabled={isPending}>
        {isPending ? "Unlocking..." : "Unlock studio"}
      </button>
    </form>
  );
}
