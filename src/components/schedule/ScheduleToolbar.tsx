import React, { useEffect, useMemo, useState } from "react";
import { format, parse, isValid } from "date-fns";
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
  availableDates?: string[]; // Dates from schedule data in format "dd/MM/yyyy"
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
  availableDates = [],
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
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      {/* Search (left / grow) */}
      <div className="relative flex h-10 flex-1 min-w-0 items-center">
        <Search className="pointer-events-none absolute left-3.5 h-4 w-4 text-slate-400" />
        <Input
          ref={inputRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Tìm theo tên, cửa hàng, địa điểm..."
          className="h-10 rounded-xl border-slate-200 bg-slate-50 pl-10 pr-11 text-sm shadow-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-slate-700 dark:bg-slate-800"
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
            className="absolute right-2.5 inline-flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 transition-colors"
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
      <div className="flex flex-wrap items-center gap-2.5">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="secondary"
              className="h-10 gap-2 rounded-xl border-slate-200 bg-white px-3.5 text-sm dark:border-slate-700 dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              <Calendar className="h-4 w-4 text-slate-500" />
              <span className="text-sm">{fmtRange(dateRange)}</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-auto p-2">
            <div className="space-y-1">
              <div className="px-2 py-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400">Chọn nhanh</div>
              <button
                type="button"
                onClick={() => {
                  const today = new Date();
                  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0, 0);
                  const end = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);
                  onDateRangeChange({ from: start, to: end });
                }}
                className="flex w-full items-center rounded-md px-2 py-1.5 text-left text-sm text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                Hôm nay
              </button>
              <button
                type="button"
                onClick={() => {
                  const today = new Date();
                  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0, 0);
                  const end = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 6, 23, 59, 59, 999);
                  onDateRangeChange({ from: start, to: end });
                }}
                className="flex w-full items-center rounded-md px-2 py-1.5 text-left text-sm text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                Tuần này
              </button>
              <button
                type="button"
                onClick={() => {
                  const today = new Date();
                  const start = new Date(today.getFullYear(), today.getMonth(), 1, 0, 0, 0, 0);
                  const end = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999);
                  onDateRangeChange({ from: start, to: end });
                }}
                className="flex w-full items-center rounded-md px-2 py-1.5 text-left text-sm text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                Tháng này
              </button>
              <button
                type="button"
                onClick={() => onDateRangeChange(undefined)}
                className="flex w-full items-center rounded-md px-2 py-1.5 text-left text-sm text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                Tất cả
              </button>
              {availableDates.length > 0 && (
                <>
                  <div className="border-t border-slate-200 pt-1 dark:border-slate-700">
                    <div className="px-2 py-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400">Ngày có lịch</div>
                    <div className="max-h-48 overflow-auto">
                      {availableDates.map((dateStr) => {
                        const parsed = parse(dateStr, "dd/MM/yyyy", new Date());
                        if (!isValid(parsed)) return null;
                        const date = new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate(), 0, 0, 0, 0);
                        const end = new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate(), 23, 59, 59, 999);
                        return (
                          <button
                            key={dateStr}
                            type="button"
                            onClick={() => onDateRangeChange({ from: date, to: end })}
                            className="flex w-full items-center rounded-md px-2 py-1.5 text-left text-sm text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                          >
                            {dateStr}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
              <div className="border-t border-slate-200 pt-1 dark:border-slate-700">
                <div className="px-2 py-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400">Chọn tùy chỉnh</div>
                <CalendarView
                  mode="range"
                  selected={dateRange}
                  onSelect={onDateRangeChange}
                  numberOfMonths={2}
                />
              </div>
            </div>
          </PopoverContent>
        </Popover>

        <Select value={session || ALL} onValueChange={(v) => onSessionChange(v === ALL ? "" : v)}>
          <SelectTrigger className="h-10 w-[150px] rounded-xl border-slate-200 bg-white text-sm shadow-none dark:border-slate-700 dark:bg-slate-900">
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

        <Button variant="secondary" size="icon" className="h-10 w-10 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800" onClick={onExportIcs} aria-label="Xuất .ics">
          <Download className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
