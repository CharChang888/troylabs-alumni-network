/**
 * Seed script: reads data/seed-alumni.csv and outputs public/data/profiles.json
 * Run: npx tsx scripts/seed-alumni.ts
 */
import fs from "fs";
import path from "path";
import Papa from "papaparse";
import { v4 as uuidv4 } from "uuid";
import type { Profile, User } from "../src/types";

const ROOT = path.join(__dirname, "..");
const CSV_PATH = path.join(ROOT, "data/seed-alumni.csv");
const OUT_PATH = path.join(ROOT, "public/data/profiles.json");

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

function parseList(val: string): string[] {
  if (!val?.trim()) return [];
  return val.split("|").map((s) => s.trim()).filter(Boolean);
}

function buildEmbeddingText(p: Partial<Profile>): string {
  return [
    p.full_name,
    p.current_title && `works as ${p.current_title}`,
    p.current_company && `at ${p.current_company}`,
    p.programs?.length && `Programs: ${p.programs.join(", ")}`,
    p.divisions?.length && `Divisions: ${p.divisions.join(", ")}`,
    p.startups?.length && `Startups: ${p.startups.join(", ")}`,
    p.industries?.length && `Industries: ${p.industries.join(", ")}`,
    p.bio,
  ]
    .filter(Boolean)
    .join(". ");
}

async function main() {
  const csv = fs.readFileSync(CSV_PATH, "utf-8");
  const parsed = Papa.parse<CsvRow>(csv, { header: true, skipEmptyLines: true });

  const users: User[] = [];
  const profiles: Profile[] = [];
  const now = new Date().toISOString();

  for (const row of parsed.data) {
    const userId = uuidv4();
    const profileId = uuidv4();
    const role = (row.role || "member") as User["role"];
    const programs = parseList(row.programs) as Profile["programs"];
    const divisions = parseList(row.divisions) as Profile["divisions"];
    const startups = parseList(row.startups);
    const industries = parseList(row.industries);

    users.push({
      id: userId,
      email: row.email,
      role,
      created_at: now,
      is_active: true,
    });

    const profile: Profile = {
      id: profileId,
      user_id: userId,
      email: row.email,
      full_name: row.full_name,
      phone: row.phone || null,
      cohort_year: row.cohort_year ? parseInt(row.cohort_year, 10) : null,
      programs,
      divisions,
      eboard_roles: [],
      startups,
      current_title: row.current_title || null,
      current_company: row.current_company || null,
      linkedin_url: null,
      industries,
      bio: row.bio || null,
      city: row.city || null,
      region: row.region || null,
      country: row.country || null,
      lat: row.lat ? parseFloat(row.lat) : null,
      lng: row.lng ? parseFloat(row.lng) : null,
      photo_url: null,
      visibility: "public",
      sms_opt_in: row.sms_opt_in === "true",
      notification_industries: industries,
      stakeholder_type: role === "stakeholder" ? "ANGEL_INVESTOR" : null,
      embedding: null,
      profile_complete: Boolean(row.full_name && programs.length && divisions.length),
      location_updated_at: row.lat ? now : null,
      updated_at: now,
      created_at: now,
    };

    profiles.push(profile);
  }

  const allowedDomains = [
    { id: uuidv4(), domain: "usc.edu", notes: "USC primary", created_at: now },
    { id: uuidv4(), domain: "student.usc.edu", notes: "USC student", created_at: now },
    { id: uuidv4(), domain: "gmail.com", notes: "Approved personal", created_at: now },
  ];

  const output = {
    users,
    profiles,
    allowedDomains,
    campaigns: [],
    deliveries: [],
    analyticsEvents: [],
    generatedAt: now,
    embeddingTexts: Object.fromEntries(
      profiles.map((p) => [p.id, buildEmbeddingText(p)])
    ),
  };

  fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
  fs.writeFileSync(OUT_PATH, JSON.stringify(output, null, 2));
  console.log(`Seeded ${profiles.length} profiles → ${OUT_PATH}`);
}

main().catch(console.error);
