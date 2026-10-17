import { getSessionCookie } from "better-auth/cookies";
import { NextRequest, NextResponse } from "next/server";

const PUBLIC_PATHS = ["/login", "/api/auth", "/api/public", "/api/backups/run"];

const authRateLimitedPrefixes = [
  "/api/auth/sign-in",
  "/api/auth/sign-up",
  "/api/auth/two-factor",
];

const authHits = new Map<string, { count: number; resetAt: number }>();

function rateLimitAuth(ip: string) {
  const now = Date.now();
  const key = `auth:${ip}`;
  const existing = authHits.get(key);
  if (!existing || existing.resetAt <= now) {
    authHits.set(key, { count: 1, resetAt: now + 60_000 });
    return true;
  }
  if (existing.count >= 20) return false;
  existing.count += 1;
  return true;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (authRateLimitedPrefixes.some((prefix) => pathname.startsWith(prefix))) {
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "unknown";
    if (!rateLimitAuth(ip)) {
      return NextResponse.json(
        { error: "Too many authentication attempts." },
        { status: 429, headers: { "Retry-After": "60" } },
      );
    }
  }

  const isPublic = PUBLIC_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );

  if (isPublic) {
    return NextResponse.next();
  }

  const sessionCookie = getSessionCookie(request);
  if (!sessionCookie) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
