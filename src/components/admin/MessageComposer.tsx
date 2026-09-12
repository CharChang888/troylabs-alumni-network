"use client";

import { useState } from "react";
import type { AudienceFilters, ProgramAffiliation, Division } from "@/types";
import { PROGRAMS, DIVISIONS, INDUSTRY_OPTIONS } from "@/types";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatProgram } from "@/lib/utils";

interface MessageComposerProps {
  onSend: (data: {
    title: string;
    body: string;
    event_name?: string;
    event_date?: string;
    event_location?: string;
    rsvp_url?: string;
    audience_filters: AudienceFilters;
  }) => Promise<{ recipient_count: number }>;
}

export function MessageComposer({ onSend }: MessageComposerProps) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [eventName, setEventName] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventLocation, setEventLocation] = useState("");
  const [rsvpUrl, setRsvpUrl] = useState("");
  const [filters, setFilters] = useState<AudienceFilters>({});
  const [previewCount, setPreviewCount] = useState<number | null>(null);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const toggleFilter = <T extends string>(
    key: keyof AudienceFilters,
    value: T
  ) => {
    const arr = (filters[key] as T[] | undefined) ?? [];
    const next = arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value];
    setFilters({ ...filters, [key]: next.length ? next : undefined });
  };

  const previewAudience = async () => {
    const res = await fetch("/api/messages/preview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ audience_filters: filters }),
    });
    const data = await res.json();
    setPreviewCount(data.count);
  };

  const handleSend = async () => {
    setSending(true);
    setResult(null);
    try {
      const res = await onSend({
        title,
        body,
        event_name: eventName || undefined,
        event_date: eventDate || undefined,
        event_location: eventLocation || undefined,
        rsvp_url: rsvpUrl || undefined,
        audience_filters: filters,
      });
      setResult(`Sent to ${res.recipient_count} alumni`);
    } catch {
      setResult("Failed to send");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Compose message</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="mb-1 block text-sm text-white/60">Campaign title</label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-sm text-white/60">Message body</label>
            <Textarea value={body} onChange={(e) => setBody(e.target.value)} rows={4} />
          </div>
          <div className="border-t border-white/10 pt-4">
            <p className="mb-3 text-sm font-medium text-white/80">Event details (optional)</p>
            <div className="space-y-3">
              <Input placeholder="Event name" value={eventName} onChange={(e) => setEventName(e.target.value)} />
              <Input type="datetime-local" value={eventDate} onChange={(e) => setEventDate(e.target.value)} />
              <Input placeholder="Location or link" value={eventLocation} onChange={(e) => setEventLocation(e.target.value)} />
              <Input placeholder="RSVP URL" value={rsvpUrl} onChange={(e) => setRsvpUrl(e.target.value)} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Audience</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="mb-2 text-sm text-white/60">Programs</p>
            <div className="flex flex-wrap gap-2">
              {PROGRAMS.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => toggleFilter<ProgramAffiliation>("programs", p)}
                  className={`rounded-full px-3 py-1 text-xs ${
                    filters.programs?.includes(p) ? "bg-tl-accent-deep text-white" : "bg-white/10 text-white/60"
                  }`}
                >
                  {formatProgram(p)}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-2 text-sm text-white/60">Divisions</p>
            <div className="flex flex-wrap gap-2">
              {DIVISIONS.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => toggleFilter<Division>("divisions", d)}
                  className={`rounded-full px-3 py-1 text-xs ${
                    filters.divisions?.includes(d) ? "bg-tl-accent-deep text-white" : "bg-white/10 text-white/60"
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-2 text-sm text-white/60">Industries</p>
            <div className="flex flex-wrap gap-2">
              {INDUSTRY_OPTIONS.slice(0, 8).map((ind) => (
                <button
                  key={ind}
                  type="button"
                  onClick={() => toggleFilter<string>("industries", ind)}
                  className={`rounded-full px-3 py-1 text-xs ${
                    filters.industries?.includes(ind) ? "bg-tl-blue text-white" : "bg-white/10 text-white/60"
                  }`}
                >
                  {ind}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={previewAudience}>
              Preview audience
            </Button>
            {previewCount != null && (
              <span className="self-center text-sm text-white/60">{previewCount} recipients</span>
            )}
          </div>
          <Button onClick={handleSend} disabled={sending || !title || !body} className="w-full">
            {sending ? "Sending..." : "Send now"}
          </Button>
          {result && <p className="text-sm text-green-400">{result}</p>}
        </CardContent>
      </Card>
    </div>
  );
}
