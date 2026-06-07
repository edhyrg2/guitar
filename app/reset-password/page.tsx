"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowLeft01Icon,
  LockPasswordIcon,
  ViewIcon,
  ViewOffIcon,
} from "@hugeicons/core-free-icons";

import { GuitarIcon } from "@/components/guitar-icon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [done, setDone] = React.useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch("/api/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const payload = (await response.json()) as { error?: string };

      if (!response.ok) {
        setError(payload.error ?? "Something went wrong. Please try again.");
        return;
      }

      setDone(true);
      setTimeout(() => {
        router.push("/login?reset=1");
      }, 2000);
    } finally {
      setSubmitting(false);
    }
  }

  if (!token) {
    return (
      <div className="grid gap-5">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Invalid reset link</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            This password reset link is missing a token. Please request a new one.
          </p>
        </div>
        <Link
          href="/forgot-password"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <HugeiconsIcon icon={ArrowLeft01Icon} strokeWidth={2} className="size-4" />
          Request a new link
        </Link>
      </div>
    );
  }

  if (done) {
    return (
      <div className="grid gap-5">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Password updated</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Your password has been reset. Redirecting you to sign in...
          </p>
        </div>
        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-300">
          Success! You can now sign in with your new password.
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Reset your password</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Enter a new password for your account.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-5">
        <label className="grid gap-1.5">
          <span className="text-sm font-medium text-foreground">New password</span>
          <div className="relative">
            <HugeiconsIcon
              icon={LockPasswordIcon}
              strokeWidth={2}
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="h-11 pl-9 pr-10"
              required
            />
            <button
              type="button"
              tabIndex={-1}
              onClick={() => setShowPassword((v) => !v)}
              className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <HugeiconsIcon
                icon={showPassword ? ViewOffIcon : ViewIcon}
                strokeWidth={2}
                className="size-4"
              />
            </button>
          </div>
        </label>

        <label className="grid gap-1.5">
          <span className="text-sm font-medium text-foreground">Confirm new password</span>
          <div className="relative">
            <HugeiconsIcon
              icon={LockPasswordIcon}
              strokeWidth={2}
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              className={`h-11 pl-9 pr-10 ${
                confirmPassword && confirmPassword !== password
                  ? "border-destructive focus-visible:ring-destructive/30"
                  : ""
              }`}
              required
            />
          </div>
          {confirmPassword && confirmPassword !== password && (
            <p className="text-xs text-destructive">Passwords do not match.</p>
          )}
        </label>

        {error ? (
          <p className="rounded-lg border border-destructive/30 bg-destructive/8 px-3 py-2.5 text-sm text-destructive">
            {error}
          </p>
        ) : null}

        <Button
          type="submit"
          className="h-11 w-full"
          disabled={submitting || !password || !confirmPassword}
        >
          {submitting ? "Updating..." : "Reset password"}
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
  );
}

export default function ResetPasswordPage() {
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
          <ResetPasswordForm />
        </React.Suspense>
      </div>
    </main>
  );
}
