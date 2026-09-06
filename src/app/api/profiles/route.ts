import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ensureSeedData, resolveSessionProfile, resolveSessionUser, updateProfile } from "@/lib/data";
import { SESSION_COOKIE } from "@/lib/auth/session";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  await ensureSeedData();
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return NextResponse.json({ user: null, profile: null });

  const user = await resolveSessionUser(token);
  const profile = await resolveSessionProfile(token);
  if (!user || !profile) {
    cookieStore.delete(SESSION_COOKIE);
    return NextResponse.json({ user: null, profile: null, stale: true }, { status: 401 });
  }

  return NextResponse.json(
    { user: { id: user.id, email: user.email }, profile },
    { headers: { "Cache-Control": "no-store, max-age=0" } }
  );
}

export async function PATCH(req: NextRequest) {
  await ensureSeedData();
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await resolveSessionUser(token);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const updates = await req.json();
  const profile = await updateProfile(user.id, updates);
  return NextResponse.json({ profile }, { headers: { "Cache-Control": "no-store, max-age=0" } });
}
