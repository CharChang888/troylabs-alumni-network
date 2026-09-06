import { cookies } from "next/headers";
import { SESSION_COOKIE } from "@/lib/auth/constants";
import { resolveSessionUser } from "@/lib/data";
import type { User } from "@/types";

export async function getCurrentUser(): Promise<User | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value ?? null;
  return resolveSessionUser(token);
}

export async function requireAdmin(): Promise<User | null> {
  const user = await getCurrentUser();
  if (user?.role !== "admin") return null;
  return user;
}
