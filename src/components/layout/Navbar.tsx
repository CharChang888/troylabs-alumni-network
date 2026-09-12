"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/layout/Logo";

const navItems = [
  { href: "/home", label: "Home" },
  { href: "/globe", label: "Globe" },
  { href: "/profile", label: "Profile" },
];

export function Navbar({ isAdmin }: { isAdmin?: boolean }) {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 bg-transparent">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Link href="/home" className="flex items-center gap-3 text-white">
          <Logo size={40} />
          <span className="text-[11px] font-medium uppercase tracking-nav">TroyLabs</span>
        </Link>

        <nav className="flex items-center gap-8">
          {navItems.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "text-[11px] font-medium uppercase tracking-nav transition-colors",
                pathname.startsWith(href) ? "text-white" : "text-white/45 hover:text-white"
              )}
            >
              {label}
            </Link>
          ))}
          {isAdmin && (
            <Link
              href="/admin"
              className={cn(
                "text-[11px] font-medium uppercase tracking-nav transition-colors",
                pathname.startsWith("/admin") ? "text-tl-gold" : "text-white/45 hover:text-white"
              )}
            >
              Admin
            </Link>
          )}
        </nav>

        <button
          type="button"
          onClick={async () => {
            await fetch("/api/auth/logout", { method: "POST" });
            window.location.href = "/";
          }}
          className="text-[11px] font-medium uppercase tracking-nav text-white/45 hover:text-white"
        >
          Sign out
        </button>
      </div>
    </header>
  );
}
