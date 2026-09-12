import type {
  AlumniInvite,
  AllowedDomain,
  AnalyticsSnapshot,
  AudienceFilters,
  GlobePin,
  MessageCampaign,
  MessageDelivery,
  Profile,
  User,
  UserRole,
  ProgramAffiliation,
  Division,
  EboardRole,
  StakeholderType,
  ProfileVisibility,
} from "@/types";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient, hasServiceRole } from "@/lib/supabase/admin";
import { embedProfile, parseEmbedding, toVectorLiteral } from "@/lib/embeddings";
import { profileCompletionScore } from "@/lib/utils";
import { matchAudience, toGlobePins } from "@/lib/data/audience";
import { getDefaultAllowedDomains, isAdminEmail } from "@/lib/auth/domain-check";

export { matchAudience };

type DbClient = ReturnType<typeof createAdminClient>;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function getDb(): Promise<DbClient> {
  if (hasServiceRole()) return createAdminClient();
  return (await createClient()) as unknown as DbClient;
}

function mapUser(row: Record<string, unknown>): User {
  return {
    id: String(row.id),
    email: String(row.email ?? ""),
    role: (row.role as UserRole) ?? "member",
    created_at: String(row.created_at ?? new Date().toISOString()),
    is_active: Boolean(row.is_active ?? true),
  };
}

function mapProfile(row: Record<string, unknown>): Profile {
  return {
    id: String(row.id),
    user_id: String(row.user_id),
    email: String(row.email ?? ""),
    full_name: String(row.full_name ?? ""),
    phone: (row.phone as string | null) ?? null,
    cohort_year: (row.cohort_year as number | null) ?? null,
    programs: (row.programs as ProgramAffiliation[]) ?? [],
    divisions: (row.divisions as Division[]) ?? [],
    eboard_roles: (row.eboard_roles as EboardRole[]) ?? [],
    startups: (row.startups as string[]) ?? [],
    current_title: (row.current_title as string | null) ?? null,
    current_company: (row.current_company as string | null) ?? null,
    linkedin_url: (row.linkedin_url as string | null) ?? null,
    industries: (row.industries as string[]) ?? [],
    bio: (row.bio as string | null) ?? null,
    city: (row.city as string | null) ?? null,
    region: (row.region as string | null) ?? null,
    country: (row.country as string | null) ?? null,
    lat: (row.lat as number | null) ?? null,
    lng: (row.lng as number | null) ?? null,
    photo_url: (row.photo_url as string | null) ?? null,
    visibility: ((row.visibility as ProfileVisibility) ?? "public"),
    sms_opt_in: Boolean(row.sms_opt_in),
    notification_industries: (row.notification_industries as string[]) ?? [],
    stakeholder_type: (row.stakeholder_type as StakeholderType | null) ?? null,
    embedding: parseEmbedding(row.embedding),
    profile_complete: Boolean(row.profile_complete),
    location_updated_at: (row.location_updated_at as string | null) ?? null,
    updated_at: String(row.updated_at ?? new Date().toISOString()),
    created_at: String(row.created_at ?? new Date().toISOString()),
  };
}

function mapCampaign(row: Record<string, unknown>): MessageCampaign {
  return {
    id: String(row.id),
    created_by: String(row.created_by),
    title: String(row.title ?? ""),
    body: String(row.body ?? ""),
    event_name: (row.event_name as string | null) ?? null,
    event_date: (row.event_date as string | null) ?? null,
    event_location: (row.event_location as string | null) ?? null,
    rsvp_url: (row.rsvp_url as string | null) ?? null,
    audience_filters: (row.audience_filters as AudienceFilters) ?? {},
    recipient_count: Number(row.recipient_count ?? 0),
    status: (row.status as MessageCampaign["status"]) ?? "draft",
    scheduled_at: (row.scheduled_at as string | null) ?? null,
    sent_at: (row.sent_at as string | null) ?? null,
    created_at: String(row.created_at ?? new Date().toISOString()),
  };
}

function mapDelivery(row: Record<string, unknown>): MessageDelivery {
  return {
    id: String(row.id),
    campaign_id: String(row.campaign_id),
    profile_id: String(row.profile_id),
    phone: String(row.phone ?? ""),
    status: (row.status as MessageDelivery["status"]) ?? "queued",
    provider_message_id: (row.provider_message_id as string | null) ?? null,
    error: (row.error as string | null) ?? null,
    sent_at: (row.sent_at as string | null) ?? null,
  };
}

function mapDomain(row: Record<string, unknown>): AllowedDomain {
  return {
    id: String(row.id),
    domain: String(row.domain ?? ""),
    notes: (row.notes as string | null) ?? null,
    created_at: String(row.created_at ?? new Date().toISOString()),
  };
}

