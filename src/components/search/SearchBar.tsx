"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DIVISIONS,
  INDUSTRY_OPTIONS,
  PROGRAM_LABELS,
  PROGRAMS,
  type Division,
  type ProgramAffiliation,
} from "@/types";

interface SearchBarProps {
  initialQuery?: string;
  initialPrograms?: string[];
  initialDivisions?: string[];
  initialIndustries?: string[];
}

function toggleValue<T extends string>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

export function SearchBar({
  initialQuery = "",
  initialPrograms = [],
  initialDivisions = [],
  initialIndustries = [],
}: SearchBarProps) {
  const [query, setQuery] = useState(initialQuery);
  const [programs, setPrograms] = useState<ProgramAffiliation[]>(
    initialPrograms as ProgramAffiliation[]
  );
  const [divisions, setDivisions] = useState<Division[]>(initialDivisions as Division[]);
  const [industries, setIndustries] = useState<string[]>(initialIndustries);
  const router = useRouter();

  useEffect(() => {
    setQuery(initialQuery);
    setPrograms(initialPrograms as ProgramAffiliation[]);
    setDivisions(initialDivisions as Division[]);
    setIndustries(initialIndustries);
  }, [initialQuery, initialPrograms, initialDivisions, initialIndustries]);

  const chipClass = (active: boolean) =>
    `rounded-full border px-3 py-1 text-[11px] uppercase tracking-nav transition ${
      active
        ? "border-tl-gold/70 bg-tl-gold/15 text-tl-gold"
        : "border-white/15 text-white/45 hover:border-white/30 hover:text-white/70"
    }`;

  const hasFilters = useMemo(
    () => programs.length + divisions.length + industries.length > 0,
    [programs, divisions, industries]
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    if (programs.length) params.set("programs", programs.join(","));
    if (divisions.length) params.set("divisions", divisions.join(","));
    if (industries.length) params.set("industries", industries.join(","));
    router.push(`/home?${params.toString()}`);
  };

  return (
    <form onSubmit={handleSearch} className="w-full space-y-5 text-left">
      <div className="relative">
        <Search className="absolute left-0 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder='e.g. "PM in fintech who did BUILD" or a name'
          className="h-12 rounded-none border-x-0 border-t-0 border-b border-white/30 bg-transparent pl-8 text-base tracking-wide"
        />
        <Button type="submit" className="absolute right-0 top-1/2 -translate-y-1/2" size="sm" variant="ghost">
          Search
        </Button>
      </div>

      <div className="space-y-3">
        <div className="flex flex-wrap gap-2">
          {PROGRAMS.map((p) => (
            <button
              key={p}
              type="button"
              className={chipClass(programs.includes(p))}
              onClick={() => setPrograms((prev) => toggleValue(prev, p))}
            >
              {PROGRAM_LABELS[p]}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {DIVISIONS.filter((d) => d !== "DEMO").map((d) => (
            <button
              key={d}
              type="button"
              className={chipClass(divisions.includes(d))}
              onClick={() => setDivisions((prev) => toggleValue(prev, d))}
            >
              {d}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {INDUSTRY_OPTIONS.slice(0, 10).map((industry) => (
            <button
              key={industry}
              type="button"
              className={chipClass(industries.includes(industry))}
              onClick={() => setIndustries((prev) => toggleValue(prev, industry))}
            >
              {industry}
            </button>
          ))}
        </div>
        {hasFilters && (
          <button
            type="button"
            className="text-[11px] uppercase tracking-nav text-white/35 hover:text-white/60"
            onClick={() => {
              setPrograms([]);
              setDivisions([]);
              setIndustries([]);
            }}
          >
            Clear filters
          </button>
        )}
      </div>
    </form>
  );
}
