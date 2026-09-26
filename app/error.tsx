"use client";

import { useEffect } from "react";
import { AlertCircle } from "lucide-react";
import Button from "@/components/ui/Button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="relative min-h-screen overflow-hidden bg-canvas flex flex-col items-center justify-center px-4 text-center">
      <div aria-hidden className="pointer-events-none absolute left-1/2 top-1/2 h-[700px] w-[700px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(ellipse,rgb(227_18_27/0.08)_0%,transparent_70%)] blur-[60px]" />

      <div className="relative mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-brand/10 text-brand ring-1 ring-brand/25">
        <AlertCircle size={36} />
      </div>

      <h1 className="relative text-3xl sm:text-4xl font-bold tracking-tight">Something went wrong</h1>
      <p className="relative mt-3 max-w-md text-sm sm:text-base leading-relaxed text-fg-muted">
        This page hit an unexpected error. Try again, and if it keeps happening, go back home.
      </p>

      {error?.message && (
        <p className="relative mt-4 max-w-md rounded-lg bg-brand/10 px-4 py-2 font-mono text-xs text-danger ring-1 ring-brand/20">
          {error.message}
        </p>
      )}

      <div className="relative mt-8 flex flex-col sm:flex-row items-center gap-3">
        <Button size="lg" onClick={reset}>Try again</Button>
        <Button href="/" size="lg" variant="secondary">Back to home</Button>
      </div>
    </div>
  );
}