async function ensureUserRecord(authUser: { id: string; email?: string | null; created_at?: string }) {
  const email = authUser.email ?? "";
  const db = await getDb();
  const { data: existing } = await db.from("users").select("*").eq("id", authUser.id).maybeSingle();
  if (existing) return mapUser(existing as Record<string, unknown>);

  if (!hasServiceRole() || !email) {
    return {
      id: authUser.id,
      email,
      role: (isAdminEmail(email) ? "admin" : email.includes("angelfund") ? "stakeholder" : "member") as UserRole,
      is_active: true,
      created_at: authUser.created_at ?? new Date().toISOString(),
    };
  }

  const admin = createAdminClient();
  const { data: invite } = await admin.from("alumni_invites").select("*").ilike("email", email).maybeSingle();
  const { data: adminRow } = await admin.from("admin_emails").select("email").ilike("email", email).maybeSingle();
  const role: UserRole = adminRow
    ? "admin"
    : ((invite?.role as UserRole | undefined) ?? (email.includes("angelfund") ? "stakeholder" : isAdminEmail(email) ? "admin" : "member"));

  await admin.from("users").upsert({
    id: authUser.id,
    email,
    role,
    is_active: true,
  });

  const { data: profile } = await admin.from("profiles").select("id").eq("user_id", authUser.id).maybeSingle();
  if (!profile) {
    await admin.from("profiles").insert({
      user_id: authUser.id,
      email,
      full_name: invite?.full_name ?? "",
      phone: invite?.phone ?? null,
      cohort_year: invite?.cohort_year ?? null,
      programs: invite?.programs ?? [],
      divisions: invite?.divisions ?? [],
      eboard_roles: invite?.eboard_roles ?? [],
      startups: invite?.startups ?? [],
      current_title: invite?.current_title ?? null,
      current_company: invite?.current_company ?? null,
      linkedin_url: invite?.linkedin_url ?? null,
      industries: invite?.industries ?? [],
      bio: invite?.bio ?? null,
      city: invite?.city ?? null,
      region: invite?.region ?? null,
      country: invite?.country ?? null,
      lat: invite?.lat ?? null,
      lng: invite?.lng ?? null,
      photo_url: invite?.photo_url ?? null,
      sms_opt_in: invite?.sms_opt_in ?? false,
      stakeholder_type:
        role === "stakeholder" ? (invite?.stakeholder_type ?? "ANGEL_INVESTOR") : (invite?.stakeholder_type ?? null),
    });
  }

  const { data: user } = await admin.from("users").select("*").eq("id", authUser.id).single();
  return mapUser((user ?? { id: authUser.id, email, role, is_active: true }) as Record<string, unknown>);
}

export async function ensureSeedData(): Promise<void> {
  /* Production data lives in Postgres. */
}

export async function sendMagicLink(
  email: string,
  emailRedirectTo: string
): Promise<{ magicLink: true } | { error: string }> {
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo, shouldCreateUser: true },
  });
  if (error) return { error: error.message };
  return { magicLink: true };
}

export async function loginWithEmail(
  email: string
): Promise<{ user: User; profile: Profile } | { error: string }> {
  void email;
  return { error: "Magic link required" };
}

export async function resolveSessionUser(token?: string | null): Promise<User | null> {
  void token;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  return ensureUserRecord(user);
}

export async function resolveSessionProfile(token?: string | null): Promise<Profile | null> {
  const user = await resolveSessionUser(token);
  if (!user) return null;
  return getProfileByUserId(user.id);
}

export async function getSessionUser(): Promise<User | null> {
  return resolveSessionUser(null);
}

export function setSessionUserId(id: string | null) {
  void id;
  /* Supabase session is cookie-based. */
}

export async function getAllProfiles(): Promise<Profile[]> {
  const db = await getDb();
  const { data, error } = await db.from("profiles").select("*").eq("visibility", "public");
  if (error) {
    console.error("getAllProfiles", error.message);
    return [];
  }
  return (data ?? []).map((row) => mapProfile(row as Record<string, unknown>));
}

export async function listAllProfiles(): Promise<Profile[]> {
  const db = await getDb();
  const { data, error } = await db.from("profiles").select("*");
  if (error) {
    console.error("listAllProfiles", error.message);
    return [];
  }
  return (data ?? []).map((row) => mapProfile(row as Record<string, unknown>));
}

export async function getProfileById(id: string): Promise<Profile | null> {
  const db = await getDb();
  const { data, error } = await db.from("profiles").select("*").or(`id.eq.${id},user_id.eq.${id}`).maybeSingle();
  if (error) {
    console.error("getProfileById", error.message);
    return null;
  }
  return data ? mapProfile(data as Record<string, unknown>) : null;
}

