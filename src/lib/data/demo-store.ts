import fs from "fs";
import path from "path";
import type {
  Profile,
  User,
  MessageCampaign,
  MessageDelivery,
  AllowedDomain,
  AnalyticsSnapshot,
  GlobePin,
  AlumniInvite,
} from "@/types";
import { embedProfile } from "@/lib/embeddings";
import { isAdminEmail } from "@/lib/auth/domain-check";
import { profileCompletionScore } from "@/lib/utils";
import { matchAudience, toGlobePins } from "@/lib/data/audience";

export { matchAudience };

interface SeedData {
  users: User[];
  profiles: Profile[];
  allowedDomains: AllowedDomain[];
  campaigns: MessageCampaign[];
  deliveries: MessageDelivery[];
  analyticsEvents: Array<{ id: string; user_id: string | null; event_type: string; metadata: Record<string, unknown>; created_at: string }>;
  embeddingTexts?: Record<string, string>;
}

const globalForStore = globalThis as unknown as { __tlAlumniStore?: SeedData | null };
let sessionUserId: string | null = null;

function seedFilePath() {
  return path.join(process.cwd(), "public/data/profiles.json");
}

function localFilePath() {
  return path.join(process.cwd(), "data/profiles.local.json");
}

function storeFilePath() {
  const local = localFilePath();
  return fs.existsSync(local) ? local : seedFilePath();
}

async function persistStore(data: SeedData) {
  if (typeof window !== "undefined") return;
  try {
    const fs = await import("fs");
    const path = await import("path");
    const dest = localFilePath();
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    const serializable: SeedData = {
      ...data,
      profiles: data.profiles.map((p) => ({ ...p, embedding: null })),
    };
    fs.writeFileSync(dest, JSON.stringify(serializable, null, 2), "utf-8");
  } catch (error) {
    console.error("Failed to persist profiles", error);
  }
}

function normalizeProfile(profile: Profile): Profile {
  return {
    ...profile,
    eboard_roles: profile.eboard_roles ?? [],
    linkedin_url: profile.linkedin_url ?? null,
  };
}

async function loadStore(): Promise<SeedData> {
  if (globalForStore.__tlAlumniStore) return globalForStore.__tlAlumniStore;

  if (typeof window === "undefined") {
    const fs = await import("fs");
    const filePath = storeFilePath();
    if (fs.existsSync(filePath)) {
      const parsed = JSON.parse(fs.readFileSync(filePath, "utf-8")) as SeedData & { jobs?: unknown };
      delete parsed.jobs;
      parsed.profiles = parsed.profiles.map(normalizeProfile);
      globalForStore.__tlAlumniStore = parsed;
      return parsed;
    }
  }

  const res = await fetch("/data/profiles.json");
  const parsed = (await res.json()) as SeedData & { jobs?: unknown };
  delete parsed.jobs;
  parsed.profiles = parsed.profiles.map(normalizeProfile);
  globalForStore.__tlAlumniStore = parsed;
  return parsed;
}

export async function initDemoEmbeddings(): Promise<void> {
  const data = await loadStore();
  for (const profile of data.profiles) {
    if (!profile.embedding?.length) {
      profile.embedding = await embedProfile(profile);
    }
  }
}

export async function getSessionUser(): Promise<User | null> {
  const data = await loadStore();
  if (!sessionUserId) return null;
  return data.users.find((u) => u.id === sessionUserId) ?? null;
}

