import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getEmailDomain(email: string): string {
  return email.split("@")[1]?.toLowerCase() ?? "";
}

export function formatProgram(program: string): string {
  const labels: Record<string, string> = {
    TL_INTERNAL: "TL Internal",
    IGNITE: "IGNITE",
    BUILD: "BUILD Startup",
    DEMO: "DEMO Startup",
  };
  return labels[program] ?? program;
}

export function haversineKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function profileCompletionScore(profile: {
  full_name?: string | null;
  cohort_year?: number | null;
  programs?: unknown[] | null;
  divisions?: unknown[] | null;
  current_title?: string | null;
  current_company?: string | null;
  linkedin_url?: string | null;
  bio?: string | null;
  industries?: unknown[] | null;
  startups?: unknown[] | null;
  city?: string | null;
  lat?: number | null;
  phone?: string | null;
}): number {
  const fields = [
    Boolean(profile.full_name?.trim()),
    profile.cohort_year != null,
    (profile.programs?.length ?? 0) > 0,
    (profile.divisions?.length ?? 0) > 0,
    Boolean(profile.current_title?.trim()),
    Boolean(profile.current_company?.trim()),
    Boolean(profile.linkedin_url?.trim()),
    Boolean(profile.bio?.trim()),
    (profile.industries?.length ?? 0) > 0,
    (profile.startups?.length ?? 0) > 0,
    profile.lat != null || Boolean(profile.city?.trim()),
    Boolean(profile.phone?.trim()),
  ];
  return Math.round((fields.filter(Boolean).length / fields.length) * 100);
}
