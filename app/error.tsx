"use client";

import * as React from "react";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { AlertCircleIcon, ArrowLeft01Icon, ReloadIcon } from "@hugeicons/core-free-icons";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    if (process.env.NODE_ENV !== "production") {
      // eslint-disable-next-line no-console
      console.error("App error boundary caught:", error);
    }
  }, [error]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6 py-12">
      <div className="w-full max-w-md text-center">
        <div className="mx-auto mb-6 flex size-12 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
          <HugeiconsIcon icon={AlertCircleIcon} strokeWidth={2} className="size-6" />
        </div>
        <p className="text-sm font-medium text-muted-foreground">Something went wrong</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Unexpected error</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          We hit an unexpected problem loading this page. You can retry, or head back to the
          gallery.
        </p>
        {error.digest && (
          <p className="mt-2 font-mono text-xs text-muted-foreground/70">
            Reference: {error.digest}
          </p>
        )}
        <div className="mt-8 flex justify-center gap-3">
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
          >
            <HugeiconsIcon icon={ReloadIcon} strokeWidth={2} className="size-4" />
            Try again
          </button>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-md border px-4 py-2 text-sm font-medium transition hover:bg-muted"
          >
            <HugeiconsIcon icon={ArrowLeft01Icon} strokeWidth={2} className="size-4" />
            Back to gallery
          </Link>
        </div>
      </div>
    </main>
  );
}
