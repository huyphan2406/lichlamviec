import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg)] disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-[var(--color-brand)] text-white hover:bg-[var(--color-brand-hover)]",
        secondary: "bg-[var(--color-card)] text-[var(--color-text-primary)] border border-[var(--color-border)] hover:bg-[color-mix(in_srgb,var(--color-card)_80%,var(--color-bg))]",
        ghost: "hover:bg-[color-mix(in_srgb,var(--color-card)_70%,transparent)]",
        destructive: "bg-[var(--color-danger)] text-white hover:bg-[color-mix(in_srgb,var(--color-danger)_85%,black)]",
      },
      size: {
        default: "h-9 px-3",
        sm: "h-8 px-2.5 text-[13px]",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  };

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";


