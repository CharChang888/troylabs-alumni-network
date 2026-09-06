"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { SearchBar } from "@/components/search/SearchBar";
import type { GlobePin } from "@/types";

const GlobeMap = dynamic(
  () => import("@/components/globe/GlobeMap").then((m) => m.GlobeMap),
  { ssr: false }
);

/**
 * Embeddable alumni portal view for Phase 4 website integration.
 * Mount via iframe: /embed?accent=%236366f1&bg=%230a0a0f
 */
export default function EmbedPage() {
  const [pins, setPins] = useState<GlobePin[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const params = new URLSearchParams(window.location.search);
    const accent = params.get("accent");
    const bg = params.get("bg");
    if (accent) document.documentElement.style.setProperty("--embed-accent", accent);
    if (bg) document.documentElement.style.setProperty("--embed-bg", bg);
    document.body.classList.add("embed-mode");

    fetch("/api/globe")
      .then((r) => r.json())
      .then((data) => setPins(data.pins ?? []));
  }, []);

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-[var(--embed-bg,var(--background))] p-4">
      <div className="mb-4 text-center">
        <span className="text-lg font-semibold text-white">TL Alumni Network</span>
      </div>
      <div className="mx-auto mb-6 max-w-xl">
        <SearchBar />
      </div>
      <div className="mx-auto max-w-5xl">
        <GlobeMap pins={pins} />
      </div>
      <p className="mt-4 text-center text-xs text-white/30">
        Embed this view in your club website via iframe (Phase 4)
      </p>
    </div>
  );
}
