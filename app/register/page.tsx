import { redirect } from "next/navigation";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  GridIcon,
  LockPasswordIcon,
  StarIcon,
} from "@hugeicons/core-free-icons";

import { GuitarIcon } from "@/components/guitar-icon";
import { RegisterForm } from "@/components/register-form";
import { getSafeServerSession } from "@/lib/auth-session";

type RegisterPageProps = {
  searchParams?: Promise<{
    callbackUrl?: string;
  }>;
};

const FEATURES = [
  {
    icon: GridIcon,
    title: "Wiring templates",
    description: "Browse and manage hundreds of guitar wiring diagrams.",
  },
  {
    icon: StarIcon,
    title: "Custom components",
    description: "Design and publish your own pickup and hardware assets.",
  },
  {
    icon: LockPasswordIcon,
    title: "Secure workspace",
    description: "Role-based access with session-backed authentication.",
  },
];

export default async function RegisterPage({ searchParams }: RegisterPageProps) {
  const session = await getSafeServerSession();

  if (session) {
    redirect("/");
  }

  const resolvedSearchParams = (await searchParams) ?? {};
  const callbackUrl = resolvedSearchParams.callbackUrl || "/";

  return (
    <main className="min-h-screen lg:grid lg:grid-cols-[1fr_minmax(400px,480px)]">
      {/* Left panel */}
      <section className="relative hidden flex-col overflow-hidden bg-sidebar text-sidebar-foreground lg:flex">
        {/* Subtle grid pattern */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />

        <div className="relative flex h-full flex-col justify-between p-10 xl:p-14">
          {/* Logo */}
          <Link href="/" className="flex w-fit items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground shadow-sm">
              <GuitarIcon className="size-4.5" />
            </div>
            <div>
              <div className="text-sm font-semibold leading-tight">Guitar Wire</div>
              <div className="text-[11px] text-sidebar-foreground/60">Diagram Studio</div>
            </div>
          </Link>

          {/* Hero */}
          <div className="grid max-w-sm gap-8">
            <div className="grid gap-4">
              <h1 className="text-3xl font-semibold leading-tight tracking-tight xl:text-4xl">
                Join the community of guitar builders.
              </h1>
              <p className="text-sm leading-relaxed text-sidebar-foreground/70">
                Create your free account and start building, sharing, and
                exploring guitar wiring diagrams with a growing community.
              </p>
            </div>

            <div className="grid gap-3">
              {FEATURES.map((item) => (
                <div
                  key={item.title}
                  className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3.5 backdrop-blur-sm"
                >
                  <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md bg-white/10">
                    <HugeiconsIcon icon={item.icon} strokeWidth={2} className="size-3.5" />
                  </div>
                  <div>
                    <div className="text-sm font-medium">{item.title}</div>
                    <div className="mt-0.5 text-xs text-sidebar-foreground/60">{item.description}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <p className="text-xs text-sidebar-foreground/40">
            © {new Date().getFullYear()} Guitar Wire
          </p>
        </div>
      </section>

      {/* Right panel */}
      <section className="flex min-h-screen flex-col items-center justify-center bg-background px-6 py-12">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <div className="flex size-9 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
              <GuitarIcon className="size-4.5" />
            </div>
            <div>
              <div className="text-sm font-semibold">Guitar Wire</div>
              <div className="text-xs text-muted-foreground">Diagram Studio</div>
            </div>
          </div>

          {/* Heading */}
          <div className="mb-8 grid gap-1.5">
            <h2 className="text-2xl font-semibold tracking-tight">Create an account</h2>
            <p className="text-sm text-muted-foreground">
              Free forever. No credit card required.
            </p>
          </div>

          <RegisterForm callbackUrl={callbackUrl} />
        </div>
      </section>
    </main>
  );
}
