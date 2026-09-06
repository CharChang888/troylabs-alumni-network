"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { SearchBar } from "@/components/search/SearchBar";
import { ProfileCarousel } from "@/components/search/ProfileCarousel";
import { ProfileCard } from "@/components/profile/ProfileCard";
import type { Profile, HybridSearchResult } from "@/types";

function HomeContent() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q") ?? "";
  const [suggestions, setSuggestions] = useState<Array<Profile & { similarity?: number }>>([]);
  const [results, setResults] = useState<HybridSearchResult[]>([]);
  const [searching, setSearching] = useState(false);

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
    if (!query.trim()) {
      setResults([]);
      return;
    }
    setSearching(true);
    fetch(`/api/search?q=${encodeURIComponent(query)}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => setResults(data.results ?? data.results ?? []))
      .finally(() => setSearching(false));
  }, [query]);

  return (
    <div className="space-y-16">
      <section className="pt-8 text-center">
        <h1 className="text-4xl font-bold tracking-[0.12em] text-white sm:text-5xl">WHO ARE YOU LOOKING FOR?</h1>
        <p className="mx-auto mt-5 max-w-xl text-sm text-white/55">
          Search by industry, role, startups, or describe who you need in plain language.
        </p>
        <div className="mx-auto mt-10 max-w-2xl">
          <SearchBar initialQuery={query} />
        </div>
      </section>

      {query.trim() ? (
        <section>
          <h2 className="mb-6 text-center text-[11px] uppercase tracking-nav text-white/50">Search results</h2>
          {searching ? (
            <p className="text-center text-white/50">Searching...</p>
          ) : results.length === 0 ? (
            <p className="text-center text-white/50">No alumni found. Try a different search.</p>
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
