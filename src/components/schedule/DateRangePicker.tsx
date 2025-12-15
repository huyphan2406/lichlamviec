import React, { useMemo, useState } from "react";
import { addDays, format } from "date-fns";
import type { DateRange } from "react-day-picker";
import { Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

type Props = {
  value: DateRange | undefined;
  onChange: (next: DateRange | undefined) => void;
  className?: string;
};

function fmt(d: Date) {
  // dd/MM like your data, but without year for compact toolbar
  return format(d, "dd/MM");
}

export function DateRangePicker({ value, onChange, className }: Props) {
  const [open, setOpen] = useState(false);

  const label = useMemo(() => {
    if (value?.from && value?.to) return `${fmt(value.from)} - ${fmt(value.to)}`;
    if (value?.from) return `${fmt(value.from)} - ...`;
    return "Chọn ngày";
  }, [value?.from, value?.to]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="secondary"
          className={cn(
            "h-11 justify-start rounded-full border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800",
            className,
          )}
        >
          <CalendarIcon className="h-4 w-4 text-slate-500 dark:text-slate-300" />
          <span className="truncate">{label}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-auto p-0">
        <Calendar
          mode="range"
          selected={value}
          onSelect={(range) => {
            onChange(range);
          }}
          defaultMonth={value?.from ?? new Date()}
          numberOfMonths={2}
        />
        <div className="flex items-center justify-between gap-2 border-t border-[var(--color-border)] p-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onChange(undefined)}
            className="h-9"
          >
            Clear
          </Button>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onChange({ from: new Date(), to: new Date() })}
              className="h-9"
            >
              Hôm nay
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onChange({ from: new Date(), to: addDays(new Date(), 6) })}
              className="h-9"
            >
              7 ngày
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}


