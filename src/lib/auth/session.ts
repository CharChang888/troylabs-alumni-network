import { cookies } from "next/headers";
import { SESSION_COOKIE } from "@/lib/auth/constants";

export async function getSessionUserId(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(SESSION_COOKIE)?.value ?? null;
}

export { SESSION_COOKIE, AUTH_NEXT_COOKIE, safeNextPath } from "@/lib/auth/constants";
