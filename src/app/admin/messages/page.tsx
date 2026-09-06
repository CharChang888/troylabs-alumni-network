"use client";

import { MessageComposer } from "@/components/admin/MessageComposer";

export default function AdminMessagesPage() {
  const handleSend = async (data: Parameters<Parameters<typeof MessageComposer>[0]["onSend"]>[0]) => {
    const res = await fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const result = await res.json();
    return { recipient_count: result.sent ?? result.campaign?.recipient_count ?? 0 };
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Send message blast</h1>
      <p className="text-white/50">
        Compose event invitations or announcements. Messages send via iMessage/SMS to opted-in alumni matching your audience filters.
      </p>
      <MessageComposer onSend={handleSend} />
    </div>
  );
}
