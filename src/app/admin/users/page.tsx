"use client";

import { useEffect, useState } from "react";
import type { AllowedDomain, AlumniInvite, Profile, User } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [invites, setInvites] = useState<AlumniInvite[]>([]);
  const [domains, setDomains] = useState<AllowedDomain[]>([]);
  const [newDomain, setNewDomain] = useState("");
  const [busy, setBusy] = useState<string | null>(null);

  const loadRoster = () => {
    Promise.all([
      fetch("/api/users").then((r) => r.json()),
      fetch("/api/analytics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "list_domains" }),
      }).then((r) => r.json()),
    ]).then(([roster, domainData]) => {
      setUsers(roster.users ?? []);
      setProfiles(roster.profiles ?? []);
      setInvites(roster.invites ?? []);
      setDomains(domainData.domains ?? []);
    });
  };

  useEffect(() => {
    loadRoster();
  }, []);

  const addDomain = async () => {
    if (!newDomain.trim()) return;
    setBusy("add-domain");
    await fetch("/api/analytics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "add_domain", domain: newDomain.trim() }),
    });
    setNewDomain("");
    setBusy(null);
    loadRoster();
  };

  const removeDomain = async (domain: string) => {
    if (!confirm(`Remove allowed domain “${domain}”?`)) return;
    setBusy(`domain:${domain}`);
    await fetch("/api/analytics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "remove_domain", domain }),
    });
    setBusy(null);
    loadRoster();
  };

  const removeUser = async (email: string) => {
    if (!confirm(`Remove ${email} from the alumni network?`)) return;
    setBusy(`user:${email}`);
    const res = await fetch("/api/analytics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "remove_user", email }),
    });
    const data = await res.json();
    setBusy(null);
    if (!res.ok) {
      alert(data.error ?? "Could not remove user");
      return;
    }
    loadRoster();
  };

  const signedInEmails = new Set(profiles.map((p) => p.email.toLowerCase()));
  const pending = invites.filter((invite) => !signedInEmails.has(invite.email.toLowerCase()));

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-white">User management</h1>

      <Card>
        <CardContent className="space-y-4 p-4">
          <h2 className="font-semibold text-white">Allowed email domains</h2>
          <div className="flex gap-2">
            <input
              className="flex h-10 flex-1 rounded-lg border border-white/15 bg-white/5 px-3 text-white"
              placeholder="example.com"
              value={newDomain}
              onChange={(e) => setNewDomain(e.target.value)}
            />
            <button
              type="button"
              onClick={addDomain}
              disabled={busy === "add-domain"}
              className="rounded-lg bg-tl-accent-deep px-4 text-sm text-white disabled:opacity-50"
            >
              Add
            </button>
          </div>
          <ul className="space-y-2">
            {domains.map((d) => (
              <li
                key={d.id}
                className="flex items-center justify-between border border-white/10 px-3 py-2 text-sm text-white/80"
              >
                <span>{d.domain}</span>
                <button
                  type="button"
                  onClick={() => removeDomain(d.domain)}
                  disabled={busy === `domain:${d.domain}`}
                  className="text-[11px] uppercase tracking-nav text-white/40 hover:text-[#e23a1f] disabled:opacity-50"
                >
                  Delete
                </button>
              </li>
            ))}
            {domains.length === 0 && (
              <li className="text-sm text-white/40">No domains loaded yet.</li>
            )}
          </ul>
        </CardContent>
      </Card>

      {pending.length > 0 && (
        <div>
          <h2 className="mb-3 text-lg font-semibold text-white">Pending invites ({pending.length})</h2>
          <ul className="space-y-1 text-sm text-white/70">
            {pending.map((invite) => (
              <li key={invite.email}>
                {invite.full_name || "Unnamed"} · {invite.email} · {invite.role}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-white/10">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 text-left text-white/50">
              <th className="p-3">Name</th>
              <th className="p-3">Email</th>
              <th className="p-3">Role</th>
              <th className="p-3">Programs</th>
              <th className="p-3">Complete</th>
              <th className="p-3"> </th>
            </tr>
          </thead>
          <tbody>
            {profiles.map((p) => {
              const user = users.find((u) => u.id === p.user_id);
              return (
                <tr key={p.id} className="border-b border-white/5 text-white/80">
                  <td className="p-3">{p.full_name}</td>
                  <td className="p-3">{p.email}</td>
                  <td className="p-3"><Badge>{user?.role ?? "member"}</Badge></td>
                  <td className="p-3">{p.programs.join(", ")}</td>
                  <td className="p-3">{p.profile_complete ? "✓" : "—"}</td>
                  <td className="p-3 text-right">
                    <button
                      type="button"
                      onClick={() => removeUser(p.email)}
                      disabled={busy === `user:${p.email}`}
                      className="text-[11px] uppercase tracking-nav text-white/35 hover:text-[#e23a1f] disabled:opacity-50"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