export async function getProfileByUserId(userId: string): Promise<Profile | null> {
  const db = await getDb();
  const byUser = await db.from("profiles").select("*").eq("user_id", userId).maybeSingle();
  if (byUser.data) return mapProfile(byUser.data as Record<string, unknown>);
  if (userId.includes("@")) {
    const byEmail = await db.from("profiles").select("*").ilike("email", userId).maybeSingle();
    if (byEmail.data) return mapProfile(byEmail.data as Record<string, unknown>);
  }
  return getProfileById(userId);
}

export async function updateProfile(userId: string, updates: Partial<Profile>): Promise<Profile | null> {
  const existing = await getProfileByUserId(userId);
  if (!existing) return null;

  const safeUpdates = { ...updates };
  delete safeUpdates.embedding;
  delete safeUpdates.id;
  delete safeUpdates.user_id;
  delete safeUpdates.created_at;
  delete safeUpdates.email;

  const now = new Date().toISOString();
  const next: Profile = {
    ...existing,
    ...safeUpdates,
    id: existing.id,
    user_id: existing.user_id,
    email: existing.email,
    created_at: existing.created_at,
    updated_at: now,
    profile_complete: profileCompletionScore({ ...existing, ...safeUpdates }) >= 70,
  };

  if (safeUpdates.lat != null || safeUpdates.lng != null || safeUpdates.city != null) {
    next.location_updated_at = now;
  }

  next.embedding = await embedProfile(next);

  const db = await getDb();
  const { data, error } = await db
    .from("profiles")
    .update({
      full_name: next.full_name,
      phone: next.phone,
      cohort_year: next.cohort_year,
      programs: next.programs,
      divisions: next.divisions,
      eboard_roles: next.eboard_roles,
      startups: next.startups,
      current_title: next.current_title,
      current_company: next.current_company,
      linkedin_url: next.linkedin_url,
      industries: next.industries,
      bio: next.bio,
      city: next.city,
      region: next.region,
      country: next.country,
      lat: next.lat,
      lng: next.lng,
      photo_url: next.photo_url,
      visibility: next.visibility,
      sms_opt_in: next.sms_opt_in,
      notification_industries: next.notification_industries,
      stakeholder_type: next.stakeholder_type,
      profile_complete: next.profile_complete,
      location_updated_at: next.location_updated_at,
      embedding: toVectorLiteral(next.embedding),
      updated_at: now,
    })
    .eq("id", existing.id)
    .select("*")
    .maybeSingle();

  if (error) {
    console.error("updateProfile", error.message);
    return null;
  }
  return data ? mapProfile(data as Record<string, unknown>) : next;
}

export async function getGlobePins(filters?: {
  programs?: string[];
  divisions?: string[];
  industries?: string[];
}): Promise<GlobePin[]> {
  return toGlobePins(await getAllProfiles(), filters);
}

export async function getAllowedDomains(): Promise<AllowedDomain[]> {
  const db = await getDb();
  const { data, error } = await db.from("allowed_domains").select("*");
  if (!error && data?.length) {
    return data.map((row) => mapDomain(row as Record<string, unknown>));
  }
  const now = new Date().toISOString();
  return getDefaultAllowedDomains().map((domain, index) => ({
    id: `config-${index}`,
    domain,
    notes: null,
    created_at: now,
  }));
}

export async function addAllowedDomain(domain: string, notes?: string): Promise<AllowedDomain> {
  const db = await getDb();
  const { data, error } = await db
    .from("allowed_domains")
    .insert({ domain: domain.toLowerCase(), notes: notes ?? null })
    .select("*")
    .single();
  if (error || !data) {
    throw new Error(error?.message ?? "Failed to add domain");
  }
  return mapDomain(data as Record<string, unknown>);
}

export async function removeAllowedDomain(domainOrId: string): Promise<boolean> {
  const db = await getDb();
  const byId = await db.from("allowed_domains").delete().eq("id", domainOrId).select("id");
  if (byId.data?.length) return true;
  const byDomain = await db
    .from("allowed_domains")
    .delete()
    .ilike("domain", domainOrId)
    .select("id");
  return Boolean(byDomain.data?.length);
}

export async function removeUserByEmail(email: string): Promise<boolean> {
  const db = await getDb();
  const lower = email.trim().toLowerCase();
  const { data: user, error } = await db.from("users").select("id").ilike("email", lower).maybeSingle();
  if (error || !user) return false;

  await db.from("profiles").delete().eq("user_id", user.id);
  const { error: userError } = await db.from("users").delete().eq("id", user.id);
  if (userError) {
    console.error("removeUserByEmail", userError.message);
    return false;
  }
  return true;
}

