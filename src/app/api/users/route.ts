import { NextResponse } from "next/server";
import { ensureSeedData, getUsers, listAllProfiles, getAlumniInvites } from "@/lib/data";
import { requireAdmin } from "@/lib/auth/current-user";

export const dynamic = "force-dynamic";

export async function GET() {
  await ensureSeedData();
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const [users, profiles, invites] = await Promise.all([
    getUsers(),
    listAllProfiles(),
    getAlumniInvites(),
  ]);

  return NextResponse.json({ users, profiles, invites });
}
