import { cn } from "@/lib/utils";
import { InputHTMLAttributes, forwardRef } from "react";

export type InputProps = InputHTMLAttributes<HTMLInputElement>;

const Input = forwardRef<HTMLInputElement, InputProps>(({ className, ...props }, ref) => (
  <input
    className={cn(
      "flex h-10 w-full border border-white/20 bg-transparent px-3 py-2 text-sm text-white placeholder:text-white/35 focus-visible:outline-none focus-visible:border-white disabled:cursor-not-allowed disabled:opacity-50",
      className
    )}
    ref={ref}
    {...props}
  />
));
Input.displayName = "Input";

export { Input };
