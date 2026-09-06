"use client";

import { useEffect, useState } from "react";
import type { AnalyticsSnapshot } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminAnalyticsPage() {
  const [analytics, setAnalytics] = useState<AnalyticsSnapshot | null>(null);

  useEffect(() => {
    fetch("/api/analytics")
      .then((r) => r.json())
      .then((data) => setAnalytics(data.analytics));
  }, []);

  if (!analytics) return <p className="text-white/50">Loading analytics...</p>;

  const metrics = [
    { label: "Total users", value: analytics.total_users, target: "—" },
    { label: "Active users (30d)", value: analytics.active_users_30d, target: "40% of members" },
    { label: "Profile completion", value: `${analytics.profile_completion_rate}%`, target: "≥70%" },
    { label: "Searches today", value: analytics.searches_today, target: "—" },
    { label: "Messages sent (30d)", value: analytics.messages_sent_30d, target: "≥95% delivery" },
  ];

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-white">Analytics</h1>
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
