import type {
  Profile,
  SearchFilters,
  HybridSearchResult,
  ProgramAffiliation,
  Division,
} from "@/types";
import {
  DIVISIONS,
  INDUSTRY_OPTIONS,
  PROGRAM_LABELS,
  PROGRAMS,
} from "@/types";
import { haversineKm, formatProgram } from "@/lib/utils";

const STOPWORDS = new Set([
  "a",
  "an",
  "the",
  "and",
  "or",
  "of",
  "in",
  "on",
  "at",
  "to",
  "for",
  "with",
  "who",
  "that",
  "did",
  "does",
  "from",
  "into",
  "about",
  "looking",
  "find",
  "search",
  "someone",
  "alumni",
  "alumnus",
  "person",
  "people",
  "need",
  "want",
  "me",
  "my",
  "i",
]);

const ROLE_ALIASES: Record<string, string[]> = {
  pm: ["product manager", "product management", "pm"],
  "product manager": ["product manager", "product management", "pm"],
  "product management": ["product management", "product manager", "pm"],
  engineer: ["engineer", "engineering", "software engineer", "swe", "developer"],
  swe: ["software engineer", "engineer", "swe", "developer"],
  designer: ["designer", "design", "product designer", "ux", "ui"],
  founder: ["founder", "co-founder", "cofounder"],
  investor: ["investor", "vc", "venture", "angel"],
  marketer: ["marketing", "marketer", "growth"],
};

function normalize(s: string): string {
  return s.trim().toLowerCase();
}

