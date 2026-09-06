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

export function GlobeMap({ pins, onRefresh }: GlobeMapProps) {
  const globeRef = useRef<{
    pointOfView: (pov: { lat?: number; lng?: number; altitude?: number }, ms?: number) => void;
  } | null>(null);
  const [selected, setSelected] = useState<Profile | GlobePin | null>(null);
  const [loadingPin, setLoadingPin] = useState(false);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const containerRef = useRef<HTMLDivElement>(null);

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

  const title = selected && "current_title" in selected ? selected.current_title : null;
  const company = selected && "current_company" in selected ? selected.current_company : null;
  const city = selected && "city" in selected ? selected.city : null;
  const region = selected && "region" in selected ? selected.region : null;

  return (
    <div ref={containerRef} className="relative h-[calc(100vh-8rem)] min-h-[400px] w-full overflow-hidden">
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
        pointsData={pins}
        pointLat="lat"
        pointLng="lng"
        pointColor={() => "#fe0101"}
        pointAltitude={0.01}
        pointRadius={0.4}
        pointsMerge={false}
        onPointClick={(point: object) => handlePinClick(point as GlobePin)}
        atmosphereColor="#ffc700"
        atmosphereAltitude={0.15}
      />

      {selected && (
        <Card className="absolute bottom-4 left-4 z-10 max-w-xs border-white/20">
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
              className="mt-2 inline-block text-sm text-[#ffc700] hover:underline"
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

      <div className="absolute right-4 top-4 text-[11px] uppercase tracking-nav text-white/50">
        {pins.length} alumni on map
      </div>
    </div>
  );
}
