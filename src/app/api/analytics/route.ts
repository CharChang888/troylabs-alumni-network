import { NextResponse } from "next/server";
import { ensureSeedData, getAnalytics, getAllowedDomains, addAllowedDomain } from "@/lib/data";
import { requireAdmin } from "@/lib/auth/current-user";

export async function GET() {
  await ensureSeedData();
  const analytics = await getAnalytics();
  return NextResponse.json({ analytics });
}

export async function POST(req: Request) {
  await ensureSeedData();
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { action, domain, notes } = await req.json();
  if (action === "add_domain" && domain) {
    const entry = await addAllowedDomain(domain, notes);
    return NextResponse.json({ domain: entry });
  }

  if (action === "list_domains") {
    const domains = await getAllowedDomains();
    return NextResponse.json({ domains });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
