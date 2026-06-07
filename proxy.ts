import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

type UserLevel = "USER" | "DEVELOPER" | "MASTER";

const roleWeight: Record<UserLevel, number> = {
  USER: 0,
  DEVELOPER: 1,
  MASTER: 2,
};

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

  // Always allow auth, register, and password/email endpoints
  if (
    pathname.startsWith("/api/auth/") ||
    pathname.startsWith("/api/register") ||
    pathname.startsWith("/api/forgot-password") ||
    pathname.startsWith("/api/reset-password") ||
    pathname.startsWith("/api/verify-email")
  ) {
    return NextResponse.next();
  }

  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
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
