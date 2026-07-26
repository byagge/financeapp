import { NextRequest, NextResponse } from "next/server";
import NextAuth from "next-auth";
import createMiddleware from "next-intl/middleware";
import { authConfig } from "@/lib/auth.config";
import { routing } from "@/i18n/routing";

const { auth } = NextAuth(authConfig);
const intlMiddleware = createMiddleware(routing);

const publicPaths = ["/login"];

export default auth((req) => {
  const { pathname } = req.nextUrl;

  if (
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  const localeMatch = pathname.match(/^\/(ru|uz)(\/|$)/);
  const locale = localeMatch?.[1] ?? "ru";
  const pathWithoutLocale = pathname.replace(/^\/(ru|uz)/, "") || "/";
  const isPublic = publicPaths.some(
    (p) => pathWithoutLocale === p || pathWithoutLocale.startsWith(`${p}/`)
  );

  const isLoggedIn = !!req.auth;

  if (!isLoggedIn && !isPublic) {
    const url = req.nextUrl.clone();
    url.pathname = `/${locale}/login`;
    return NextResponse.redirect(url);
  }

  if (isLoggedIn && isPublic) {
    const url = req.nextUrl.clone();
    url.pathname = `/${locale}`;
    return NextResponse.redirect(url);
  }

  return intlMiddleware(req as unknown as NextRequest);
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icons|sw.js|workbox|manifest.webmanifest).*)",
  ],
};
