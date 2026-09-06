import { NextRequest, NextResponse } from "next/server";
import {
  ensureSeedData,
  createCampaign,
  getCampaigns,
  getAllProfiles,
  matchAudience,
} from "@/lib/data";
import { sendBulkMessages, formatEventInvitation } from "@/lib/messaging/provider";
import { requireAdmin } from "@/lib/auth/current-user";

export async function GET() {
  await ensureSeedData();
  const campaigns = await getCampaigns();
  return NextResponse.json({ campaigns });
}

export async function POST(req: NextRequest) {
  await ensureSeedData();
  const currentUser = await requireAdmin();
  if (!currentUser) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();

  const profiles = await getAllProfiles();
  const recipients = matchAudience(profiles, body.audience_filters ?? {});

  let messageBody = body.body;
  if (body.event_name) {
    messageBody = formatEventInvitation(
      body.event_name,
      body.event_date ?? "TBD",
      body.event_location ?? "TBD",
      body.rsvp_url ?? process.env.NEXT_PUBLIC_APP_URL ?? ""
    );
  }

  const campaign = await createCampaign({
    created_by: currentUser.id,
    title: body.title,
    body: messageBody,
    event_name: body.event_name ?? null,
    event_date: body.event_date ?? null,
    event_location: body.event_location ?? null,
    rsvp_url: body.rsvp_url ?? null,
    audience_filters: body.audience_filters ?? {},
    status: "sent",
    scheduled_at: null,
  });

  if (recipients.length > 0) {
    await sendBulkMessages(
      recipients.map((p) => ({ phone: p.phone!, profileId: p.id })),
      messageBody
    );
  }

  return NextResponse.json({ campaign, sent: recipients.length });
}
