import { NextRequest, NextResponse } from "next/server";
import { ensureSeedData, getAllProfiles, matchAudience } from "@/lib/data";

export async function POST(req: NextRequest) {
  await ensureSeedData();
  const { audience_filters } = await req.json();
  const profiles = await getAllProfiles();
  const recipients = matchAudience(profiles, audience_filters ?? {});
  return NextResponse.json({ count: recipients.length });
}
