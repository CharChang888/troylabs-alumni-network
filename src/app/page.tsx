import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/layout/Logo";

export default function LandingPage() {
  return (
    <div className="relative min-h-screen">
      <header className="relative z-10 mx-auto flex max-w-6xl items-center px-6 py-8">
        <Logo size={44} />
      </header>

      <main className="relative z-10 flex min-h-[70vh] flex-col items-center justify-center px-6 pb-24 text-center">
        <h1 className="text-[12vw] font-bold leading-none tracking-[0.12em] text-white sm:text-8xl md:text-9xl">
          TROYLABS
        </h1>
        <p className="mt-8 max-w-xl text-sm tracking-wide text-white/80 sm:text-base">
          where Trojan builders launch, scale, and raise capital.
        </p>
        <p className="mt-3 text-[11px] uppercase tracking-nav text-white/40">Alumni Network</p>
        <div className="mt-12">
          <Link href="/login">
            <Button size="lg" variant="secondary">
              Enter the network
            </Button>
          </Link>
        </div>
      </main>
    </div>
  );
}
