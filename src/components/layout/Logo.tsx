import Image from "next/image";
import { cn } from "@/lib/utils";

/** Intrinsic logo aspect (width / height) from public/troylabs-logo.png */
const LOGO_ASPECT = 687 / 1038;

export function Logo({
  className,
  size = 36,
}: {
  className?: string;
  size?: number;
}) {
  const height = size;
  const width = Math.max(1, Math.round(size * LOGO_ASPECT));

  return (
    <Image
      src="/troylabs-logo.png"
      alt="TroyLabs"
      width={width}
      height={height}
      className={cn("bg-transparent object-contain", className)}
      style={{ backgroundColor: "transparent" }}
      unoptimized
      priority
    />
  );
}
