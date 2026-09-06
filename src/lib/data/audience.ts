import type { AudienceFilters, GlobePin, Profile } from "@/types";

export function matchAudience(profiles: Profile[], filters: AudienceFilters): Profile[] {
  return profiles.filter((p) => {
    if (!p.sms_opt_in || !p.phone) return false;
    if (filters.user_ids?.length && !filters.user_ids.includes(p.id)) return false;
    if (filters.programs?.length && !filters.programs.some((f) => p.programs.includes(f))) return false;
    if (filters.divisions?.length && !filters.divisions.some((f) => p.divisions.includes(f))) return false;
    if (
      filters.industries?.length &&
      !filters.industries.some((f) => p.notification_industries.includes(f) || p.industries.includes(f))
    ) {
      return false;
    }
    return true;
  });
}

export function toGlobePins(
  profiles: Profile[],
  filters?: {
    programs?: string[];
    divisions?: string[];
    industries?: string[];
  }
): GlobePin[] {
  return profiles
    .filter((p) => p.lat != null && p.lng != null)
    .filter((p) => {
      if (filters?.programs?.length && !filters.programs.some((f) => p.programs.includes(f as Profile["programs"][number]))) {
        return false;
      }
      if (filters?.divisions?.length && !filters.divisions.some((f) => p.divisions.includes(f as Profile["divisions"][number]))) {
        return false;
      }
      if (filters?.industries?.length && !filters.industries.some((f) => p.industries.includes(f))) {
        return false;
      }
      return true;
    })
    .map((p) => ({
      id: p.id,
      full_name: p.full_name,
      lat: p.lat!,
      lng: p.lng!,
      programs: p.programs,
      divisions: p.divisions,
      current_title: p.current_title,
      current_company: p.current_company,
      photo_url: p.photo_url,
    }));
}