export async function loginWithEmail(email: string): Promise<{ user: User; profile: Profile } | { error: string }> {
  const data = await loadStore();
  let user = data.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  let profile = user ? data.profiles.find((p) => p.user_id === user!.id) : undefined;

  if (!user) {
    const { v4: uuidv4 } = await import("uuid");
    const userId = uuidv4();
    const profileId = uuidv4();
    const now = new Date().toISOString();
    const role = isAdminEmail(email) ? "admin" : email.includes("angelfund") ? "stakeholder" : "member";

    user = { id: userId, email, role, created_at: now, is_active: true };
    profile = {
      id: profileId,
      user_id: userId,
      email,
      full_name: "",
      phone: null,
      cohort_year: null,
      programs: [],
      divisions: [],
      eboard_roles: [],
      startups: [],
      current_title: null,
      current_company: null,
      linkedin_url: null,
      industries: [],
      bio: null,
      city: null,
      region: null,
      country: null,
      lat: null,
      lng: null,
      photo_url: null,
      visibility: "public",
      sms_opt_in: false,
      notification_industries: [],
      stakeholder_type: role === "stakeholder" ? "ANGEL_INVESTOR" : null,
      embedding: null,
      profile_complete: false,
      location_updated_at: null,
      updated_at: now,
      created_at: now,
    };
    data.users.push(user);
    data.profiles.push(profile);
    await persistStore(data);
  }

  sessionUserId = user.id;
  return { user, profile: profile! };
}

export function setSessionUserId(id: string | null) {
  sessionUserId = id;
}

/** Session cookie may be a user id or an email (emails survive seed reloads). */
export async function resolveSessionUser(token: string | null | undefined): Promise<User | null> {
  if (!token) return null;
  const data = await loadStore();
  const lower = token.toLowerCase();
  const existing = data.users.find((u) => u.id === token || u.email.toLowerCase() === lower) ?? null;
  if (existing) return existing;

  if (token.includes("@")) {
    const result = await loginWithEmail(token);
    if ("user" in result) return result.user;
  }
  return null;
}

export async function resolveSessionProfile(token: string | null | undefined): Promise<Profile | null> {
  const user = await resolveSessionUser(token);
  if (!user) return null;
  return getProfileByUserId(user.id);
}

export async function getAllProfiles(): Promise<Profile[]> {
  const data = await loadStore();
  return data.profiles.filter((p) => p.visibility === "public");
}

export async function getProfileById(id: string): Promise<Profile | null> {
  const data = await loadStore();
  return data.profiles.find((p) => p.id === id || p.user_id === id) ?? null;
}

export async function getProfileByUserId(userId: string): Promise<Profile | null> {
  const data = await loadStore();
  const lower = userId.toLowerCase();
  return (
    data.profiles.find(
      (p) => p.user_id === userId || p.email.toLowerCase() === lower || p.id === userId
    ) ?? null
  );
}

export async function updateProfile(userId: string, updates: Partial<Profile>): Promise<Profile | null> {
  const data = await loadStore();
  const user = await resolveSessionUser(userId);
  const resolvedId = user?.id ?? userId;
  const idx = data.profiles.findIndex(
    (p) => p.user_id === resolvedId || p.email.toLowerCase() === userId.toLowerCase()
  );
  if (idx === -1) return null;

  const safeUpdates = { ...updates };
  delete safeUpdates.embedding;
  delete safeUpdates.id;
  delete safeUpdates.user_id;
  delete safeUpdates.created_at;

  const now = new Date().toISOString();
  const updated: Profile = {
    ...data.profiles[idx],
    ...safeUpdates,
    id: data.profiles[idx].id,
    user_id: resolvedId,
    email: data.profiles[idx].email,
    created_at: data.profiles[idx].created_at,
    updated_at: now,
    profile_complete: profileCompletionScore({ ...data.profiles[idx], ...safeUpdates }) >= 70,
  };

  if (safeUpdates.lat != null || safeUpdates.lng != null || safeUpdates.city != null) {
    updated.location_updated_at = now;
  }

  updated.embedding = await embedProfile(updated);
  data.profiles[idx] = updated;
  await persistStore(data);
  return updated;
}

export async function getGlobePins(filters?: {
  programs?: string[];
  divisions?: string[];
  industries?: string[];
}): Promise<GlobePin[]> {
  return toGlobePins(await getAllProfiles(), filters);
}

export async function getAllowedDomains(): Promise<AllowedDomain[]> {
  const data = await loadStore();
  return data.allowedDomains;
}

