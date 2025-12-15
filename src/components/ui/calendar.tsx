import * as React from "react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

// Note: We keep this minimal and tailwind-driven; react-day-picker ships base CSS.
// We override the core pieces via classNames.

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

export function Calendar({ className, classNames, showOutsideDays = true, ...props }: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-2", className)}
      classNames={{
        months: "flex flex-col gap-4 sm:flex-row sm:gap-6",
        month: "space-y-3",
        caption: "flex items-center justify-between px-1",
        caption_label: "text-sm font-semibold",
        nav: "flex items-center gap-1",
        nav_button: cn(buttonVariants({ variant: "ghost", size: "icon" }), "h-7 w-7 border border-transparent"),
        nav_button_previous: "",
        nav_button_next: "",
        table: "w-full border-collapse space-y-1",
        head_row: "flex",
        head_cell: "w-9 text-[11px] font-medium text-[var(--color-text-secondary)]",
        row: "mt-2 flex w-full",
        cell: "relative h-9 w-9 text-center text-sm p-0 [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-range-start)]:rounded-l-md",
        day: cn(
          buttonVariants({ variant: "ghost", size: "icon" }),
          "h-9 w-9 rounded-md p-0 font-normal aria-selected:opacity-100",
        ),
        day_range_start: "day-range-start bg-[var(--color-brand)] text-white hover:bg-[var(--color-brand-hover)]",
        day_range_end: "day-range-end bg-[var(--color-brand)] text-white hover:bg-[var(--color-brand-hover)]",
        day_range_middle: "day-range-middle bg-[color-mix(in_srgb,var(--color-brand)_15%,transparent)] text-[var(--color-text-primary)]",
        day_selected: "bg-[var(--color-brand)] text-white hover:bg-[var(--color-brand-hover)]",
        day_today: "border border-[color-mix(in_srgb,var(--color-brand)_35%,var(--color-border))]",
        day_outside: "text-[var(--color-text-secondary)] opacity-50",
        day_disabled: "text-[var(--color-text-secondary)] opacity-40",
        day_hidden: "invisible",
        ...classNames,
      }}
      {...props}
    />
  );
}


