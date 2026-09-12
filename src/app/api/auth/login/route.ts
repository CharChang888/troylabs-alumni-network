import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { isEmailDomainAllowed } from "@/lib/auth/domain-check";
import {
  ensureSeedData,
  loginWithEmail,
  loginWithPassword,
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
  const body = await req.json();
  const email = typeof body.email === "string" ? body.email.trim() : "";
  const password = typeof body.password === "string" ? body.password : "";
  const redirect = body.redirect;
  const intent = body.intent === "signup" || body.intent === "magic" ? body.intent : "login";

  if (!email) {
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
  const nextPath = safeNextPath(redirect);

  if (isSupabaseConfigured()) {
    // Returning users: email + password
    if (intent === "login" && password) {
      const result = await loginWithPassword(email, password);
      if ("error" in result) {
        return NextResponse.json(
          {
            error:
              result.error.includes("Invalid") || result.error.includes("credentials")
                ? "Incorrect email or password. New here? Use Sign up for a magic link, then set a password."
                : result.error,
          },
          { status: 400 }
        );
      }
      return NextResponse.json({
        user: result.user,
        profileComplete: result.profile.profile_complete,
        passwordSet: true,
      });
    }

    // Sign up (or login fallback): magic link
    if (intent === "signup" || intent === "magic" || (intent === "login" && !password)) {
      cookieStore.set(AUTH_NEXT_COOKIE, nextPath, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 10,
        path: "/",
      });
      const result = await sendMagicLink(email, `${req.nextUrl.origin}/auth/callback`, {
        createUser: intent === "signup",
      });
      if ("error" in result) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }
      return NextResponse.json({
        magicLink: true,
        intent: intent === "login" ? "magic" : intent,
      });
    }

    return NextResponse.json({ error: "Password required to log in" }, { status: 400 });
  }

  // Demo mode: email-only continue
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
