import { cookies } from "next/headers";
import { ensureSeedData, resolveSessionUser } from "@/lib/data";
import { Navbar } from "@/components/layout/Navbar";
import { PasswordSetupGate } from "@/components/auth/PasswordSetupGate";
import { SESSION_COOKIE } from "@/lib/auth/session";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  await ensureSeedData();
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const currentUser = await resolveSessionUser(token);
  const isAdmin = currentUser?.role === "admin";

  return (
    <div className="min-h-screen">
      <PasswordSetupGate />
      <Navbar isAdmin={isAdmin} />
      <main className="mx-auto max-w-7xl px-4 py-10">{children}</main>
    </div>
  );
}
