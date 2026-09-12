"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Logo } from "@/components/layout/Logo";

type AuthTab = "login" | "signup";

export default function LoginPage() {
  const [tab, setTab] = useState<AuthTab>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
    if (searchParams.get("password") === "set") {
      setError("");
      setTab("login");
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const payload: Record<string, string> = {
        email,
        redirect,
        intent: tab === "signup" ? "signup" : "login",
      };
      if (mode === "magic" && tab === "login") {
        payload.password = password;
      }

      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
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

  const sendMagicFallback = async () => {
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, redirect, intent: "magic" }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not send link");
        return;
      }
      setSent(true);
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
          Check {email} for a magic link. After you open it, you&apos;ll set a password so next time you can log in normally.
        </p>
      ) : (
        <div className="mt-12 w-full max-w-sm space-y-6">
          {mode === "magic" && (
            <div className="flex border-b border-white/15">
              {(["login", "signup"] as AuthTab[]).map((id) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => {
                    setTab(id);
                    setError("");
                    setSent(false);
                  }}
                  className={`flex-1 pb-3 text-[11px] uppercase tracking-nav transition ${
                    tab === id ? "border-b border-tl-gold text-tl-gold" : "text-white/40 hover:text-white/70"
                  }`}
                >
                  {id === "login" ? "Log in" : "Sign up"}
                </button>
              ))}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type="email"
              placeholder="you@usc.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="h-12 rounded-none border-x-0 border-t-0 border-b border-white/30 bg-transparent px-0 text-center tracking-wide"
            />
            {mode === "magic" && tab === "login" && (
              <Input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                className="h-12 rounded-none border-x-0 border-t-0 border-b border-white/30 bg-transparent px-0 text-center tracking-wide"
              />
            )}
            {error && <p className="text-center text-sm text-tl-accent">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading} variant="secondary">
              {loading
                ? "Please wait..."
                : mode === "demo"
                  ? "Continue"
                  : tab === "signup"
                    ? "Email me a magic link"
                    : "Log in"}
            </Button>
          </form>

          {mode === "magic" && tab === "login" && (
            <button
              type="button"
              onClick={sendMagicFallback}
              disabled={loading || !email}
              className="w-full text-center text-[11px] uppercase tracking-nav text-white/40 hover:text-white/70 disabled:opacity-40"
            >
              Forgot password? Email a magic link
            </button>
          )}

          {mode === "magic" && tab === "signup" && (
            <p className="text-center text-xs text-white/40">
              New alumni get a one-time magic link, then create a password for future logins.
            </p>
          )}
        </div>
      )}

      {mode === "demo" && !sent && (
        <p className="mt-8 text-center text-[10px] uppercase tracking-nav text-white/30">
          Demo: president@usc.edu
        </p>
      )}
    </div>
  );
}
