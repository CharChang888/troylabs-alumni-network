"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

/**
 * Catches magic-link sessions that land without going through /auth/callback
 * (or where password_set was never stored) and forces /set-password.
 */
export function PasswordSetupGate() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (pathname === "/set-password" || pathname === "/login" || pathname.startsWith("/auth")) {
      return;
    }

    let cancelled = false;
    const run = async () => {
      try {
        const supabase = createClient();
        // Handle older hash-style redirects if present
        if (typeof window !== "undefined" && window.location.hash.includes("access_token")) {
          await supabase.auth.getSession();
        }
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (cancelled || !user) return;
        if (!user.user_metadata?.password_set) {
          const next = encodeURIComponent(pathname || "/home");
          router.replace(`/set-password?next=${next}`);
        }
      } catch {
        /* ignore — demo mode or missing supabase */
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [pathname, router]);

  return null;
}
