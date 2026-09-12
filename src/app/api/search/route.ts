import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ensureSeedData, getAllProfiles, trackEvent, resolveSessionUser } from "@/lib/data";
import { extractSearchIntent, hybridSearch, mergeSearchFilters } from "@/lib/hybridSearch";
import { embedText, hasOpenAIEmbeddings } from "@/lib/embeddings";
import type { SearchFilters, ProgramAffiliation, Division } from "@/types";
import { SESSION_COOKIE } from "@/lib/auth/session";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function parseFilters(searchParams: URLSearchParams): SearchFilters {
  const programs = searchParams.get("programs")?.split(",").filter(Boolean) as
    | ProgramAffiliation[]
    | undefined;
  const divisions = searchParams.get("divisions")?.split(",").filter(Boolean) as
    | Division[]
    | undefined;
  const industries = searchParams.get("industries")?.split(",").filter(Boolean);
  const cohortMin = searchParams.get("cohort_year_min");
  const cohortMax = searchParams.get("cohort_year_max");

  return {
    programs,
    divisions,
    industries,
    cohort_year_min: cohortMin ? Number(cohortMin) : null,
    cohort_year_max: cohortMax ? Number(cohortMax) : null,
  };
}

export async function GET(req: NextRequest) {
  await ensureSeedData();
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") ?? "";
  const filters = parseFilters(searchParams);
  const profiles = await getAllProfiles();

  const intent = extractSearchIntent(q);
  const merged = mergeSearchFilters(filters, intent.filters);
  const embedSource = intent.residualQuery || q;

  let queryEmbedding: number[] | null = null;
  let mode: "hybrid" | "keyword" = "keyword";
  if (embedSource.trim() && hasOpenAIEmbeddings()) {
    queryEmbedding = await embedText(embedSource);
    if (queryEmbedding) mode = "hybrid";
  }

  const results = hybridSearch(profiles, q, queryEmbedding, merged, 30);

  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value ?? null;
  const currentUser = await resolveSessionUser(token);
  await trackEvent(currentUser?.id ?? null, "search", {
    query: q,
    resultCount: results.length,
    mode,
  });

  return NextResponse.json(
    {
      results,
      query: q,
      mode,
      appliedFilters: merged,
      openaiConfigured: hasOpenAIEmbeddings(),
    },
    { headers: { "Cache-Control": "no-store, max-age=0" } }
  );
}

export async function POST(req: NextRequest) {
  await ensureSeedData();
  const { query, filters } = await req.json();
  const q = query ?? "";
  const profiles = await getAllProfiles();
  const intent = extractSearchIntent(q);
  const merged = mergeSearchFilters(filters, intent.filters);
  const embedSource = intent.residualQuery || q;

  let queryEmbedding: number[] | null = null;
  let mode: "hybrid" | "keyword" = "keyword";
  if (embedSource.trim() && hasOpenAIEmbeddings()) {
    queryEmbedding = await embedText(embedSource);
    if (queryEmbedding) mode = "hybrid";
  }

  const results = hybridSearch(profiles, q, queryEmbedding, merged, 30);
  return NextResponse.json(
    { results, mode, appliedFilters: merged, openaiConfigured: hasOpenAIEmbeddings() },
    { headers: { "Cache-Control": "no-store, max-age=0" } }
  );
}
