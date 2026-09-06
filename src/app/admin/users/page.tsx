"use client";

import { useEffect, useState } from "react";
import type { AlumniInvite, Profile, User } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [invites, setInvites] = useState<AlumniInvite[]>([]);
  const [newDomain, setNewDomain] = useState("");

  const loadRoster = () => {
    fetch("/api/users")
      .then((r) => r.json())
      .then((data) => {
        setUsers(data.users ?? []);
        setProfiles(data.profiles ?? []);
        setInvites(data.invites ?? []);
      });
  };

  useEffect(() => {
    loadRoster();
  }, []);

  const addDomain = async () => {
    await fetch("/api/analytics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "add_domain", domain: newDomain }),
    });
    setNewDomain("");
    alert("Domain added");
  };

  const signedInEmails = new Set(profiles.map((p) => p.email.toLowerCase()));
  const pending = invites.filter((invite) => !signedInEmails.has(invite.email.toLowerCase()));

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-white">User management</h1>

      <Card>
        <CardContent className="p-4">
          <h2 className="mb-3 font-semibold text-white">Add allowed domain</h2>
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
              className="rounded-lg bg-tl-accent px-4 text-sm text-white"
            >
              Add
            </button>
          </div>
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
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
