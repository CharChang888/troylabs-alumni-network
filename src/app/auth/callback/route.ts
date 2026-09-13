import { NextResponse } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { AUTH_NEXT_COOKIE, safeNextPath } from "@/lib/auth/constants";
import { getProfileByUserId } from "@/lib/data";
import { ensureUserRecord } from "@/lib/data/supabase-store";
import { isSupabaseConfigured } from "@/lib/env";

function readCookie(request: Request, name: string): string | null {
  const raw = request.headers.get("cookie");
  if (!raw) return null;
  for (const part of raw.split(";")) {
    const trimmed = part.trim();
    if (!trimmed.startsWith(`${name}=`)) continue;
    return decodeURIComponent(trimmed.slice(name.length + 1));
  }
  return null;
}

function parseRequestCookies(request: Request) {
  const raw = request.headers.get("cookie") ?? "";
  return raw
    .split(";")
    .map((c) => c.trim())
    .filter(Boolean)
    .map((c) => {
      const i = c.indexOf("=");
      return {
        name: i === -1 ? c : c.slice(0, i),
        value: i === -1 ? "" : c.slice(i + 1),
      };
    });
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  const next = safeNextPath(readCookie(request, AUTH_NEXT_COOKIE) ?? searchParams.get("next"));

  if (!code && !(tokenHash && type)) {
    return NextResponse.redirect(`${origin}/login?error=auth`);
  }

  const pendingCookies: Array<{ name: string; value: string; options: CookieOptions }> = [];

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
    {
      cookies: {
        getAll() {
          return parseRequestCookies(request);
        },
        setAll(cookiesToSet) {
          pendingCookies.push(...cookiesToSet);
        },
      },
    }
  );

  let user = null as Awaited<ReturnType<typeof supabase.auth.getUser>>["data"]["user"];

  if (code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (error || !data.user) {
      return NextResponse.redirect(`${origin}/login?error=auth`);
    }
    user = data.user;
  } else if (tokenHash && type) {
    const { data, error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: type as "email" | "magiclink" | "signup" | "invite" | "recovery" | "email_change",
    });
    if (error || !data.user) {
      return NextResponse.redirect(`${origin}/login?error=auth`);
    }
    user = data.user;
  }

  if (!user) {
    return NextResponse.redirect(`${origin}/login?error=auth`);
  }

  if (isSupabaseConfigured()) {
    try {
      await ensureUserRecord(user);
    } catch (e) {
      console.error("ensureUserRecord after magic link", e);
    }
  }

  const passwordSet = Boolean(user.user_metadata?.password_set);
  let destination = `/set-password?next=${encodeURIComponent(next)}`;
  if (passwordSet) {
    const profile = await getProfileByUserId(user.id);
    destination = profile?.profile_complete ? next : "/profile";
  }

  const response = NextResponse.redirect(`${origin}${destination}`);
  pendingCookies.forEach(({ name, value, options }) => {
    response.cookies.set(name, value, options);
  });
  response.cookies.set(AUTH_NEXT_COOKIE, "", { path: "/", maxAge: 0 });
  return response;
}
