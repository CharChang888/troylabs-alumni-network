import { NextRequest, NextResponse } from "next/server";
import { ensureSeedData, getProfileById } from "@/lib/data";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  await ensureSeedData();
  const profile = await getProfileById(params.id);
  if (!profile) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ profile }, { headers: { "Cache-Control": "no-store, max-age=0" } });
}