export async function createCampaign(
  campaign: Omit<MessageCampaign, "id" | "created_at" | "recipient_count" | "sent_at">
): Promise<MessageCampaign> {
  const profiles = await getAllProfiles();
  const recipients = matchAudience(profiles, campaign.audience_filters);
  const sentAt = campaign.status === "sent" ? new Date().toISOString() : null;
  const db = await getDb();

  const { data, error } = await db
    .from("message_campaigns")
    .insert({
      created_by: campaign.created_by,
      title: campaign.title,
      body: campaign.body,
      event_name: campaign.event_name,
      event_date: campaign.event_date,
      event_location: campaign.event_location,
      rsvp_url: campaign.rsvp_url,
      audience_filters: campaign.audience_filters,
      recipient_count: recipients.length,
      status: campaign.status,
      scheduled_at: campaign.scheduled_at,
      sent_at: sentAt,
    })
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to create campaign");
  }

  const created = mapCampaign(data as Record<string, unknown>);

  if ((campaign.status === "sent" || campaign.status === "sending") && recipients.length > 0) {
    await db.from("message_deliveries").insert(
      recipients.map((profile) => ({
        campaign_id: created.id,
        profile_id: profile.id,
        phone: profile.phone!,
        status: "delivered",
        provider_message_id: null,
        error: null,
        sent_at: sentAt,
      }))
    );
  }

  return created;
}

export async function getCampaigns(): Promise<MessageCampaign[]> {
  const db = await getDb();
  const { data, error } = await db.from("message_campaigns").select("*").order("created_at", { ascending: true });
  if (error) {
    console.error("getCampaigns", error.message);
    return [];
  }
  return (data ?? []).map((row) => mapCampaign(row as Record<string, unknown>));
}

export async function getDeliveries(campaignId?: string): Promise<MessageDelivery[]> {
  const db = await getDb();
  let query = db.from("message_deliveries").select("*");
  if (campaignId) query = query.eq("campaign_id", campaignId);
  const { data, error } = await query;
  if (error) {
    console.error("getDeliveries", error.message);
    return [];
  }
  return (data ?? []).map((row) => mapDelivery(row as Record<string, unknown>));
}

export async function getUsers(): Promise<User[]> {
  const db = await getDb();
  const { data, error } = await db.from("users").select("*");
  if (error) {
    console.error("getUsers", error.message);
    return [];
  }
  return (data ?? []).map((row) => mapUser(row as Record<string, unknown>));
}

export async function getAlumniInvites(): Promise<AlumniInvite[]> {
  const db = await getDb();
  const { data, error } = await db.from("alumni_invites").select("*");
  if (error) {
    console.error("getAlumniInvites", error.message);
    return [];
  }
  return (data ?? []).map((row) => ({
    email: String(row.email ?? ""),
    full_name: String(row.full_name ?? ""),
    role: (row.role as UserRole) ?? "member",
    programs: (row.programs as ProgramAffiliation[]) ?? [],
    created_at: String(row.created_at ?? new Date().toISOString()),
  }));
}

export async function trackEvent(userId: string | null, eventType: string, metadata: Record<string, unknown> = {}) {
  const db = await getDb();
  const resolvedUserId = userId && UUID_RE.test(userId) ? userId : null;
  const { error } = await db.from("analytics_events").insert({
    user_id: resolvedUserId,
    event_type: eventType,
    metadata,
  });
  if (error) console.error("trackEvent", error.message);
}

export async function getAnalytics(): Promise<AnalyticsSnapshot> {
  const db = await getDb();
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString();
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const [{ count: totalUsers }, { data: profiles }, { data: events }, { data: deliveries }] =
    await Promise.all([
      db.from("users").select("*", { count: "exact", head: true }),
      db.from("profiles").select("profile_complete"),
      db.from("analytics_events").select("user_id, event_type, created_at").gte("created_at", thirtyDaysAgo),
      db.from("message_deliveries").select("sent_at").gte("sent_at", thirtyDaysAgo),
    ]);

  const activeUsers = new Set(
    (events ?? [])
      .filter((e) => e.user_id)
      .map((e) => String(e.user_id))
  );
  const searchesToday = (events ?? []).filter(
    (e) => e.event_type === "search" && new Date(String(e.created_at)) >= todayStart
  ).length;
  const completed = (profiles ?? []).filter((p) => p.profile_complete).length;

  return {
    total_users: totalUsers ?? 0,
    active_users_30d: activeUsers.size,
    profile_completion_rate: profiles?.length ? Math.round((completed / profiles.length) * 100) : 0,
    searches_today: searchesToday,
    messages_sent_30d: (deliveries ?? []).length,
  };
}
