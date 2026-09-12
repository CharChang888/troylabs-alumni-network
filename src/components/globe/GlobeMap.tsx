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
    <span style="position:relative;display:block;width:34px;height:34px;">
      <span style="
        position:absolute;inset:4px;border-radius:999px;
        background:radial-gradient(circle, rgba(226,58,31,0.55) 0%, rgba(226,58,31,0) 70%);
        animation:tl-star-pulse 1.8s ease-in-out infinite;
      "></span>
      <svg width="34" height="34" viewBox="0 0 24 24" aria-hidden="true" style="position:relative;z-index:1;">
        <path
          fill="#ff4a2a"
          stroke="#ffd56a"
          stroke-width="1.4"
          d="M12 2.2l2.85 6.55 7.1.65-5.35 4.7 1.7 6.9L12 17.5l-6.3 3.5 1.7-6.9L2.05 9.4l7.1-.65L12 2.2z"
        />
      </svg>
    </span>
  `;
  if (!document.getElementById("tl-star-pulse-style")) {
    const style = document.createElement("style");
    style.id = "tl-star-pulse-style";
    style.textContent = `
      @keyframes tl-star-pulse {
        0%, 100% { transform: scale(0.85); opacity: 0.55; }
        50% { transform: scale(1.25); opacity: 1; }
      }
    `;
    document.head.appendChild(style);
  }
  el.style.cssText = [
    "background:transparent",
    "border:0",
    "padding:0",
    "cursor:pointer",
    "transform:translate(-50%,-50%)",
    "filter:drop-shadow(0 0 10px rgba(255,74,42,0.95)) drop-shadow(0 0 18px rgba(255,213,106,0.55))",
    "line-height:0",
    "z-index:2",
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
        htmlAltitude={0.02}
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
