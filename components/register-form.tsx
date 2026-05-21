"use client";

import * as React from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowRight01Icon,
  ViewIcon,
  ViewOffIcon,
  LockPasswordIcon,
  Mail01Icon,
  UserIcon,
} from "@hugeicons/core-free-icons";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type RegisterFormProps = {
  callbackUrl: string;
};

export function RegisterForm({ callbackUrl }: RegisterFormProps) {
  const router = useRouter();
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirm, setShowConfirm] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  const passwordStrength = React.useMemo(() => {
    if (!password) return null;
    if (password.length < 8) return { label: "Too short", level: 0 };
    let score = 0;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    if (score === 0) return { label: "Weak", level: 1 };
    if (score === 1) return { label: "Fair", level: 2 };
    if (score === 2) return { label: "Good", level: 3 };
    return { label: "Strong", level: 4 };
  }, [password]);

  const strengthColors = ["bg-destructive", "bg-destructive", "bg-amber-400", "bg-emerald-400", "bg-emerald-500"];
  const strengthTextColors = ["text-destructive", "text-destructive", "text-amber-500", "text-emerald-500", "text-emerald-500"];

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (!passwordStrength || passwordStrength.level === 0) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const payload = (await response.json()) as { error?: string };

      if (!response.ok) {
        setError(payload.error ?? "Registration failed. Please try again.");
        return;
      }

      // Auto sign-in after successful registration
      const result = await signIn("credentials", {
        email,
        password,
        callbackUrl,
        redirect: false,
      });

      if (!result || result.error) {
        // Registration succeeded but auto-login failed — redirect to login with success message
        router.push(`/login?registered=1&callbackUrl=${encodeURIComponent(callbackUrl)}`);
        return;
      }

      router.push(result.url ?? callbackUrl);
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  const isValid =
    name.trim().length >= 2 &&
    email.trim().length > 0 &&
    password.length >= 8 &&
    confirmPassword.length > 0;

  return (
    <form onSubmit={handleSubmit} className="grid gap-5">
      {/* Name */}
      <label className="grid gap-1.5">
        <span className="text-sm font-medium text-foreground">Full name</span>
        <div className="relative">
          <HugeiconsIcon
            icon={UserIcon}
            strokeWidth={2}
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            type="text"
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            className="h-11 pl-9"
            required
          />
        </div>
      </label>

      {/* Email */}
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

      {/* Password */}
      <div className="grid gap-1.5">
        <label className="grid gap-1.5">
          <span className="text-sm font-medium text-foreground">Password</span>
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

        {/* Strength indicator */}
        {password.length > 0 && passwordStrength && (
          <div className="grid gap-1.5">
            <div className="flex gap-1">
              {[1, 2, 3, 4].map((level) => (
                <div
                  key={level}
                  className={`h-1 flex-1 rounded-full transition-colors ${
                    passwordStrength.level >= level
                      ? strengthColors[passwordStrength.level]
                      : "bg-border"
                  }`}
                />
              ))}
            </div>
            <p className={`text-xs ${strengthTextColors[passwordStrength.level]}`}>
              {passwordStrength.label}
            </p>
          </div>
        )}
      </div>

      {/* Confirm password */}
      <label className="grid gap-1.5">
        <span className="text-sm font-medium text-foreground">Confirm password</span>
        <div className="relative">
          <HugeiconsIcon
            icon={LockPasswordIcon}
            strokeWidth={2}
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            type={showConfirm ? "text" : "password"}
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
          <button
            type="button"
            tabIndex={-1}
            onClick={() => setShowConfirm((v) => !v)}
            className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <HugeiconsIcon
              icon={showConfirm ? ViewOffIcon : ViewIcon}
              strokeWidth={2}
              className="size-4"
            />
          </button>
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
        disabled={submitting || !isValid}
      >
        {submitting ? "Creating account..." : "Create account"}
        {!submitting && (
          <HugeiconsIcon
            icon={ArrowRight01Icon}
            strokeWidth={2}
            data-icon="inline-end"
          />
        )}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-medium text-foreground underline-offset-4 hover:underline"
        >
          Sign in
        </Link>
      </p>
    </form>
  );
}
