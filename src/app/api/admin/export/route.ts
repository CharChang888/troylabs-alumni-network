import { NextResponse } from "next/server";
import Papa from "papaparse";
import { requireAdmin } from "@/lib/auth/current-user";
import { ensureSeedData, listAllProfiles } from "@/lib/data";

export const dynamic = "force-dynamic";

export async function GET() {
  await ensureSeedData();
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const profiles = await listAllProfiles();
  const rows = profiles.map((p) => ({
    full_name: p.full_name ?? "",
    email: p.email ?? "",
    phone: p.phone ?? "",
    sms_opt_in: p.sms_opt_in ? "yes" : "no",
    cohort_year: p.cohort_year ?? "",
    programs: (p.programs ?? []).join("; "),
    divisions: (p.divisions ?? []).join("; "),
    current_title: p.current_title ?? "",
    current_company: p.current_company ?? "",
    city: p.city ?? "",
    region: p.region ?? "",
    country: p.country ?? "",
  }));

  const csv = Papa.unparse(rows);
  const stamp = new Date().toISOString().slice(0, 10);

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="tl-alumni-contacts-${stamp}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
