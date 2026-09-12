"use client";

import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes, forwardRef } from "react";

const buttonVariants = cva(
  "inline-flex items-center justify-center text-[11px] font-medium uppercase tracking-nav transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-gradient-to-b from-[#c9a84c] to-[#e23a1f] text-black hover:opacity-90",
        secondary: "border border-white/40 bg-transparent text-white hover:border-white hover:bg-white/5",
        outline: "border border-white/40 bg-transparent text-white hover:border-white",
        ghost: "text-white/70 hover:text-white",
        destructive: "border border-[#e23a1f]/70 text-[#e23a1f] hover:bg-[#e23a1f]/10",
      },
      size: {
        default: "h-10 px-5",
        sm: "h-8 px-3",
        lg: "h-12 px-8 text-xs",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  }
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
  )
);
Button.displayName = "Button";

export { Button, buttonVariants };
