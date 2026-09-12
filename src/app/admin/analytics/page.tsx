"use client";

import { useCallback, useEffect, useState } from "react";
import type { AnalyticsSnapshot } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminAnalyticsPage() {
  const [analytics, setAnalytics] = useState<AnalyticsSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);

  const loadAnalytics = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const res = await fetch("/api/analytics", { cache: "no-store" });
      const data = await res.json();
      setAnalytics(data.analytics ?? null);
      setUpdatedAt(new Date());
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadAnalytics(false);
  }, [loadAnalytics]);

  if (loading && !analytics) return <p className="text-white/50">Loading analytics...</p>;
  if (!analytics) return <p className="text-white/50">Could not load analytics.</p>;

  const metrics = [
    { label: "Total users", value: analytics.total_users, target: "—" },
    { label: "Active users (30d)", value: analytics.active_users_30d, target: "40% of members" },
    { label: "Profile completion", value: `${analytics.profile_completion_rate}%`, target: "≥70%" },
    { label: "Searches today", value: analytics.searches_today, target: "—" },
    { label: "Messages sent (30d)", value: analytics.messages_sent_30d, target: "≥95% delivery" },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Analytics</h1>
          {updatedAt && (
            <p className="mt-1 text-xs text-white/40">
              Last updated {updatedAt.toLocaleTimeString()}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={() => loadAnalytics(true)}
          disabled={refreshing}
          className="rounded-lg border border-white/20 px-4 py-2 text-[11px] uppercase tracking-nav text-white/70 transition hover:border-white/40 hover:text-white disabled:opacity-50"
        >
          {refreshing ? "Refreshing…" : "Refresh"}
        </button>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {metrics.map(({ label, value, target }) => (
          <Card key={label}>
            <CardHeader>
              <CardTitle className="text-base">{label}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-white">{value}</p>
              <p className="mt-1 text-xs text-white/40">Target: {target}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
