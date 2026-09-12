"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import dynamic from "next/dynamic";
import type { GlobePin, Profile } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";

const Globe = dynamic(() => import("react-globe.gl"), { ssr: false });

interface GlobeMapProps {
  pins: GlobePin[];
  onRefresh?: () => void;
}

function createStarMarker(pin: GlobePin, onClick: (pin: GlobePin) => void) {
  const el = document.createElement("button");
  el.type = "button";
  el.title = pin.full_name;
  el.setAttribute("aria-label", pin.full_name);
  el.innerHTML = `
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#e23a1f"
        stroke="#c9a84c"
        stroke-width="0.8"
        d="M12 2.5l2.6 6.4 6.9.6-5.2 4.5 1.6 6.7L12 17.2l-5.9 3.5 1.6-6.7L2.5 9.5l6.9-.6L12 2.5z"
      />
    </svg>
  `;
  el.style.cssText = [
    "background:transparent",
    "border:0",
    "padding:0",
    "cursor:pointer",
    "transform:translate(-50%,-50%)",
    "filter:drop-shadow(0 0 4px rgba(226,58,31,0.75))",
    "line-height:0",
  ].join(";");
  el.addEventListener("click", (event) => {
    event.stopPropagation();
    onClick(pin);
  });
  return el;
}

export function GlobeMap({ pins, onRefresh }: GlobeMapProps) {
  const globeRef = useRef<{
    pointOfView: (pov: { lat?: number; lng?: number; altitude?: number }, ms?: number) => void;
  } | null>(null);
  const [selected, setSelected] = useState<Profile | GlobePin | null>(null);
  const [loadingPin, setLoadingPin] = useState(false);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const containerRef = useRef<HTMLDivElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  const clickHandlerRef = useRef<(pin: GlobePin) => void>(() => undefined);

  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        });
      }
    };
    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  useEffect(() => {
    const refresh = () => onRefresh?.();
    const onVisibility = () => {
      if (document.visibilityState === "visible") refresh();
    };
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [onRefresh]);

  useEffect(() => {
    if (!selected || !popupRef.current) return;
    popupRef.current.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "nearest" });
  }, [selected, loadingPin]);

  const handlePinClick = useCallback(async (pin: GlobePin) => {
    setSelected(pin);
    setLoadingPin(true);
    globeRef.current?.pointOfView({ lat: pin.lat, lng: pin.lng, altitude: 1.5 }, 1000);
    try {
      const res = await fetch(`/api/profiles/${pin.id}`, { cache: "no-store" });
      const data = await res.json();
      if (data.profile) setSelected(data.profile);
    } catch {
      setSelected(pin);
    } finally {
      setLoadingPin(false);
    }
  }, []);

  clickHandlerRef.current = handlePinClick;

  const title = selected && "current_title" in selected ? selected.current_title : null;
  const company = selected && "current_company" in selected ? selected.current_company : null;
  const city = selected && "city" in selected ? selected.city : null;
  const region = selected && "region" in selected ? selected.region : null;

  return (
    <div ref={containerRef} className="relative h-[min(70vh,calc(100vh-12rem))] min-h-[360px] w-full overflow-hidden">
      <Globe
        // @ts-expect-error react-globe.gl ref typing
        ref={globeRef}
        onGlobeReady={() => {
          globeRef.current?.pointOfView({ lat: 20, lng: 0, altitude: 2.5 }, 0);
        }}
        width={dimensions.width}
        height={dimensions.height}
        globeImageUrl="//unpkg.com/three-globe/example/img/earth-night.jpg"
        bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
        backgroundColor="rgba(0,0,0,0)"
        htmlElementsData={pins}
        htmlLat="lat"
        htmlLng="lng"
        htmlAltitude={0.012}
        htmlElement={(d: object) => createStarMarker(d as GlobePin, (pin) => clickHandlerRef.current(pin))}
        atmosphereColor="#c9a84c"
        atmosphereAltitude={0.15}
      />

      {selected && (
        <Card
          ref={popupRef}
          className="absolute left-4 top-4 z-10 max-h-[min(50%,22rem)] max-w-xs overflow-y-auto border-white/25 bg-black/55 shadow-[0_8px_40px_rgba(0,0,0,0.45)] backdrop-blur-md"
        >
          <CardContent className="p-4">
            <h3 className="font-semibold text-white">{selected.full_name}</h3>
            <p className="text-sm text-white/60">
              {title}
              {company && ` · ${company}`}
            </p>
            {city && (
              <p className="mt-1 text-xs text-white/40">
                {city}
                {region ? `, ${region}` : ""}
              </p>
            )}
            {loadingPin && (
              <p className="mt-1 text-[10px] uppercase tracking-nav text-white/35">Refreshing...</p>
            )}
            <Link
              href={`/members/${selected.id}`}
              className="mt-2 inline-block text-sm text-tl-gold hover:underline"
            >
              View profile →
            </Link>
            <button
              type="button"
              onClick={() => setSelected(null)}
              className="ml-4 text-sm text-white/40 hover:text-white"
            >
              Close
            </button>
          </CardContent>
        </Card>
      )}

      <div className="absolute bottom-4 right-4 text-[11px] uppercase tracking-nav text-white/50">
        {pins.length} alumni on map
      </div>
    </div>
  );
}
