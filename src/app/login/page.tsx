"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Logo } from "@/components/layout/Logo";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"demo" | "magic">("demo");
  const [sent, setSent] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") ?? "/home";

  useEffect(() => {
    fetch("/api/auth/login")
      .then((r) => r.json())
      .then((data) => {
        if (data.mode === "magic") setMode("magic");
      })
      .catch(() => undefined);
    if (searchParams.get("error") === "auth") {
      setError("That sign-in link is invalid or expired. Try again.");
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, redirect }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Login failed");
        return;
      }
      if (data.magicLink) {
        setSent(true);
        return;
      }
      router.push(data.profileComplete ? redirect : "/profile");
      router.refresh();
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <Link href="/" className="mb-10 inline-flex">
        <Logo size={56} />
      </Link>
      <h1 className="text-3xl font-bold tracking-[0.28em] text-white">TROYLABS</h1>
      <p className="mt-3 text-[11px] uppercase tracking-nav text-white/50">Alumni Network</p>
      {sent ? (
        <p className="mt-12 max-w-sm text-center text-sm text-white/70">
          Check {email} for a sign-in link. It expires in a few minutes.
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="mt-12 w-full max-w-sm space-y-4">
          <Input
            type="email"
            placeholder="you@usc.edu"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="h-12 rounded-none border-x-0 border-t-0 border-b border-white/30 bg-transparent px-0 text-center tracking-wide"
          />
          {error && <p className="text-center text-sm text-[#fe0101]">{error}</p>}
          <Button type="submit" className="w-full" disabled={loading} variant="secondary">
            {loading ? "Signing in..." : mode === "magic" ? "Email me a link" : "Continue"}
          </Button>
        </form>
      )}
      {mode === "demo" && !sent && (
        <p className="mt-8 text-center text-[10px] uppercase tracking-nav text-white/30">
          Demo: president@usc.edu
        </p>
      )}
    </div>
  );
}
