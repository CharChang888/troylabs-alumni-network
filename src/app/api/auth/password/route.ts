import { NextRequest, NextResponse } from "next/server";
import { setAccountPassword } from "@/lib/data";
import { getCurrentUser } from "@/lib/auth/current-user";
import { isSupabaseConfigured } from "@/lib/env";
import { safeNextPath } from "@/lib/auth/session";
import { getProfileByUserId } from "@/lib/data";

export async function POST(req: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Not available in demo mode" }, { status: 400 });
  }

  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const password = typeof body.password === "string" ? body.password : "";
  const next = safeNextPath(body.next);

  const result = await setAccountPassword(password);
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  const profile = await getProfileByUserId(user.id);
  return NextResponse.json({
    ok: true,
    redirectTo: profile?.profile_complete ? next : "/profile",
  });
}
