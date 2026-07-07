import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

type UserLevel = "USER" | "DEVELOPER" | "MASTER";

const roleWeight: Record<UserLevel, number> = {
  USER: 0,
  DEVELOPER: 1,
  MASTER: 2,
};

type RateBucket = { count: number; resetAt: number };
const rateBuckets = new Map<string, RateBucket>();

const rateLimits: Array<{ match: RegExp; max: number; windowMs: number }> = [
  { match: /^\/api\/auth\/callback\/credentials$/, max: 10, windowMs: 60_000 },
  { match: /^\/api\/auth\//, max: 30, windowMs: 60_000 },
  { match: /^\/api\/register$/, max: 5, windowMs: 60_000 },
  { match: /^\/api\/forgot-password$/, max: 5, windowMs: 60_000 },
  { match: /^\/api\/reset-password$/, max: 5, windowMs: 60_000 },
  { match: /^\/api\/verify-email$/, max: 10, windowMs: 60_000 },
  { match: /^\/api\/resend-verification$/, max: 3, windowMs: 60_000 },
];

function clientIp(request: NextRequest): string {
  const fwd = request.headers.get("x-forwarded-for");
  const real = request.headers.get("x-real-ip");
  return (fwd?.split(",")[0]?.trim() || real?.trim() || "unknown").slice(0, 64);
}

function checkRate(pathname: string, ip: string): { allowed: boolean; retryAfter: number; limit: number } {
  const limit = rateLimits.find((l) => l.match.test(pathname));
  if (!limit) return { allowed: true, retryAfter: 0, limit: 0 };
  const key = `${ip}::${pathname}`;
  const now = Date.now();
  const b = rateBuckets.get(key);
  if (!b || b.resetAt < now) {
    rateBuckets.set(key, { count: 1, resetAt: now + limit.windowMs });
    return { allowed: true, retryAfter: 0, limit: limit.max };
  }
  if (b.count >= limit.max) {
    return { allowed: false, retryAfter: Math.ceil((b.resetAt - now) / 1000), limit: limit.max };
  }
  b.count += 1;
  return { allowed: true, retryAfter: 0, limit: limit.max };
}

const masterOnlyPrefixes = ["/users"];

const developerPrefixes = ["/ai", "/guitar", "/master-data", "/wiring"];

const authenticatedOnlyPrefixes = [
  "/explore",
  "/custom-builder",
  "/custom-component",
  "/my-design",
  "/dashboard",
  "/saved-setups",
];

const masterOnlyApiPrefixes: string[] = [];

const developerApiPrefixes = [
  "/api/ai-diagram-import",
  "/api/brands",
  "/api/capacitors",
  "/api/component-assets",
  "/api/component-connection-points",
  "/api/diagram-sources",
  "/api/guitar-brands",
  "/api/guitar-models",
  "/api/mods",
  "/api/pickup-configurations",
  "/api/pickup-models",
  "/api/pickup-types",
  "/api/pot-types",
  "/api/resistors",
  "/api/switch-types",
  "/api/wire-color-schemas",
  "/api/wire-types",
  "/api/wiring-template-components",
  "/api/wiring-template-connections",
  "/api/wiring-templates",
];

const authenticatedOnlyApiPrefixes = [
  "/api/builder-saved-setups",
  "/api/custom-builder-publish",
  "/api/custom-component-drafts",
  "/api/custom-component-publish",
  "/api/my-design/profile",
];

function matchesPrefix(pathname: string, prefix: string) {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

function matchesAnyPrefix(pathname: string, prefixes: string[]) {
  return prefixes.some((prefix) => matchesPrefix(pathname, prefix));
}

function getRequiredLevel(pathname: string): UserLevel | null {
  if (matchesAnyPrefix(pathname, masterOnlyPrefixes)) {
    return "MASTER";
  }

  if (matchesAnyPrefix(pathname, developerPrefixes)) {
    return "DEVELOPER";
  }

  if (matchesAnyPrefix(pathname, authenticatedOnlyPrefixes)) {
    return "USER";
  }

  return null;
}

function getRequiredApiLevel(pathname: string): UserLevel | null {
  if (matchesAnyPrefix(pathname, masterOnlyApiPrefixes)) {
    return "MASTER";
  }

  if (matchesAnyPrefix(pathname, developerApiPrefixes)) {
    return "DEVELOPER";
  }

  if (matchesAnyPrefix(pathname, authenticatedOnlyApiPrefixes)) {
    return "USER";
  }

  if (pathname.startsWith("/api/")) {
    return "USER";
  }

  return null;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Rate limit: applies to sensitive auth endpoints only
  if (pathname.startsWith("/api/")) {
    const rl = checkRate(pathname, clientIp(request));
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        {
          status: 429,
          headers: {
            "Retry-After": rl.retryAfter.toString(),
            "X-RateLimit-Limit": rl.limit.toString(),
            "X-RateLimit-Remaining": "0",
          },
        }
      );
    }
  }

  // Always allow auth, register, and password/email endpoints
  if (
    pathname.startsWith("/api/auth/") ||
    pathname.startsWith("/api/register") ||
    pathname.startsWith("/api/forgot-password") ||
    pathname.startsWith("/api/reset-password") ||
    pathname.startsWith("/api/verify-email") ||
    pathname.startsWith("/api/resend-verification")
  ) {
    return NextResponse.next();
  }

  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
    secureCookie: process.env.NODE_ENV === "production",
  });

  const requiredLevel = pathname.startsWith("/api/")
    ? getRequiredApiLevel(pathname)
    : getRequiredLevel(pathname);

  // Public route — no auth needed
  if (!requiredLevel) {
    return NextResponse.next();
  }

  // Not authenticated
  if (!token?.id || !token?.isActive) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const signInUrl = new URL("/login", request.url);
    signInUrl.searchParams.set("callbackUrl", request.nextUrl.href);

    return NextResponse.redirect(signInUrl);
  }

  // Check role level
  const currentLevel = token.level as UserLevel | undefined;
  const hasRequiredLevel =
    currentLevel && roleWeight[currentLevel] >= roleWeight[requiredLevel];

  if (hasRequiredLevel) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Insufficient role — redirect to home (public gallery)
  return NextResponse.redirect(new URL("/", request.url));
}

export const config = {
  matcher: [
    "/api/:path*",
    "/explore",
    "/explore/:path*",
    "/dashboard",
    "/dashboard/:path*",
    "/saved-setups",
    "/saved-setups/:path*",
    "/my-design/:path*",
    "/users/:path*",
    "/ai/:path*",
    "/custom-builder/:path*",
    "/custom-component/:path*",
    "/guitar/:path*",
    "/master-data/:path*",
    "/wiring/:path*",
  ],
};
