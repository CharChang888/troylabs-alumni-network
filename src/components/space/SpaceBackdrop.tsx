"use client";

import { Starfield } from "@/components/space/Starfield";

export function SpaceBackdrop() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-[#0b0907]">
      {/* Warm nebula core */}
      <div className="absolute left-1/2 top-1/3 h-[70vh] w-[70vh] -translate-x-1/2 rounded-full bg-[#3a2218]/45 blur-[140px]" />
      {/* BUILD burnt orange */}
      <div className="absolute -left-24 top-[-10%] h-[55vh] w-[55vh] rounded-full bg-[#b84528]/25 blur-[120px]" />
      {/* DEMO blue */}
      <div className="absolute -right-16 bottom-[-8%] h-[50vh] w-[50vh] rounded-full bg-[#5a9fe8]/18 blur-[130px]" />
      {/* IGNITE mustard */}
      <div className="absolute bottom-[18%] left-[8%] h-[32vh] w-[32vh] rounded-full bg-[#c9a84c]/14 blur-[100px]" />
      <Starfield />
    </div>
  );
}
