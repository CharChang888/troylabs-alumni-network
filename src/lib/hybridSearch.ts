import type { Profile, SearchFilters, HybridSearchResult } from "@/types";
import { haversineKm, formatProgram } from "@/lib/utils";

function normalize(s: string): string {
  return s.trim().toLowerCase();
}

function fieldMatches(filterValues: string[], profileValues: string[]): boolean {
  return filterValues.some((fv) =>
    profileValues.some(
      (pv) =>
        normalize(pv) === normalize(fv) ||
        normalize(pv).includes(normalize(fv)) ||
        normalize(fv).includes(normalize(pv))
    )
  );
}

export function cosineSim(a: number[], b: number[]): number {
  let dot = 0;
  let magA = 0;
  let magB = 0;
  const len = Math.min(a.length, b.length);
  for (let i = 0; i < len; i++) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }
  if (magA === 0 || magB === 0) return 0;
  return dot / (Math.sqrt(magA) * Math.sqrt(magB));
}

export function filterByStructuredFields(
  profiles: Profile[],
  filters: SearchFilters | null | undefined
): Profile[] {
  if (!filters) return profiles.filter((p) => p.visibility === "public");

  const programFilters = filters.programs?.filter(Boolean) ?? [];
  const divisionFilters = filters.divisions?.filter(Boolean) ?? [];
  const industryFilters = filters.industries?.filter(Boolean) ?? [];
  const hasLocation =
    filters.lat != null &&
    filters.lng != null &&
    filters.location_radius_km != null;

  return profiles.filter((p) => {
    if (p.visibility !== "public") return false;

    if (programFilters.length > 0) {
      const match = programFilters.some((f) => p.programs.includes(f));
      if (!match) return false;
    }

    if (divisionFilters.length > 0) {
      const match = divisionFilters.some((f) => p.divisions.includes(f));
      if (!match) return false;
    }

    if (industryFilters.length > 0) {
      if (!fieldMatches(industryFilters, p.industries)) return false;
    }

    if (filters.cohort_year_min != null && (p.cohort_year ?? 0) < filters.cohort_year_min) {
      return false;
    }
    if (filters.cohort_year_max != null && (p.cohort_year ?? 9999) > filters.cohort_year_max) {
      return false;
    }

    if (hasLocation && p.lat != null && p.lng != null) {
      const dist = haversineKm(filters.lat!, filters.lng!, p.lat, p.lng);
      if (dist > filters.location_radius_km!) return false;
    }

    return true;
  });
}

function profileSearchText(profile: Profile): string {
  return [
    profile.full_name,
    profile.current_title,
    profile.current_company,
    profile.bio,
    profile.city,
    profile.region,
    profile.country,
    profile.email,
    profile.linkedin_url,
    ...(profile.startups ?? []),
    ...(profile.industries ?? []),
    ...(profile.notification_industries ?? []),
    ...(profile.programs ?? []).map((p) => `${p} ${formatProgram(p)}`),
    ...(profile.divisions ?? []),
    ...(profile.eboard_roles ?? []),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function keywordScore(profile: Profile, query: string): number {
  const q = normalize(query);
  if (!q) return 0;
  const text = profileSearchText(profile);
  if (!text) return 0;
  if (text.includes(q)) return 1;
  const terms = q.split(/\s+/).filter(Boolean);
  if (terms.length === 0) return 0;
  return terms.filter((term) => text.includes(term)).length / terms.length;
}

export function keywordSearch(profiles: Profile[], query: string): Profile[] {
  const q = normalize(query);
  if (!q) return profiles;
  return profiles.filter((p) => keywordScore(p, q) > 0);
}

export function semanticRank(
  profiles: Profile[],
  queryEmbedding: number[],
  topK = 10
): HybridSearchResult[] {
  return profiles
    .filter((p) => p.embedding && p.embedding.length > 0)
    .map((p) => ({
      ...p,
      similarity: cosineSim(queryEmbedding, p.embedding!),
    }))
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, topK);
}

export function hybridSearch(
  profiles: Profile[],
  query: string,
  queryEmbedding: number[] | null,
  filters: SearchFilters | null | undefined,
  topK = 20
): HybridSearchResult[] {
  const filtered = filterByStructuredFields(profiles, filters);
  const q = normalize(query);

  const scored = filtered.map((p) => {
    const keyword = q ? keywordScore(p, q) : 0;
    const semantic =
      queryEmbedding && p.embedding && p.embedding.length > 0
        ? cosineSim(queryEmbedding, p.embedding)
        : 0;
    const similarity = queryEmbedding
      ? 0.7 * semantic + 0.3 * keyword
      : keyword;
    return { ...p, similarity };
  });

  return scored
    .filter((p) => !q || p.similarity > 0.02)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, topK);
}

export function suggestSimilarProfiles(
  currentProfile: Profile | null,
  allProfiles: Profile[],
  topK = 10
): HybridSearchResult[] {
  if (!currentProfile?.embedding?.length) {
    return allProfiles
      .filter((p) => p.id !== currentProfile?.id && p.visibility === "public")
      .slice(0, topK)
      .map((p) => ({ ...p, similarity: 0 }));
  }

  return semanticRank(
    allProfiles.filter((p) => p.id !== currentProfile.id && p.visibility === "public"),
    currentProfile.embedding,
    topK
  );
}

export function buildProfileEmbeddingText(profile: Profile): string {
  return [
    profile.full_name,
    profile.current_title && `${profile.current_title} at ${profile.current_company}`,
    profile.city && `located in ${profile.city}${profile.region ? `, ${profile.region}` : ""} ${profile.country ?? ""}`,
    `Programs: ${(profile.programs ?? []).map((p) => formatProgram(p)).join(", ")}`,
    `Divisions: ${(profile.divisions ?? []).join(", ")}`,
    profile.eboard_roles?.length && `E-Board: ${profile.eboard_roles.join(", ")}`,
    profile.startups?.length && `Startups: ${profile.startups.join(", ")}`,
    profile.industries?.length && `Industries: ${profile.industries.join(", ")}`,
    profile.bio,
  ]
    .filter(Boolean)
    .join(". ");
}

export function hasActiveFilters(filters: SearchFilters | null | undefined): boolean {
  if (!filters) return false;
  return (
    (filters.programs?.length ?? 0) > 0 ||
    (filters.divisions?.length ?? 0) > 0 ||
    (filters.industries?.length ?? 0) > 0 ||
    filters.cohort_year_min != null ||
    filters.cohort_year_max != null ||
    filters.location_radius_km != null
  );
}
