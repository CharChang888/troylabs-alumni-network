import { NextRequest, NextResponse } from "next/server";
import { geocodeCity } from "@/lib/geocode";

export async function GET(req: NextRequest) {
  const q = new URL(req.url).searchParams.get("q");
  if (!q) return NextResponse.json({ error: "Query required" }, { status: 400 });

  const result = await geocodeCity(q);
  if (!result) return NextResponse.json({ error: "Location not found" }, { status: 404 });
  return NextResponse.json({ result });
}
