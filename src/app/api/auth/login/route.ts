import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { isEmailDomainAllowed } from "@/lib/auth/domain-check";
import {
  ensureSeedData,
  loginWithEmail,
  getAllowedDomains,
  sendMagicLink,
} from "@/lib/data";
import { isSupabaseConfigured } from "@/lib/env";
import { AUTH_NEXT_COOKIE, SESSION_COOKIE, safeNextPath } from "@/lib/auth/session";

export async function GET() {
  return NextResponse.json({ mode: isSupabaseConfigured() ? "magic" : "demo" });
}

export async function POST(req: NextRequest) {
  await ensureSeedData();
  const { email, redirect } = await req.json();

  if (!email || typeof email !== "string") {
    return NextResponse.json({ error: "Email required" }, { status: 400 });
  }

  const domains = (await getAllowedDomains()).map((d) => d.domain);
  if (!isEmailDomainAllowed(email, domains)) {
    return NextResponse.json(
      { error: "Your email domain is not approved. Contact TL leadership for access." },
      { status: 403 }
    );
  }

  const cookieStore = await cookies();

  if (isSupabaseConfigured()) {
    cookieStore.set(AUTH_NEXT_COOKIE, safeNextPath(redirect), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 10,
      path: "/",
    });
    const result = await sendMagicLink(email, `${req.nextUrl.origin}/auth/callback`);
    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json({ magicLink: true });
  }

  const result = await loginWithEmail(email);
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  cookieStore.set(SESSION_COOKIE, result.user.email, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
  });

  return NextResponse.json({
    user: result.user,
    profileComplete: result.profile.profile_complete,
  });
}
