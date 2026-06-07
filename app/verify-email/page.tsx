"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowLeft01Icon,
  CheckmarkCircle02Icon,
  AlertCircleIcon,
} from "@hugeicons/core-free-icons";

import { GuitarIcon } from "@/components/guitar-icon";

type VerifyState = "verifying" | "success" | "error";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [state, setState] = React.useState<VerifyState>("verifying");
  const [message, setMessage] = React.useState("");

  React.useEffect(() => {
    if (!token) {
      setState("error");
      setMessage("This verification link is missing a token.");
      return;
    }

    let cancelled = false;

    async function verify() {
      try {
        const response = await fetch("/api/verify-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });

        const payload = (await response.json()) as { error?: string; alreadyVerified?: boolean };

        if (cancelled) {
          return;
        }

        if (!response.ok) {
          setState("error");
          setMessage(payload.error ?? "Something went wrong. Please try again.");
          return;
        }

        setState("success");
        setMessage(
          payload.alreadyVerified
            ? "Your email was already verified. You can sign in."
            : "Your email has been verified. You can now sign in."
        );
      } catch {
        if (!cancelled) {
          setState("error");
          setMessage("Something went wrong. Please try again.");
        }
      }
    }

    void verify();

    return () => {
      cancelled = true;
    };
  }, [token]);

  if (state === "verifying") {
    return (
      <div className="grid gap-3">
        <h2 className="text-2xl font-semibold tracking-tight">Verifying your email...</h2>
        <p className="text-sm text-muted-foreground">Please wait a moment.</p>
      </div>
    );
  }

  if (state === "success") {
    return (
      <div className="grid gap-5">
        <div className="flex items-center gap-3">
          <HugeiconsIcon
            icon={CheckmarkCircle02Icon}
            strokeWidth={2}
            className="size-7 text-emerald-500"
          />
          <h2 className="text-2xl font-semibold tracking-tight">Email verified</h2>
        </div>
        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-300">
          {message}
        </div>
        <Link
          href="/login"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <HugeiconsIcon icon={ArrowLeft01Icon} strokeWidth={2} className="size-4" />
          Go to sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-5">
      <div className="flex items-center gap-3">
        <HugeiconsIcon
          icon={AlertCircleIcon}
          strokeWidth={2}
          className="size-7 text-destructive"
        />
        <h2 className="text-2xl font-semibold tracking-tight">Verification failed</h2>
      </div>
      <div className="rounded-lg border border-destructive/30 bg-destructive/8 px-4 py-3 text-sm text-destructive">
        {message}
      </div>
      <Link
        href="/login"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <HugeiconsIcon icon={ArrowLeft01Icon} strokeWidth={2} className="size-4" />
        Back to sign in
      </Link>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
            <GuitarIcon className="size-4.5" />
          </div>
          <div>
            <div className="text-sm font-semibold">Guitar Wiring</div>
            <div className="text-xs text-muted-foreground">Diagram Studio</div>
          </div>
        </div>

        <React.Suspense fallback={<div className="text-sm text-muted-foreground">Loading...</div>}>
          <VerifyEmailContent />
        </React.Suspense>
      </div>
    </main>
  );
}
