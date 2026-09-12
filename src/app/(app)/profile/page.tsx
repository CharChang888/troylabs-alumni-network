"use client";

import { useEffect, useState } from "react";
import { ProfileForm } from "@/components/profile/ProfileForm";
import type { Profile } from "@/types";
import { profileCompletionScore } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [draft, setDraft] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [needsLogin, setNeedsLogin] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/profiles")
      .then(async (r) => {
        if (r.status === 401) {
          await fetch("/api/auth/logout", { method: "POST" });
          window.location.href = "/login?redirect=/profile";
          return;
        }
        const data = await r.json();
        if (!cancelled) {
          setProfile(data.profile ?? null);
          setDraft(data.profile ?? null);
        }
      })
      .catch(() => {
        if (!cancelled) setNeedsLogin(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSave = async (updates: Partial<Profile>) => {
    const res = await fetch("/api/profiles", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    const data = await res.json();
    if (data.profile) {
      setProfile(data.profile);
      setDraft(data.profile);
    }
  };

  if (loading) return <p className="text-white/50">Loading profile...</p>;

  if (needsLogin || !profile) {
    return (
      <div className="mx-auto max-w-md space-y-4 text-center">
        <h1 className="text-2xl font-bold tracking-[0.18em] text-white">YOUR PROFILE</h1>
        <p className="text-white/50">
          Your session expired after a refresh. Sign in again to edit your profile.
        </p>
        <Button
          variant="secondary"
          onClick={async () => {
            await fetch("/api/auth/logout", { method: "POST" });
            window.location.href = "/login?redirect=/profile";
          }}
        >
          Sign in
        </Button>
      </div>
    );
  }

  const active = draft ?? profile;
  const completion = profileCompletionScore(active);
  const completionFields = [
    Boolean(active.full_name?.trim()),
    active.cohort_year != null,
    (active.programs?.length ?? 0) > 0,
    (active.divisions?.length ?? 0) > 0,
    Boolean(active.current_title?.trim()),
    Boolean(active.current_company?.trim()),
    Boolean(active.linkedin_url?.trim()),
    Boolean(active.bio?.trim()),
    (active.industries?.length ?? 0) > 0,
    (active.startups?.length ?? 0) > 0,
    active.lat != null || Boolean(active.city?.trim()),
    Boolean(active.phone?.trim()),
  ];
  const filledCount = completionFields.filter(Boolean).length;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-[0.18em] text-white">YOUR PROFILE</h1>
        <p className="mt-2 text-white/50">{profile.email}</p>
        <div className="mt-4 rounded-xl border border-white/15 bg-white/[0.04] px-4 py-3">
          <div className="flex items-center justify-between gap-3 text-[11px] uppercase tracking-nav text-white/55">
            <span>Profile completion</span>
            <span className="text-tl-gold">
              {completion}% · {filledCount}/{completionFields.length} fields
            </span>
          </div>
          <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-tl-accent to-tl-gold transition-all duration-300"
              style={{ width: `${Math.max(completion, completion > 0 ? 4 : 0)}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-white/40">
            Updates live as you fill fields — save when you&apos;re done.
          </p>
        </div>
      </div>
      <ProfileForm profile={profile} onSave={handleSave} onDraftChange={setDraft} />
    </div>
  );
}