function tokenize(query: string): string[] {
  return normalize(query)
    .replace(/[^a-z0-9+#./-]+/g, " ")
    .split(/\s+/)
    .map((t) => t.trim())
    .filter((t) => t.length >= 2 && !STOPWORDS.has(t));
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
  if (a.length !== b.length || a.length === 0) return 0;
  let dot = 0;
  let magA = 0;
  let magB = 0;
  for (let i = 0; i < a.length; i++) {
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

    if (hasLocation) {
      if (p.lat == null || p.lng == null) return false;
      const dist = haversineKm(filters.lat!, filters.lng!, p.lat, p.lng);
      if (dist > filters.location_radius_km!) return false;
    }

    return true;
  });
}

/** Pull structured filters + residual free-text from a natural language query. */
export function extractSearchIntent(query: string): {
  filters: SearchFilters;
  residualQuery: string;
} {
  let text = normalize(query);
  const programs: ProgramAffiliation[] = [];
  const divisions: Division[] = [];
  const industries: string[] = [];
  let cohort_year_min: number | null = null;
  let cohort_year_max: number | null = null;

  for (const program of PROGRAMS) {
    const label = normalize(PROGRAM_LABELS[program]);
    const code = normalize(program.replace(/_/g, " "));
    const aliases = [normalize(program), code, label].filter(Boolean);
    for (const alias of aliases) {
      if (!alias) continue;
      const re = new RegExp(`\\b${alias.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");
      if (re.test(text)) {
        if (!programs.includes(program)) programs.push(program);
        text = text.replace(re, " ");
      }
    }
  }

  for (const division of DIVISIONS) {
    const aliasList = [division, ...Object.entries(ROLE_ALIASES)
      .filter(([, values]) => values.some((v) => normalize(v) === normalize(division)))
      .map(([k]) => k)];
    for (const alias of aliasList) {
      const re = new RegExp(`\\b${normalize(alias).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");
      if (re.test(text)) {
        if (!divisions.includes(division)) divisions.push(division);
        text = text.replace(re, " ");
        break;
      }
    }
  }

  // Role shorthand → division chips, then strip from residual free-text
  for (const [alias, expansions] of Object.entries(ROLE_ALIASES)) {
    const re = new RegExp(`\\b${alias.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");
    if (!re.test(text)) continue;
    if (expansions.some((e) => e.includes("product"))) {
      if (!divisions.includes("Product Management")) divisions.push("Product Management");
    }
    if (expansions.some((e) => e.includes("design"))) {
      if (!divisions.includes("Design")) divisions.push("Design");
    }
    if (expansions.some((e) => e.includes("engineer") || e === "swe")) {
      if (!divisions.includes("Tech")) divisions.push("Tech");
    }
    if (expansions.some((e) => e.includes("marketing"))) {
      if (!divisions.includes("Marketing")) divisions.push("Marketing");
    }
    if (expansions.some((e) => e.includes("vc") || e.includes("investor"))) {
      if (!divisions.includes("VC/Finance")) divisions.push("VC/Finance");
    }
    text = text.replace(re, " ");
  }

  for (const industry of INDUSTRY_OPTIONS) {
    const re = new RegExp(
      `\\b${normalize(industry).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`,
      "i"
    );
    if (re.test(text)) {
      industries.push(industry);
      text = text.replace(re, " ");
    }
  }

  const yearMatches = Array.from(text.matchAll(/\b(20\d{2})\b/g)).map((m) => Number(m[1]));
  if (yearMatches.length === 1) {
    cohort_year_min = yearMatches[0];
    cohort_year_max = yearMatches[0];
    text = text.replace(/\b20\d{2}\b/, " ");
  } else if (yearMatches.length >= 2) {
    cohort_year_min = Math.min(...yearMatches);
    cohort_year_max = Math.max(...yearMatches);
    text = text.replace(/\b20\d{2}\b/g, " ");
  }

  const residualQuery = tokenize(text).join(" ");
  return {
    filters: {
      programs: programs.length ? programs : null,
      divisions: divisions.length ? divisions : null,
      industries: industries.length ? industries : null,
      cohort_year_min,
      cohort_year_max,
    },
    residualQuery,
  };
}

export function mergeSearchFilters(
  base: SearchFilters | null | undefined,
  inferred: SearchFilters
): SearchFilters {
  const uniq = <T extends string>(a?: T[] | null, b?: T[] | null): T[] | null => {
    const merged = [...(a ?? []), ...(b ?? [])];
    if (!merged.length) return null;
    return Array.from(new Set(merged));
  };

  return {
    programs: uniq(base?.programs, inferred.programs),
    divisions: uniq(base?.divisions, inferred.divisions),
    industries: uniq(base?.industries, inferred.industries),
    cohort_year_min: base?.cohort_year_min ?? inferred.cohort_year_min ?? null,
    cohort_year_max: base?.cohort_year_max ?? inferred.cohort_year_max ?? null,
    lat: base?.lat ?? null,
    lng: base?.lng ?? null,
    location_radius_km: base?.location_radius_km ?? null,
  };
}

function scoreField(haystack: string | null | undefined, terms: string[], weight: number): number {
  if (!haystack || terms.length === 0) return 0;
  const text = normalize(haystack);
  let hits = 0;
  for (const term of terms) {
    if (text === term || text.startsWith(`${term} `) || text.includes(` ${term}`) || text.includes(term)) {
      hits += 1;
    }
  }
  return (hits / terms.length) * weight;
}

function expandTerms(terms: string[]): string[] {
  const out = new Set(terms);
  for (const term of terms) {
    const aliases = ROLE_ALIASES[term];
    if (aliases) aliases.forEach((a) => out.add(a));
  }
  return Array.from(out);
}

function keywordScore(profile: Profile, query: string): number {
  const q = normalize(query);
  if (!q) return 0;

  const rawTerms = tokenize(q);
  if (rawTerms.length === 0 && q.length < 2) return 0;
  const terms = expandTerms(rawTerms.length ? rawTerms : [q]);

  const name = normalize(profile.full_name);
  let nameBoost = 0;
  if (name === q) nameBoost = 1;
  else if (name.startsWith(q) || name.split(/\s+/).some((part) => part.startsWith(q))) nameBoost = 0.92;
  else if (rawTerms.length && rawTerms.every((t) => name.includes(t))) nameBoost = 0.85;

  const weighted =
    scoreField(profile.full_name, terms, 1.0) * 0.28 +
    scoreField(profile.current_title, terms, 1.0) * 0.18 +
    scoreField(profile.current_company, terms, 1.0) * 0.14 +
    scoreField((profile.industries ?? []).join(" "), terms, 1.0) * 0.12 +
    scoreField((profile.startups ?? []).join(" "), terms, 1.0) * 0.1 +
    scoreField(
      [
        ...(profile.programs ?? []).map((p) => `${p} ${formatProgram(p)}`),
        ...(profile.divisions ?? []),
        ...(profile.eboard_roles ?? []),
      ].join(" "),
      terms,
      1.0
    ) * 0.1 +
    scoreField([profile.city, profile.region, profile.country].filter(Boolean).join(" "), terms, 1.0) *
      0.05 +
    scoreField(profile.bio, terms, 1.0) * 0.03;

  return Math.min(1, Math.max(nameBoost, weighted));
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
    .filter((p) => p.embedding && p.embedding.length === queryEmbedding.length)
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
  const intent = extractSearchIntent(query);
  const mergedFilters = mergeSearchFilters(filters, intent.filters);
  const filtered = filterByStructuredFields(profiles, mergedFilters);
  const q = intent.residualQuery;
  const hasStructured =
    (mergedFilters.programs?.length ?? 0) > 0 ||
    (mergedFilters.divisions?.length ?? 0) > 0 ||
    (mergedFilters.industries?.length ?? 0) > 0 ||
    mergedFilters.cohort_year_min != null;

  const scored = filtered.map((p) => {
    const keyword = q ? keywordScore(p, q) : 0;
    const canSemantic =
      Boolean(queryEmbedding) &&
      Boolean(p.embedding) &&
      p.embedding!.length === queryEmbedding!.length;
    const semantic = canSemantic ? cosineSim(queryEmbedding!, p.embedding!) : 0;

    // Filter-only queries (e.g. "BUILD fintech") should still rank matched alumni
    const filterBase = hasStructured && !q && !queryEmbedding ? 0.55 : hasStructured ? 0.15 : 0;

    let similarity: number;
    if (!queryEmbedding || !canSemantic) {
      similarity = Math.max(keyword, filterBase);
    } else if (keyword >= 0.75) {
      similarity = 0.8 * keyword + 0.2 * semantic;
    } else if (keyword >= 0.35) {
      similarity = 0.55 * keyword + 0.45 * semantic;
    } else if (keyword > 0) {
      similarity = 0.35 * keyword + 0.65 * semantic;
    } else if (hasStructured) {
      similarity = Math.max(filterBase, 0.5 * semantic + filterBase);
    } else {
      similarity = semantic;
    }

    if (hasStructured && similarity > 0) {
      similarity = Math.min(1, similarity + 0.05);
    }

    return { ...p, similarity };
  });

  const minScore = queryEmbedding ? 0.12 : 0.08;

  return scored
    .filter((p) => {
      if (!normalize(query) && !hasStructured) return true;
      return p.similarity >= minScore || (hasStructured && p.similarity > 0);
    })
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
    profile.city &&
      `located in ${profile.city}${profile.region ? `, ${profile.region}` : ""} ${profile.country ?? ""}`,
    profile.cohort_year && `cohort ${profile.cohort_year}`,
    `Programs: ${(profile.programs ?? []).map((p) => formatProgram(p)).join(", ")}`,
    `Divisions: ${(profile.divisions ?? []).join(", ")}`,
    profile.eboard_roles?.length && `E-Board: ${profile.eboard_roles.join(", ")}`,
    profile.startups?.length && `Startups: ${profile.startups.join(", ")}`,
    profile.industries?.length && `Industries: ${profile.industries.join(", ")}`,
    profile.notification_industries?.length &&
      `Interested in: ${profile.notification_industries.join(", ")}`,
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
