import { Suspense } from "react";

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center text-white/50">Loading...</div>}>
      {children}
    </Suspense>
  );
}
