import Link from "next/link";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { SESSION_COOKIE } from "@/lib/auth/session";
import { ensureSeedData, resolveSessionUser } from "@/lib/data";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await ensureSeedData();
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const currentUser = await resolveSessionUser(token);

  if (!currentUser) {
    redirect("/login?redirect=/admin");
  }
  if (currentUser.role !== "admin") {
    redirect("/home");
  }

  return (
    <div className="min-h-screen">
      <div className="px-4 py-5">
        <div className="mx-auto flex max-w-7xl items-center gap-8">
          <Link href="/admin" className="text-[11px] uppercase tracking-nav text-white">Admin</Link>
          <Link href="/admin/messages" className="text-[11px] uppercase tracking-nav text-white/45 hover:text-white">Messages</Link>
          <Link href="/admin/users" className="text-[11px] uppercase tracking-nav text-white/45 hover:text-white">Users</Link>
          <Link href="/admin/analytics" className="text-[11px] uppercase tracking-nav text-white/45 hover:text-white">Analytics</Link>
          <Link href="/home" className="ml-auto text-[11px] uppercase tracking-nav text-white/35 hover:text-white">Back</Link>
        </div>
      </div>
      <main className="mx-auto max-w-7xl px-4 py-6">{children}</main>
    </div>
  );
}
