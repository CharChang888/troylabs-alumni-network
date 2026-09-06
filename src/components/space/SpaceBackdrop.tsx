"use client";

import { Starfield } from "@/components/space/Starfield";

export function SpaceBackdrop() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <div className="absolute -left-24 top-[-10%] h-[55vh] w-[55vh] rounded-full bg-[#fe0101]/20 blur-[120px]" />
      <div className="absolute -right-16 bottom-[-8%] h-[50vh] w-[50vh] rounded-full bg-[#bcd4ff]/20 blur-[130px]" />
      <div className="absolute bottom-[18%] left-[8%] h-[32vh] w-[32vh] rounded-full bg-[#ffc700]/12 blur-[100px]" />
      <Starfield />
    </div>
  );
}
