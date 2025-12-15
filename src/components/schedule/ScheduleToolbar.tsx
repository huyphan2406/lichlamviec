import React, { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { Calendar, Download, Search, X } from "lucide-react";
import type { DateRange } from "react-day-picker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar as CalendarView } from "@/components/ui/calendar";

type Props = {
  query: string;
  onQueryChange: (value: string) => void;
  uniqueStaffNames: string[];
  session: string;
  onSessionChange: (value: string) => void;
  sessionOptions: string[];
  dateRange: DateRange | undefined;
  onDateRangeChange: (range: DateRange | undefined) => void;
  onExportIcs: () => void;
};

const ALL = "__ALL__";

function fmtRange(range: DateRange | undefined) {
  if (!range?.from) return "Chọn ngày";
  const from = format(range.from, "dd/MM");
  const to = range.to ? format(range.to, "dd/MM") : "";
  if (!to || to === from) return from;
  return `${from} - ${to}`;
}

export function ScheduleToolbar({
  query,
  onQueryChange,
  uniqueStaffNames,
  session,
  onSessionChange,
  sessionOptions,
  dateRange,
  onDateRangeChange,
  onExportIcs,
}: Props) {
  const [draft, setDraft] = useState(query);
  const [focused, setFocused] = useState(false);
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  useEffect(() => setDraft(query), [query]);

  useEffect(() => {
    const t = window.setTimeout(() => onQueryChange(draft), 300);
    return () => window.clearTimeout(t);
  }, [draft, onQueryChange]);

  const safeSessions = useMemo(() => sessionOptions.filter((s) => s && s !== "nan"), [sessionOptions]);
  const safeStaffNames = useMemo(() => uniqueStaffNames.filter((s) => s && s !== "nan"), [uniqueStaffNames]);
  const staffSuggestions = useMemo(() => {
    const q = draft.trim().toLowerCase();
    if (!q) return [];
    // small, fast list; max 8 suggestions
    const out: string[] = [];
    for (const name of safeStaffNames) {
      if (name.toLowerCase().includes(q)) {
        out.push(name);
        if (out.length >= 8) break;
      }
    }
    return out;
  }, [draft, safeStaffNames]);

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-slate-100 bg-white p-2 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      {/* Search (left / grow) */}
      <div className="relative flex h-9 flex-1 items-center">
        <Search className="pointer-events-none absolute left-3 h-4 w-4 text-slate-400" />
        <Input
          ref={inputRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Tìm theo tên, cửa hàng, địa điểm..."
          className="h-9 rounded-xl border-slate-200 bg-slate-50 pl-9 pr-10 text-sm shadow-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand)] dark:border-slate-700 dark:bg-slate-800"
          onFocus={() => setFocused(true)}
          onBlur={() => window.setTimeout(() => setFocused(false), 120)}
        />
        {draft ? (
          <button
            type="button"
            onClick={() => {
              setDraft("");
              onQueryChange("");
            }}
            className="absolute right-2 inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
            aria-label="Xóa tìm kiếm"
            title="Xóa"
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}

        {/* Suggestions */}
        {focused && staffSuggestions.length ? (
          <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-40 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg dark:border-slate-800 dark:bg-slate-900">
            <div className="px-3 py-2 text-xs font-semibold text-slate-500 dark:text-slate-300">Gợi ý nhân sự</div>
            <div className="max-h-56 overflow-auto">
              {staffSuggestions.map((name) => (
                <button
                  key={name}
                  type="button"
                  className="flex w-full items-start px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    setDraft(name);
                    onQueryChange(name);
                    setFocused(false);
                    inputRef.current?.blur();
                    try {
                      localStorage.setItem("last_search_query", name);
                    } catch {
                      // ignore
                    }
                  }}
                >
                  {name}
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </div>

      {/* Right controls */}
      <div className="flex flex-wrap items-center gap-2">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="secondary"
              className="h-9 gap-2 rounded-xl border-slate-200 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-900"
            >
              <Calendar className="h-4 w-4 text-slate-500" />
              <span className="text-sm">{fmtRange(dateRange)}</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="p-2">
            <CalendarView
              mode="range"
              selected={dateRange}
              onSelect={onDateRangeChange}
              numberOfMonths={2}
            />
            <div className="mt-2 flex justify-end gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => onDateRangeChange(undefined)}
              >
                Xóa
              </Button>
            </div>
          </PopoverContent>
        </Popover>

        <Select value={session || ALL} onValueChange={(v) => onSessionChange(v === ALL ? "" : v)}>
          <SelectTrigger className="h-9 w-[150px] rounded-xl border-slate-200 bg-white text-sm shadow-none dark:border-slate-700 dark:bg-slate-900">
            <SelectValue placeholder="Tất cả ca" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Tất cả ca</SelectItem>
            {safeSessions.map((s) => (
              <SelectItem key={s} value={s || "__UNKNOWN__"}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button variant="secondary" size="icon" className="h-9 w-9 rounded-xl" onClick={onExportIcs} aria-label="Xuất .ics">
          <Download className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
