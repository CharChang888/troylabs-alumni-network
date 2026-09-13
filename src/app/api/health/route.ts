import { NextResponse } from "next/server";
import { hasOpenAIEmbeddings } from "@/lib/embeddings";
import { hasServiceRole, isSupabaseConfigured } from "@/lib/env";
import { isAdminEmail } from "@/lib/auth/domain-check";
import { getCurrentUser } from "@/lib/auth/current-user";

export const dynamic = "force-dynamic";

/** Public readiness check + authenticated identity debug (no secrets). */
export async function GET() {
  const user = await getCurrentUser();
  return NextResponse.json({
    ok: true,
    mode: isSupabaseConfigured() ? "magic" : "demo",
    serviceRoleConfigured: hasServiceRole(),
    openaiConfigured: hasOpenAIEmbeddings(),
    me: user
      ? {
          email: user.email,
          role: user.role,
          allowlistedAdmin: isAdminEmail(user.email),
        }
      : null,
  });
}
