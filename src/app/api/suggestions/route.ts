import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ensureSeedData, resolveSessionProfile, getAllProfiles } from "@/lib/data";
import { suggestSimilarProfiles } from "@/lib/hybridSearch";
import { SESSION_COOKIE } from "@/lib/auth/session";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  await ensureSeedData();
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  const allProfiles = await getAllProfiles();
  const currentProfile = await resolveSessionProfile(token);

  const suggestions = suggestSimilarProfiles(currentProfile, allProfiles, 12);
  return NextResponse.json({ suggestions }, { headers: { "Cache-Control": "no-store, max-age=0" } });
}
