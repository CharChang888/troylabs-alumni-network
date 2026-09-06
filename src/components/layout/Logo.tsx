import Image from "next/image";
import { cn } from "@/lib/utils";

export function Logo({
  className,
  size = 36,
}: {
  className?: string;
  size?: number;
}) {
  return (
    <Image
      src="/troylabs-logo.png"
      alt="TroyLabs"
      width={size}
      height={size}
      className={cn("object-contain mix-blend-screen", className)}
      priority
    />
  );
}
