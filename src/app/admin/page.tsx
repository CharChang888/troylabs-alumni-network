import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ensureSeedData, getAnalytics, getCampaigns, getAllowedDomains } from "@/lib/data";

export default async function AdminPage() {
  await ensureSeedData();

  const analytics = await getAnalytics();
  const campaigns = await getCampaigns();
  const domains = await getAllowedDomains();

  return (
    <div className="space-y-8">
        <h1 className="text-2xl font-bold text-white">Admin dashboard</h1>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Total users", value: analytics.total_users },
            { label: "Active (30d)", value: analytics.active_users_30d },
            { label: "Profile completion", value: `${analytics.profile_completion_rate}%` },
            { label: "Messages sent (30d)", value: analytics.messages_sent_30d },
          ].map(({ label, value }) => (
            <Card key={label}>
              <CardContent className="p-4">
                <p className="text-sm text-white/50">{label}</p>
                <p className="text-2xl font-bold text-white">{value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Quick links</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link href="/admin/messages" className="block text-tl-accent-light hover:underline">Message composer</Link>
              <Link href="/admin/users" className="block text-tl-accent-light hover:underline">User management</Link>
              <Link href="/admin/analytics" className="block text-tl-accent-light hover:underline">Analytics</Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Allowed domains ({domains.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1 text-sm text-white/70">
                {domains.map((d) => (
                  <li key={d.id}>{d.domain}</li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent campaigns</CardTitle>
            </CardHeader>
            <CardContent>
              {campaigns.length === 0 ? (
                <p className="text-sm text-white/50">No campaigns yet.</p>
              ) : (
                <ul className="space-y-2 text-sm">
                  {campaigns.slice(-5).reverse().map((c) => (
                    <li key={c.id} className="text-white/70">
                      {c.title} · {c.recipient_count} sent
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
    </div>
  );
}
