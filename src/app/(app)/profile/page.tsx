"use client";

import { useEffect, useState } from "react";
import { ProfileForm } from "@/components/profile/ProfileForm";
import type { Profile } from "@/types";
import { profileCompletionScore } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
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
        if (!cancelled) setProfile(data.profile ?? null);
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
    if (data.profile) setProfile(data.profile);
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

  const completion = profileCompletionScore(profile);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-[0.18em] text-white">YOUR PROFILE</h1>
        <p className="mt-2 text-white/50">{profile.email}</p>
        <div className="mt-3">
          <div className="flex items-center justify-between text-[11px] uppercase tracking-nav text-white/50">
            <span>Profile completion</span>
            <span>{completion}%</span>
          </div>
          <div className="mt-2 h-[1px] overflow-hidden bg-white/15">
            <div className="h-full bg-gradient-to-r from-[#fe0101] to-[#ffc700] transition-all" style={{ width: `${completion}%` }} />
          </div>
        </div>
      </div>
      <ProfileForm profile={profile} onSave={handleSave} />
    </div>
  );
}
