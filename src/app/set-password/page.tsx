"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Logo } from "@/components/layout/Logo";

function SetPasswordForm() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/home";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password, next }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not save password");
        return;
      }
      router.push(data.redirectTo ?? "/profile");
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
      <h1 className="text-2xl font-bold tracking-[0.18em] text-white">CREATE YOUR PASSWORD</h1>
      <p className="mt-3 max-w-sm text-center text-sm text-white/50">
        Your account is verified. Set a password so you can log in next time without a magic link.
      </p>
      <form onSubmit={handleSubmit} className="mt-10 w-full max-w-sm space-y-4">
        <Input
          type="password"
          placeholder="Password (min 8 characters)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={8}
          className="h-12 rounded-none border-x-0 border-t-0 border-b border-white/30 bg-transparent px-0 text-center tracking-wide"
        />
        <Input
          type="password"
          placeholder="Confirm password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          required
          minLength={8}
          className="h-12 rounded-none border-x-0 border-t-0 border-b border-white/30 bg-transparent px-0 text-center tracking-wide"
        />
        {error && <p className="text-center text-sm text-tl-accent">{error}</p>}
        <Button type="submit" className="w-full" disabled={loading} variant="secondary">
          {loading ? "Saving..." : "Save password & continue"}
        </Button>
      </form>
    </div>
  );
}

export default function SetPasswordPage() {
  return (
    <Suspense fallback={<p className="p-8 text-center text-white/50">Loading...</p>}>
      <SetPasswordForm />
    </Suspense>
  );
}
