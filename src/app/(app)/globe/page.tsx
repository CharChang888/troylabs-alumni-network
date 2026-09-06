"use client";

import { useEffect, useState } from "react";
import { GlobeMap } from "@/components/globe/GlobeMap";
import type { GlobePin, ProgramAffiliation } from "@/types";
import { PROGRAMS } from "@/types";
import { formatProgram } from "@/lib/utils";

export default function GlobePage() {
  const [pins, setPins] = useState<GlobePin[]>([]);
  const [filters, setFilters] = useState<{ programs?: string[] }>({});

  const loadPins = (f?: { programs?: string[]; divisions?: string[]; industries?: string[] }) => {
    const params = new URLSearchParams();
    if (f?.programs?.length) params.set("programs", f.programs.join(","));
    fetch(`/api/globe?${params}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => setPins(data.pins ?? []));
  };

  useEffect(() => {
    loadPins(filters);
  }, [filters]);

  const toggleProgram = (p: ProgramAffiliation) => {
    const current = filters.programs ?? [];
    const next = current.includes(p) ? current.filter((x) => x !== p) : [...current, p];
    setFilters({ programs: next.length ? next : undefined });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-[0.18em] text-white">ALUMNI GLOBE</h1>
          <p className="mt-2 text-sm text-white/50">Pins update when alumni change their location.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {PROGRAMS.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => toggleProgram(p)}
              className={`px-3 py-1 text-[11px] uppercase tracking-nav transition-colors ${
                filters.programs?.includes(p)
                  ? "border border-white text-white"
                  : "border border-white/20 text-white/45 hover:border-white/60 hover:text-white"
              }`}
            >
              {formatProgram(p)}
            </button>
          ))}
        </div>
      </div>
      <GlobeMap pins={pins} onRefresh={() => loadPins(filters)} />
      <p className="text-center text-xs text-white/40">
        Search from Home for a list view of alumni
      </p>
    </div>
  );
}
