export interface SendMessageParams {
  to: string;
  body: string;
  metadata?: Record<string, string>;
}

export interface SendMessageResult {
  success: boolean;
  messageId?: string;
  channel: "imessage" | "sms" | "email";
  error?: string;
}

export interface MessagingProvider {
  name: string;
  send(params: SendMessageParams): Promise<SendMessageResult>;
}

class DemoMessagingProvider implements MessagingProvider {
  name = "demo";

  async send(params: SendMessageParams): Promise<SendMessageResult> {
    console.log(`[DemoMessaging] → ${params.to}: ${params.body.slice(0, 80)}...`);
    return {
      success: true,
      messageId: `demo_${Date.now()}`,
      channel: params.to.startsWith("+1") ? "imessage" : "sms",
    };
  }
}

class SendBlueProvider implements MessagingProvider {
  name = "sendblue";

  async send(params: SendMessageParams): Promise<SendMessageResult> {
    const apiKey = process.env.SENDBLUE_API_KEY;
    const apiSecret = process.env.SENDBLUE_API_SECRET;
    if (!apiKey || !apiSecret) {
      return { success: false, channel: "sms", error: "SendBlue credentials not configured" };
    }

    try {
      const res = await fetch("https://api.sendblue.co/api/send-message", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "sb-api-key-id": apiKey,
          "sb-api-secret-key": apiSecret,
        },
        body: JSON.stringify({ number: params.to, content: params.body }),
      });

      if (!res.ok) {
        const err = await res.text();
        return { success: false, channel: "sms", error: err };
      }

      const data = await res.json();
      return {
        success: true,
        messageId: data.message_handle ?? data.id,
        channel: "imessage",
      };
    } catch (e) {
      return {
        success: false,
        channel: "sms",
        error: e instanceof Error ? e.message : "Send failed",
      };
    }
  }
}

export function getMessagingProvider(): MessagingProvider {
  if (process.env.SENDBLUE_API_KEY && process.env.SENDBLUE_API_SECRET) {
    return new SendBlueProvider();
  }
  return new DemoMessagingProvider();
}

export async function sendBulkMessages(
  recipients: Array<{ phone: string; profileId: string }>,
  body: string
): Promise<Array<{ profileId: string; result: SendMessageResult }>> {
  const provider = getMessagingProvider();
  const results: Array<{ profileId: string; result: SendMessageResult }> = [];

  for (const recipient of recipients) {
    const result = await provider.send({ to: recipient.phone, body });
    results.push({ profileId: recipient.profileId, result });
    await new Promise((r) => setTimeout(r, 100));
  }

  return results;
}

export function formatEventInvitation(
  eventName: string,
  date: string,
  location: string,
  rsvpUrl: string
): string {
  return `You're invited: ${eventName} on ${date} at ${location}. RSVP: ${rsvpUrl}`;
}
