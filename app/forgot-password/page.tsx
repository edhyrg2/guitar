"use client";

import * as React from "react";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowLeft01Icon, Mail01Icon } from "@hugeicons/core-free-icons";

import { GuitarIcon } from "@/components/guitar-icon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function ForgotPasswordPage() {
  const [email, setEmail] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [submitted, setSubmitted] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const response = await fetch("/api/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const payload = (await response.json()) as { error?: string };

      if (!response.ok) {
        setError(payload.error ?? "Something went wrong. Please try again.");
        return;
      }

      setSubmitted(true);
    } finally {
      setSubmitting(false);
    }
  }

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

        {submitted ? (
          <div className="grid gap-5">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight">Check your email</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                If an account exists for <span className="font-medium text-foreground">{email}</span>, we have sent a password reset link. Check your inbox and spam folder.
              </p>
            </div>
            <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-300">
              Reset link sent. The link expires in 1 hour.
            </div>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
            >
              <HugeiconsIcon icon={ArrowLeft01Icon} strokeWidth={2} className="size-4" />
              Back to sign in
            </Link>
          </div>
        ) : (
          <div className="grid gap-6">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight">Forgot your password?</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Enter your email address and we will send you a link to reset your password.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="grid gap-5">
              <label className="grid gap-1.5">
                <span className="text-sm font-medium text-foreground">Email</span>
                <div className="relative">
                  <HugeiconsIcon
                    icon={Mail01Icon}
                    strokeWidth={2}
                    className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
                  />
                  <Input
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="h-11 pl-9"
                    required
                  />
                </div>
              </label>

              {error ? (
                <p className="rounded-lg border border-destructive/30 bg-destructive/8 px-3 py-2.5 text-sm text-destructive">
                  {error}
                </p>
              ) : null}

              <Button type="submit" className="h-11 w-full" disabled={submitting || !email.trim()}>
                {submitting ? "Sending..." : "Send reset link"}
              </Button>
            </form>

            <Link
              href="/login"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
            >
              <HugeiconsIcon icon={ArrowLeft01Icon} strokeWidth={2} className="size-4" />
              Back to sign in
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
