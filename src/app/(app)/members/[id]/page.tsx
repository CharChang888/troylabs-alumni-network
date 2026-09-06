"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import type { Profile } from "@/types";
import { ProgramBadge, Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin } from "lucide-react";

export default function MemberProfilePage() {
  const params = useParams();
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    const load = () => {
      fetch(`/api/profiles/${params.id}`, { cache: "no-store" })
        .then((r) => r.json())
        .then((data) => setProfile(data.profile));
    };
    load();
    const onFocus = () => load();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [params.id]);

  if (!profile) return <p className="text-white/50">Loading...</p>;

  const initials = profile.full_name.split(" ").map((n) => n[0]).join("").slice(0, 2);

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <Link href="/home" className="text-sm text-white/50 hover:text-white">← Back to home</Link>

      <div className="flex items-start gap-6">
        <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-tl-accent/30 text-2xl font-bold text-tl-accent-light">
          {initials}
        </div>
        <div>
          <h1 className="text-3xl font-bold text-white">{profile.full_name}</h1>
          <p className="text-lg text-white/60">
            {profile.current_title}
            {profile.current_company && ` at ${profile.current_company}`}
          </p>
          {profile.city && (
            <p className="mt-2 flex items-center gap-1 text-sm text-white/50">
              <MapPin className="h-4 w-4" />
              {profile.city}{profile.region ? `, ${profile.region}` : ""} {profile.country}
            </p>
          )}
          {profile.linkedin_url && (
            <a
              href={profile.linkedin_url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-block text-sm text-tl-blue hover:text-tl-gold"
            >
              LinkedIn profile →
            </a>
          )}
          <Link href={`/globe`} className="mt-3 block">
            <Button variant="secondary" size="sm">Show on globe</Button>
          </Link>
        </div>
      </div>

      {profile.bio && (
        <section>
          <h2 className="mb-2 font-semibold text-white">About</h2>
          <p className="text-white/70">{profile.bio}</p>
        </section>
      )}

      <section>
        <h2 className="mb-2 font-semibold text-white">Programs</h2>
        <div className="flex flex-wrap gap-2">
          {profile.programs.map((p) => <ProgramBadge key={p} program={p} />)}
        </div>
      </section>

      {(profile.eboard_roles?.length ?? 0) > 0 && (
        <section>
          <h2 className="mb-2 font-semibold text-white">E-Board Roles</h2>
          <div className="flex flex-wrap gap-2">
            {profile.eboard_roles.map((role) => (
              <Badge key={role} variant="accent">{role}</Badge>
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="mb-2 font-semibold text-white">Divisions</h2>
        <div className="flex flex-wrap gap-2">
          {profile.divisions.map((d) => <Badge key={d}>{d}</Badge>)}
        </div>
      </section>

      {profile.startups.length > 0 && (
        <section>
          <h2 className="mb-2 font-semibold text-white">TL BUILD startups</h2>
          <div className="flex flex-wrap gap-2">
            {profile.startups.map((s) => <Badge key={s} variant="accent">{s}</Badge>)}
          </div>
        </section>
      )}

      <section>
        <h2 className="mb-2 font-semibold text-white">Industries</h2>
        <div className="flex flex-wrap gap-2">
          {profile.industries.map((i) => <Badge key={i}>{i}</Badge>)}
        </div>
      </section>
    </div>
  );
}
