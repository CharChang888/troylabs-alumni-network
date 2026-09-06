import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { AUTH_NEXT_COOKIE, safeNextPath } from "@/lib/auth/constants";
import { getProfileByUserId } from "@/lib/data";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const cookieStore = await cookies();
  const next = safeNextPath(cookieStore.get(AUTH_NEXT_COOKIE)?.value);
  cookieStore.delete(AUTH_NEXT_COOKIE);

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=auth`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return NextResponse.redirect(`${origin}/login?error=auth`);
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const profile = user ? await getProfileByUserId(user.id) : null;
  const destination = profile?.profile_complete ? next : "/profile";
  return NextResponse.redirect(`${origin}${destination}`);
}
