"use client";

import { useState } from "react";
import type { Profile, ProgramAffiliation, Division, EboardRole } from "@/types";
import { PROGRAMS, DIVISIONS, INDUSTRY_OPTIONS, EBOARD_ROLES } from "@/types";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatProgram } from "@/lib/utils";
import { Check, Loader2 } from "lucide-react";

interface ProfileFormProps {
  profile: Profile;
  onSave: (updates: Partial<Profile>) => Promise<void>;
}

function Pill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-1 text-[11px] uppercase tracking-wider transition-colors ${
        active
          ? "border border-white text-white"
          : "border border-white/20 text-white/45 hover:border-white/70 hover:text-white"
      }`}
    >
      {children}
    </button>
  );
}

export function ProfileForm({ profile, onSave }: ProfileFormProps) {
  const [form, setForm] = useState<Profile>({
    ...profile,
    programs: profile.programs ?? [],
    divisions: profile.divisions ?? [],
    startups: profile.startups ?? [],
    industries: profile.industries ?? [],
    eboard_roles: profile.eboard_roles ?? [],
    notification_industries: profile.notification_industries ?? [],
    linkedin_url: profile.linkedin_url ?? null,
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [startupInput, setStartupInput] = useState("");
  const [industryInput, setIndustryInput] = useState("");
  const [locationQuery, setLocationQuery] = useState(
    profile.city ? `${profile.city}${profile.region ? `, ${profile.region}` : ""}` : ""
  );

  const toggleArray = <T extends string>(key: keyof Profile, value: T) => {
    setForm((prev) => {
      const arr = (prev[key] as T[]) ?? [];
      const next = arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value];
      return { ...prev, [key]: next };
    });
  };

  const geocodeLocation = async () => {
    if (!locationQuery.trim()) return;
    const res = await fetch(`/api/geocode?q=${encodeURIComponent(locationQuery)}`);
    const data = await res.json();
    if (data.result) {
      setForm((prev) => ({
        ...prev,
        city: data.result.city,
        region: data.result.region,
        country: data.result.country,
        lat: data.result.lat,
        lng: data.result.lng,
      }));
    }
  };

  const addStartup = () => {
    if (!startupInput.trim()) return;
    setForm((prev) => ({
      ...prev,
      startups: [...prev.startups, startupInput.trim()],
    }));
    setStartupInput("");
  };

  const addIndustry = () => {
    const value = industryInput.trim();
    if (!value) return;
    setForm((prev) => ({
      ...prev,
      industries: prev.industries.includes(value) ? prev.industries : [...prev.industries, value],
    }));
    setIndustryInput("");
  };

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      await onSave(form);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <h2 className="text-lg font-medium text-white">Basic info</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm text-white/60">Full name</label>
            <Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
          </div>
          <div>
            <label className="mb-1 block text-sm text-white/60">Cohort year</label>
            <Input
              type="number"
              value={form.cohort_year ?? ""}
              onChange={(e) => setForm({ ...form, cohort_year: e.target.value ? parseInt(e.target.value) : null })}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-white/60">Current title</label>
            <Input value={form.current_title ?? ""} onChange={(e) => setForm({ ...form, current_title: e.target.value })} />
          </div>
          <div>
            <label className="mb-1 block text-sm text-white/60">Current company</label>
            <Input value={form.current_company ?? ""} onChange={(e) => setForm({ ...form, current_company: e.target.value })} />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm text-white/60">LinkedIn profile</label>
            <Input
              type="url"
              placeholder="https://www.linkedin.com/in/your-profile"
              value={form.linkedin_url ?? ""}
              onChange={(e) => setForm({ ...form, linkedin_url: e.target.value || null })}
            />
          </div>
        </div>
        <div>
          <label className="mb-1 block text-sm text-white/60">Bio</label>
          <Textarea value={form.bio ?? ""} onChange={(e) => setForm({ ...form, bio: e.target.value })} rows={4} />
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-medium text-white">Programs</h2>
        <div className="flex flex-wrap gap-2">
          {PROGRAMS.map((p) => (
            <Pill key={p} active={form.programs.includes(p)} onClick={() => toggleArray<ProgramAffiliation>("programs", p)}>
              {formatProgram(p)}
            </Pill>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-medium text-white">E-Board Roles</h2>
        <div className="flex flex-wrap gap-2">
          {EBOARD_ROLES.map((role) => (
            <Pill
              key={role}
              active={(form.eboard_roles ?? []).includes(role)}
              onClick={() => toggleArray<EboardRole>("eboard_roles", role)}
            >
              {role}
            </Pill>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-medium text-white">Divisions</h2>
        <div className="flex flex-wrap gap-2">
          {DIVISIONS.map((d) => (
            <Pill key={d} active={form.divisions.includes(d)} onClick={() => toggleArray<Division>("divisions", d)}>
              {d}
            </Pill>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-medium text-white">TL BUILD startups</h2>
        <div className="flex flex-wrap gap-2">
          {form.startups.map((s) => (
            <Badge key={s}>
              {s}
              <button
                type="button"
                className="ml-1 text-white/50 hover:text-white"
                onClick={() => setForm({ ...form, startups: form.startups.filter((x) => x !== s) })}
              >
                ×
              </button>
            </Badge>
          ))}
        </div>
        <div className="flex gap-2">
          <Input
            placeholder="Add startup..."
            value={startupInput}
            onChange={(e) => setStartupInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addStartup())}
          />
          <Button type="button" variant="secondary" onClick={addStartup}>
            Add
          </Button>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-medium text-white">Industries of interest</h2>
        <div className="flex flex-wrap gap-2">
          {INDUSTRY_OPTIONS.map((ind) => (
            <Pill key={ind} active={form.industries.includes(ind)} onClick={() => toggleArray<string>("industries", ind)}>
              {ind}
            </Pill>
          ))}
          {form.industries
            .filter((ind) => !(INDUSTRY_OPTIONS as readonly string[]).includes(ind))
            .map((ind) => (
              <Badge key={ind} variant="accent">
                {ind}
                <button
                  type="button"
                  className="ml-1 text-black/50 hover:text-black"
                  onClick={() => setForm({ ...form, industries: form.industries.filter((x) => x !== ind) })}
                >
                  ×
                </button>
              </Badge>
            ))}
        </div>
        <div className="flex gap-2">
          <Input
            placeholder="Type an industry and press Add"
            value={industryInput}
            onChange={(e) => setIndustryInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addIndustry())}
          />
          <Button type="button" variant="secondary" onClick={addIndustry}>
            Add
          </Button>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-medium text-white">Location</h2>
        <div className="flex gap-2">
          <Input
            placeholder="City, State"
            value={locationQuery}
            onChange={(e) => setLocationQuery(e.target.value)}
          />
          <Button type="button" variant="secondary" onClick={geocodeLocation}>
            Update
          </Button>
        </div>
        {form.lat != null && (
          <p className="text-sm text-white/50">
            {form.city}, {form.region} {form.country} · Pin placed on globe
          </p>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-medium text-white">Notifications</h2>
        <div>
          <label className="mb-1 block text-sm text-white/60">Phone (E.164, e.g. +13105551234)</label>
          <Input value={form.phone ?? ""} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        </div>
        <label className="flex items-center gap-2 text-sm text-white/80">
          <input
            type="checkbox"
            checked={form.sms_opt_in}
            onChange={(e) =>
              setForm({ ...form, sms_opt_in: e.target.checked, notification_industries: form.industries })
            }
            className="rounded border-white/20 accent-[#fe0101]"
          />
          Opt in to event invitations via iMessage/SMS
        </label>
      </section>

      <div className="flex items-center gap-4 border-t border-white/10 pt-6">
        <Button type="button" size="lg" onClick={handleSave} disabled={saving}>
          {saving ? "Saving..." : "Save"}
        </Button>
        {saving && (
          <span className="flex items-center gap-2 text-sm text-white/60">
            <Loader2 className="h-4 w-4 animate-spin" /> Saving...
          </span>
        )}
        {saved && !saving && (
          <span className="flex items-center gap-2 text-sm text-tl-gold">
            <Check className="h-4 w-4" /> Saved
          </span>
        )}
      </div>
    </div>
  );
}