export async function addAllowedDomain(domain: string, notes?: string): Promise<AllowedDomain> {
  const data = await loadStore();
  const { v4: uuidv4 } = await import("uuid");
  const entry: AllowedDomain = {
    id: uuidv4(),
    domain: domain.toLowerCase(),
    notes: notes ?? null,
    created_at: new Date().toISOString(),
  };
  data.allowedDomains.push(entry);
  return entry;
}

export async function createCampaign(
  campaign: Omit<MessageCampaign, "id" | "created_at" | "recipient_count" | "sent_at">
): Promise<MessageCampaign> {
  const data = await loadStore();
  const { v4: uuidv4 } = await import("uuid");
  const profiles = await getAllProfiles();
  const recipients = matchAudience(profiles, campaign.audience_filters);

  const newCampaign: MessageCampaign = {
    ...campaign,
    id: uuidv4(),
    recipient_count: recipients.length,
    sent_at: campaign.status === "sent" ? new Date().toISOString() : null,
    created_at: new Date().toISOString(),
  };
  data.campaigns.push(newCampaign);

  if (campaign.status === "sent" || campaign.status === "sending") {
    for (const profile of recipients) {
      data.deliveries.push({
        id: uuidv4(),
        campaign_id: newCampaign.id,
        profile_id: profile.id,
        phone: profile.phone!,
        status: "delivered",
        provider_message_id: `demo_${uuidv4().slice(0, 8)}`,
        error: null,
        sent_at: new Date().toISOString(),
      });
    }
  }

  return newCampaign;
}

export async function getCampaigns(): Promise<MessageCampaign[]> {
  const data = await loadStore();
  return data.campaigns;
}

export async function getDeliveries(campaignId?: string): Promise<MessageDelivery[]> {
  const data = await loadStore();
  return campaignId
    ? data.deliveries.filter((d) => d.campaign_id === campaignId)
    : data.deliveries;
}

export async function getUsers(): Promise<User[]> {
  const data = await loadStore();
  return data.users;
}

export async function listAllProfiles(): Promise<Profile[]> {
  const data = await loadStore();
  return data.profiles;
}

export async function getAlumniInvites(): Promise<AlumniInvite[]> {
  return [];
}

export async function trackEvent(userId: string | null, eventType: string, metadata: Record<string, unknown> = {}) {
  const data = await loadStore();
  const { v4: uuidv4 } = await import("uuid");
  data.analyticsEvents.push({
    id: uuidv4(),
    user_id: userId,
    event_type: eventType,
    metadata,
    created_at: new Date().toISOString(),
  });
}

export async function getAnalytics(): Promise<AnalyticsSnapshot> {
  const data = await loadStore();
  const thirtyDaysAgo = Date.now() - 30 * 86400000;
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const activeUsers = new Set(
    data.analyticsEvents
      .filter((e) => new Date(e.created_at).getTime() > thirtyDaysAgo && e.user_id)
      .map((e) => e.user_id)
  );

  const searchesToday = data.analyticsEvents.filter(
    (e) => e.event_type === "search" && new Date(e.created_at) >= todayStart
  ).length;

  const messagesSent = data.deliveries.filter(
    (d) => d.sent_at && new Date(d.sent_at).getTime() > thirtyDaysAgo
  ).length;

  const completed = data.profiles.filter((p) => p.profile_complete).length;

  return {
    total_users: data.users.length,
    active_users_30d: activeUsers.size,
    profile_completion_rate: data.profiles.length ? Math.round((completed / data.profiles.length) * 100) : 0,
    searches_today: searchesToday,
    messages_sent_30d: messagesSent,
  };
}

export async function ensureSeedData(): Promise<void> {
  const fs = await import("fs");
  const path = await import("path");
  const outPath = path.join(process.cwd(), "public/data/profiles.json");
  if (!fs.existsSync(outPath)) {
    const { execSync } = await import("child_process");
    execSync("npx tsx scripts/seed-alumni.ts", { cwd: process.cwd(), stdio: "inherit" });
  }
  await initDemoEmbeddings();
}
