import { cookies } from "next/headers";
import { SESSION_COOKIE } from "@/lib/auth/constants";
import { isAdminEmail } from "@/lib/auth/domain-check";
import { resolveSessionUser } from "@/lib/data";
import type { User } from "@/types";

export async function getCurrentUser(): Promise<User | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value ?? null;
  return resolveSessionUser(token);
}

export function userIsAdmin(user: User | null | undefined): boolean {
  if (!user) return false;
  return user.role === "admin" || isAdminEmail(user.email);
}

export async function requireAdmin(): Promise<User | null> {
  const user = await getCurrentUser();
  if (!userIsAdmin(user)) return null;
  return user ? { ...user, role: "admin" } : null;
}
