import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ensureSeedData, getAllProfiles, trackEvent, resolveSessionUser } from "@/lib/data";
import { hybridSearch } from "@/lib/hybridSearch";
import { embedText } from "@/lib/embeddings";
import type { SearchFilters, ProgramAffiliation, Division } from "@/types";
import { SESSION_COOKIE } from "@/lib/auth/session";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: NextRequest) {
  await ensureSeedData();
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") ?? "";
  const programs = searchParams.get("programs")?.split(",").filter(Boolean) as ProgramAffiliation[] | undefined;
  const divisions = searchParams.get("divisions")?.split(",").filter(Boolean) as Division[] | undefined;
  const industries = searchParams.get("industries")?.split(",").filter(Boolean);

  const filters: SearchFilters = { programs, divisions, industries };
  const profiles = await getAllProfiles();

  let queryEmbedding: number[] | null = null;
  if (q.trim()) {
    queryEmbedding = await embedText(q);
  }

  const results = hybridSearch(profiles, q, queryEmbedding, filters, 30);

  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value ?? null;
  const currentUser = await resolveSessionUser(token);
  await trackEvent(currentUser?.id ?? null, "search", { query: q, resultCount: results.length });

  return NextResponse.json(
    { results, query: q },
    { headers: { "Cache-Control": "no-store, max-age=0" } }
  );
}

export async function POST(req: NextRequest) {
  await ensureSeedData();
  const { query, filters } = await req.json();
  const profiles = await getAllProfiles();
  const queryEmbedding = query ? await embedText(query) : null;
  const results = hybridSearch(profiles, query ?? "", queryEmbedding, filters, 30);
  return NextResponse.json({ results }, { headers: { "Cache-Control": "no-store, max-age=0" } });
}
