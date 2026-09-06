import { NextRequest, NextResponse } from "next/server";
import { ensureSeedData, getGlobePins } from "@/lib/data";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: NextRequest) {
  await ensureSeedData();
  const { searchParams } = new URL(req.url);
  const programs = searchParams.get("programs")?.split(",").filter(Boolean);
  const divisions = searchParams.get("divisions")?.split(",").filter(Boolean);
  const industries = searchParams.get("industries")?.split(",").filter(Boolean);

  const pins = await getGlobePins({ programs, divisions, industries });
  return NextResponse.json(
    { pins, updatedAt: new Date().toISOString() },
    { headers: { "Cache-Control": "no-store, max-age=0" } }
  );
}
