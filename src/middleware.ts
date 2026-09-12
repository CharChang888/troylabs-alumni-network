import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE } from "@/lib/auth/constants";
import { isSupabaseConfigured } from "@/lib/env";
import { updateSession } from "@/lib/supabase/middleware";

const protectedPaths = ["/home", "/globe", "/profile", "/members", "/admin", "/set-password"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isProtected = protectedPaths.some((p) => pathname.startsWith(p));

  if (isSupabaseConfigured()) {
    const { user, response } = await updateSession(request);

    if (isProtected && !user) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }

    const passwordSet = Boolean(user?.user_metadata?.password_set);
    if (user && !passwordSet && pathname !== "/set-password") {
      const setup = new URL("/set-password", request.url);
      if (pathname !== "/login") setup.searchParams.set("next", pathname);
      return NextResponse.redirect(setup);
    }

    if (pathname === "/login" && user && passwordSet) {
      return NextResponse.redirect(new URL("/home", request.url));
    }

    return response;
  }

  const session = request.cookies.get(SESSION_COOKIE)?.value;

  if (isProtected && !session) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (pathname === "/login" && session) {
    return NextResponse.redirect(new URL("/home", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/home/:path*",
    "/globe/:path*",
    "/profile/:path*",
    "/members/:path*",
    "/admin/:path*",
    "/set-password",
    "/login",
  ],
};
