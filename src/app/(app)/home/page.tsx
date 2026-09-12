"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { SearchBar } from "@/components/search/SearchBar";
import { ProfileCarousel } from "@/components/search/ProfileCarousel";
import { ProfileCard } from "@/components/profile/ProfileCard";
import type { Profile, HybridSearchResult, SearchFilters } from "@/types";

function splitParam(value: string | null): string[] {
  return value?.split(",").filter(Boolean) ?? [];
}

function HomeContent() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q") ?? "";
  const programs = splitParam(searchParams.get("programs"));
  const divisions = splitParam(searchParams.get("divisions"));
  const industries = splitParam(searchParams.get("industries"));
  const hasQuery = Boolean(query.trim() || programs.length || divisions.length || industries.length);

  const [suggestions, setSuggestions] = useState<Array<Profile & { similarity?: number }>>([]);
  const [results, setResults] = useState<HybridSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [mode, setMode] = useState<"hybrid" | "keyword" | null>(null);
  const [appliedFilters, setAppliedFilters] = useState<SearchFilters | null>(null);

  useEffect(() => {
    const loadSuggestions = () => {
      fetch("/api/suggestions", { cache: "no-store" })
        .then((r) => r.json())
        .then((data) => setSuggestions(data.suggestions ?? []));
    };
    loadSuggestions();
    const onFocus = () => loadSuggestions();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, []);

  useEffect(() => {
    if (!hasQuery) {
      setResults([]);
      setMode(null);
      setAppliedFilters(null);
      return;
    }
    setSearching(true);
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    if (programs.length) params.set("programs", programs.join(","));
    if (divisions.length) params.set("divisions", divisions.join(","));
    if (industries.length) params.set("industries", industries.join(","));

    fetch(`/api/search?${params.toString()}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        setResults(data.results ?? []);
        setMode(data.mode ?? null);
        setAppliedFilters(data.appliedFilters ?? null);
      })
      .finally(() => setSearching(false));
  }, [query, programs.join(","), divisions.join(","), industries.join(","), hasQuery]);

  const inferredNote = (() => {
    if (!appliedFilters) return null;
    const bits: string[] = [];
    if (appliedFilters.programs?.length) bits.push(appliedFilters.programs.join(", "));
    if (appliedFilters.divisions?.length) bits.push(appliedFilters.divisions.join(", "));
    if (appliedFilters.industries?.length) bits.push(appliedFilters.industries.join(", "));
    if (appliedFilters.cohort_year_min) {
      bits.push(
        appliedFilters.cohort_year_min === appliedFilters.cohort_year_max
          ? `cohort ${appliedFilters.cohort_year_min}`
          : `cohort ${appliedFilters.cohort_year_min}–${appliedFilters.cohort_year_max}`
      );
    }
    return bits.length ? bits.join(" · ") : null;
  })();

  return (
    <div className="space-y-16">
      <section className="pt-8 text-center">
        <h1 className="text-4xl font-bold tracking-[0.12em] text-white sm:text-5xl">WHO ARE YOU LOOKING FOR?</h1>
        <p className="mx-auto mt-5 max-w-xl text-sm text-white/55">
          Search by name, role, industry, or Troy Labs program — or describe who you need in plain language.
        </p>
        <div className="mx-auto mt-10 max-w-2xl">
          <SearchBar
            initialQuery={query}
            initialPrograms={programs}
            initialDivisions={divisions}
            initialIndustries={industries}
          />
        </div>
      </section>

      {hasQuery ? (
        <section>
          <h2 className="mb-2 text-center text-[11px] uppercase tracking-nav text-white/50">Search results</h2>
          {inferredNote && (
            <p className="mb-6 text-center text-xs text-white/40">
              Matched filters: {inferredNote}
              {mode === "keyword" ? " · keyword ranking" : mode === "hybrid" ? " · semantic + keyword" : ""}
            </p>
          )}
          {!inferredNote && mode && (
            <p className="mb-6 text-center text-xs text-white/40">
              {mode === "hybrid" ? "Semantic + keyword ranking" : "Keyword ranking"}
            </p>
          )}
          {searching ? (
            <p className="text-center text-white/50">Searching...</p>
          ) : results.length === 0 ? (
            <p className="text-center text-white/50">No alumni found. Try a different search or fewer filters.</p>
          ) : (
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {results.map((profile) => (
                <ProfileCard key={profile.id} profile={profile} similarity={profile.similarity} />
              ))}
            </div>
          )}
        </section>
      ) : (
        <section>
          <h2 className="mb-6 text-center text-[11px] uppercase tracking-nav text-white/50">Suggested for you</h2>
          <ProfileCarousel profiles={suggestions} />
        </section>
      )}
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={<p className="text-white/50">Loading...</p>}>
      <HomeContent />
    </Suspense>
  );
}
