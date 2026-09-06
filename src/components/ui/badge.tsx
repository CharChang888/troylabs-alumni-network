import { cn } from "@/lib/utils";
import { formatProgram } from "@/lib/utils";
import type { ProgramAffiliation } from "@/types";

export function Badge({
  className,
  variant = "default",
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { variant?: "default" | "accent" | "outline" }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wider",
        variant === "default" && "border-white/25 text-white/80",
        variant === "accent" && "border-[#ffc700]/50 text-[#ffc700]",
        variant === "outline" && "border-white/20 text-white/80",
        className
      )}
      {...props}
    />
  );
}

export function ProgramBadge({ program }: { program: ProgramAffiliation }) {
  return <Badge variant="accent">{formatProgram(program)}</Badge>;
}
