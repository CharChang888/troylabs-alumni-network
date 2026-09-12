import { NextResponse } from "next/server";
import {
  ensureSeedData,
  getAnalytics,
  getAllowedDomains,
  addAllowedDomain,
  removeAllowedDomain,
  removeUserByEmail,
} from "@/lib/data";
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

  const { action, domain, notes, email } = await req.json();
  if (action === "add_domain" && domain) {
    const entry = await addAllowedDomain(domain, notes);
    return NextResponse.json({ domain: entry });
  }

  if (action === "remove_domain" && domain) {
    const ok = await removeAllowedDomain(domain);
    if (!ok) return NextResponse.json({ error: "Domain not found" }, { status: 404 });
    return NextResponse.json({ ok: true });
  }

  if (action === "remove_user" && email) {
    if (admin.email.toLowerCase() === String(email).toLowerCase()) {
      return NextResponse.json({ error: "You cannot remove your own account" }, { status: 400 });
    }
    const ok = await removeUserByEmail(email);
    if (!ok) return NextResponse.json({ error: "User not found" }, { status: 404 });
    return NextResponse.json({ ok: true });
  }

  if (action === "list_domains") {
    const domains = await getAllowedDomains();
    return NextResponse.json({ domains });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
