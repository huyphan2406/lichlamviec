import React, { useEffect, useMemo, useState } from "react";
import { format, parse, isValid } from "date-fns";
import { Download, Search, X } from "lucide-react";
import type { DateRange } from "react-day-picker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { removeVietnameseTones, cleanStaffName } from "@/features/schedule/utils";

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

function fmtRange(range: DateRange | undefined, availableDates: string[]) {
  if (!range?.from) return "Tất cả";
  const from = format(range.from, "dd/MM/yyyy");
  const to = range.to ? format(range.to, "dd/MM/yyyy") : "";
  if (!to || to === from) {
    // Check if this date is in availableDates
    const found = availableDates.find(d => d === from);
    return found || from;
  }
  return `${from} - ${to}`;
}

function getDateValue(range: DateRange | undefined, availableDates: string[]): string {
  if (!range?.from) return ALL;
  const from = format(range.from, "dd/MM/yyyy");
  const to = range.to ? format(range.to, "dd/MM/yyyy") : "";
  if (!to || to === from) {
    return from;
  }
  // For range, we'll use the from date as the key
  return from;
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
  
  // Normalize query for matching (remove accents, lowercase, remove leading numbers_)
  const normalizedQuery = useMemo(() => {
    const cleaned = cleanStaffName(draft);
    return removeVietnameseTones(cleaned);
  }, [draft]);
  
  const staffSuggestions = useMemo(() => {
    if (!normalizedQuery) return [];
    
    // Create map of cleaned name -> original name for display
    const nameMap = new Map<string, string>();
    for (const originalName of safeStaffNames) {
      const cleaned = cleanStaffName(originalName);
      const normalized = removeVietnameseTones(cleaned);
      // Store both cleaned (for display) and original (for search)
      if (!nameMap.has(normalized) || cleaned.length < nameMap.get(normalized)!.length) {
        nameMap.set(normalized, cleaned);
      }
    }
    
    // Find matches
    const matches: Array<{ display: string; original: string }> = [];
    for (const [normalized, display] of nameMap.entries()) {
      if (normalized.includes(normalizedQuery)) {
        // Find original name that matches this cleaned version
        const original = safeStaffNames.find(name => {
          const cleaned = cleanStaffName(name);
          return removeVietnameseTones(cleaned) === normalized;
        });
        if (original) {
          matches.push({ display, original });
        }
      }
      if (matches.length >= 8) break;
    }
    
    // Sort by relevance (exact match first, then by length)
    matches.sort((a, b) => {
      const aStarts = a.display.toLowerCase().startsWith(normalizedQuery);
      const bStarts = b.display.toLowerCase().startsWith(normalizedQuery);
      if (aStarts && !bStarts) return -1;
      if (!aStarts && bStarts) return 1;
      return a.display.length - b.display.length;
    });
    
    return matches.slice(0, 8);
  }, [normalizedQuery, safeStaffNames]);

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
              {staffSuggestions.map((item) => (
                <button
                  key={item.original}
                  type="button"
                  className="flex w-full items-start px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800 transition-colors"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    // Use cleaned name for search (without numbers_)
                    setDraft(item.display);
                    onQueryChange(item.display);
                    setFocused(false);
                    inputRef.current?.blur();
                    try {
                      localStorage.setItem("last_search_query", item.display);
                    } catch {
                      // ignore
                    }
                  }}
                >
                  {item.display}
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </div>

      {/* Right controls */}
      <div className="flex flex-wrap items-center gap-2.5">
        <Select
          value={getDateValue(dateRange, availableDates)}
          onValueChange={(value) => {
            if (value === ALL) {
              onDateRangeChange(undefined);
            } else {
              const parsed = parse(value, "dd/MM/yyyy", new Date());
              if (isValid(parsed)) {
                const date = new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate(), 0, 0, 0, 0);
                const end = new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate(), 23, 59, 59, 999);
                onDateRangeChange({ from: date, to: end });
              }
            }
          }}
        >
          <SelectTrigger className="h-10 w-[160px] rounded-xl border-slate-200 bg-white text-sm shadow-none dark:border-slate-700 dark:bg-slate-900">
            <SelectValue placeholder="Chọn ngày">
              {fmtRange(dateRange, availableDates)}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Tất cả</SelectItem>
            {availableDates.map((dateStr) => (
              <SelectItem key={dateStr} value={dateStr}>
                {dateStr}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

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
