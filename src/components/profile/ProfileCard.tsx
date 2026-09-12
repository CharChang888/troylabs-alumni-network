import Link from "next/link";
import type { Profile } from "@/types";
import { ProgramBadge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function ProfileCard({
  profile,
  similarity,
  className,
}: {
  profile: Profile;
  similarity?: number;
  className?: string;
}) {
  const initials = profile.full_name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <Link href={`/members/${profile.id}`} className={cn("group flex h-full w-full", className)}>
      <div className="glass-panel glass-panel-hover flex h-full w-full flex-col border border-white/20 px-5 py-5">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/30 text-xs font-medium text-tl-gold">
            {initials || "?"}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="truncate font-medium tracking-wide text-white group-hover:text-tl-gold">
              {profile.full_name || "Unnamed"}
            </h3>
            <p className="truncate text-sm text-white/55">
              {profile.current_title}
              {profile.current_company && ` · ${profile.current_company}`}
            </p>
            {profile.city && (
              <p className="mt-1 text-xs text-white/35">
                {profile.city}{profile.region ? `, ${profile.region}` : ""}
              </p>
            )}
          </div>
        </div>
        <div className="mt-auto flex flex-wrap gap-1 pt-4">
          {(profile.programs ?? []).slice(0, 2).map((p) => (
            <ProgramBadge key={p} program={p} />
          ))}
        </div>
        {similarity != null && similarity > 0 && (
          <p className="mt-2 text-[10px] uppercase tracking-nav text-tl-blue-soft">
            {Math.round(similarity * 100)}% match
          </p>
        )}
      </div>
    </Link>
  );
}
