import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-md border border-[var(--color-border)] bg-[color-mix(in_srgb,var(--color-card)_70%,transparent)] px-2 py-0.5 text-[11px] font-medium text-[var(--color-text-primary)]",
  {
    variants: {
      variant: {
        default: "",
        brand: "border-[color-mix(in_srgb,var(--color-brand)_30%,var(--color-border))] text-[var(--color-brand)]",
        danger: "border-[color-mix(in_srgb,var(--color-danger)_30%,var(--color-border))] text-[var(--color-danger)]",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

export type BadgeProps = React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof badgeVariants>;

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}


