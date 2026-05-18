import { redirect } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  DashboardSquare01Icon,
  NoteIcon,
  SecurityCheckIcon,
} from "@hugeicons/core-free-icons";

import { GuitarIcon } from "@/components/guitar-icon";
import { LoginForm } from "@/components/login-form";
import { getSafeServerSession } from "@/lib/auth-session";

type LoginPageProps = {
  searchParams?: Promise<{
    callbackUrl?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const session = await getSafeServerSession();

  if (session) {
    redirect("/");
  }

  const resolvedSearchParams = (await searchParams) ?? {};
  const callbackUrl = resolvedSearchParams.callbackUrl || "/";

  return (
    <main className="grid min-h-screen lg:grid-cols-[minmax(0,1.1fr)_minmax(360px,520px)]">
      <section className="relative hidden overflow-hidden border-r border-border/70 bg-sidebar text-sidebar-foreground lg:flex">
        <div className="flex w-full flex-col justify-between p-10">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground">
              <GuitarIcon className="size-5" />
            </div>
            <div>
              <div className="text-sm font-medium">Wiring Diagrams</div>
              <div className="text-xs text-sidebar-foreground/70">
                for Guitar
              </div>
            </div>
          </div>

          <div className="grid max-w-xl gap-6">
            <div className="grid gap-3">
              <h1 className="text-4xl font-semibold tracking-tight">
                Access the wiring workspace
              </h1>
              <p className="max-w-lg text-sm leading-6 text-sidebar-foreground/75">
                Authenticate with a database user account to manage templates,
                components, and source references.
              </p>
            </div>
            <div className="grid gap-3">
              {[
                {
                  icon: DashboardSquare01Icon,
                  label: "Protected dashboard and master data routes",
                },
                {
                  icon: SecurityCheckIcon,
                  label: "Credentials checked against the Prisma user table",
                },
                {
                  icon: NoteIcon,
                  label: "Session carries user level and active status",
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex items-center gap-3 rounded-md border border-white/10 bg-white/5 px-4 py-3"
                >
                  <HugeiconsIcon
                    icon={item.icon}
                    strokeWidth={2}
                    className="size-4"
                  />
                  <span className="text-sm text-sidebar-foreground/85">
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="text-xs text-sidebar-foreground/60">
            Seed login default: any seeded email + password{" "}
            <span className="font-medium text-sidebar-foreground">
              Demo123!
            </span>
          </div>
        </div>
      </section>

      <section className="flex min-h-screen items-center justify-center bg-background px-6 py-10">
        <div className="w-full max-w-md rounded-lg border border-border/70 bg-card p-6 shadow-sm">
          <div className="mb-6 grid gap-2">
            <div className="flex items-center gap-3 lg:hidden">
              <div className="flex size-9 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground">
                <GuitarIcon className="size-4.5" />
              </div>
              <div>
                <div className="text-sm font-medium">Wiring Diagrams</div>
                <div className="text-xs text-muted-foreground">for Guitar</div>
              </div>
            </div>
            <h2 className="text-2xl font-semibold tracking-tight">Sign in</h2>
            <p className="text-sm text-muted-foreground">
              Use a user account from the database to enter the app.
            </p>
          </div>

          <LoginForm callbackUrl={callbackUrl} />

          <div className="mt-6 rounded-md border border-border/70 bg-background px-3 py-3 text-sm text-muted-foreground">
            For local seeded data, use one of the existing user emails and
            password <span className="font-medium text-foreground">Demo123!</span>.
          </div>
        </div>
      </section>
    </main>
  );
}
