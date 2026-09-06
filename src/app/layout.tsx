import type { Metadata } from "next";
import "./globals.css";
import { SpaceBackdrop } from "@/components/space/SpaceBackdrop";

export const metadata: Metadata = {
  title: "TL Alumni Network",
  description: "Discover TL alumni across programs, industries, and the globe.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="relative min-h-screen bg-black font-sans antialiased">
        <SpaceBackdrop />
        <div className="relative z-10">{children}</div>
      </body>
    </html>
  );
}
