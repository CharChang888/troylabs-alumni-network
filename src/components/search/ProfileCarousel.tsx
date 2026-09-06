"use client";

import { useEffect, useRef } from "react";
import type { Profile } from "@/types";
import { ProfileCard } from "@/components/profile/ProfileCard";

interface ProfileCarouselProps {
  profiles: Array<Profile & { similarity?: number }>;
}

export function ProfileCarousel({ profiles }: ProfileCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el || profiles.length === 0) return;

    let animationId: number;
    let scrollPos = 0;

    const animate = () => {
      scrollPos += 0.5;
      if (scrollPos >= el.scrollWidth / 2) scrollPos = 0;
      el.scrollLeft = scrollPos;
      animationId = requestAnimationFrame(animate);
    };

    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!prefersReduced) animationId = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(animationId);
  }, [profiles.length]);

  if (profiles.length === 0) {
    return <p className="text-white/50">Complete your profile to see suggested alumni.</p>;
  }

  const doubled = [...profiles, ...profiles];

  return (
    <div className="relative overflow-hidden">
      <div
        ref={scrollRef}
        className="flex items-stretch gap-4 overflow-x-hidden pb-2"
        style={{ scrollBehavior: "auto" }}
      >
        {doubled.map((profile, i) => (
          <ProfileCard
            key={`${profile.id}-${i}`}
            profile={profile}
            similarity={profile.similarity}
            className="w-[260px] min-w-[260px] shrink-0"
          />
        ))}
      </div>
    </div>
  );
}
