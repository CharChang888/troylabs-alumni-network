/**
 * Import the alumni CSV into Supabase as invite records.
 * Alumni accounts are created when they click the magic link.
 *
 * Usage: npx tsx scripts/import-supabase.ts
 */
import fs from "fs";
import path from "path";
import Papa from "papaparse";
import { createClient } from "@supabase/supabase-js";

const ROOT = path.join(__dirname, "..");
const CSV_PATH = path.join(ROOT, "data/seed-alumni.csv");

interface CsvRow {
  email: string;
  full_name: string;
  cohort_year: string;
  programs: string;
  divisions: string;
  startups: string;
  current_title: string;
  current_company: string;
  industries: string;
  bio: string;
  city: string;
  region: string;
  country: string;
  lat: string;
  lng: string;
  phone: string;
  sms_opt_in: string;
  role: string;
}

function loadEnvLocal() {
  const envPath = path.join(ROOT, ".env.local");
  if (!fs.existsSync(envPath)) return;
  for (const raw of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

function parseList(val: string): string[] {
  if (!val?.trim()) return [];
  return val.split("|").map((s) => s.trim()).filter(Boolean);
}

async function main() {
  loadEnvLocal();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRole) {
    throw new Error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local");
  }

  const supabase = createClient(url, serviceRole, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const csv = fs.readFileSync(CSV_PATH, "utf-8");
  const parsed = Papa.parse<CsvRow>(csv, { header: true, skipEmptyLines: true });

  let invites = 0;
  let admins = 0;

  for (const row of parsed.data) {
    if (!row.email?.includes("@")) continue;
    const email = row.email.trim().toLowerCase();
    const role = (row.role || "member").trim() || "member";

    const { error } = await supabase.from("alumni_invites").upsert(
      {
        email,
        full_name: row.full_name?.trim() ?? "",
        phone: row.phone?.trim() || null,
        cohort_year: row.cohort_year ? Number(row.cohort_year) : null,
        programs: parseList(row.programs),
        divisions: parseList(row.divisions),
        startups: parseList(row.startups),
        current_title: row.current_title?.trim() || null,
        current_company: row.current_company?.trim() || null,
        industries: parseList(row.industries),
        bio: row.bio?.trim() || null,
        city: row.city?.trim() || null,
        region: row.region?.trim() || null,
        country: row.country?.trim() || null,
        lat: row.lat ? Number(row.lat) : null,
        lng: row.lng ? Number(row.lng) : null,
        sms_opt_in: String(row.sms_opt_in).toLowerCase() === "true",
        role,
      },
      { onConflict: "email" }
    );

    if (error) {
      console.error(`Invite failed for ${email}: ${error.message}`);
      continue;
    }
    invites += 1;

    if (role === "admin") {
      const { error: adminError } = await supabase.from("admin_emails").upsert({ email });
      if (adminError) {
        console.error(`Admin email failed for ${email}: ${adminError.message}`);
      } else {
        admins += 1;
      }
    }
  }

  console.log(`Imported ${invites} alumni invites (${admins} admin emails).`);
  console.log("Accounts are created when each person clicks their magic link.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
