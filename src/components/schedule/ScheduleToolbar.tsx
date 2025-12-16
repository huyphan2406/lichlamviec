import React, { useEffect, useMemo, useState } from "react";
import { format, parse, isValid } from "date-fns";
import { Search, X } from "lucide-react";
import type { DateRange } from "react-day-picker";
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
  availableDates = [],
}: Props) {
  const [draft, setDraft] = useState(query);
  const [focused, setFocused] = useState(false);
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  useEffect(() => setDraft(query), [query]);

  // Increase debounce delay for mobile to reduce lag
  useEffect(() => {
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    const delay = isMobile ? 500 : 300;
    const t = window.setTimeout(() => onQueryChange(draft), delay);
    return () => window.clearTimeout(t);
  }, [draft, onQueryChange]);

  const safeSessions = useMemo(() => sessionOptions.filter((s) => s && s !== "nan"), [sessionOptions]);
  const safeStaffNames = useMemo(() => uniqueStaffNames.filter((s) => s && s !== "nan"), [uniqueStaffNames]);
  
  // Normalize query for matching (remove accents, lowercase, remove leading numbers_)
  const normalizedQuery = useMemo(() => {
    if (!draft || !draft.trim()) return "";
    const cleaned = cleanStaffName(draft.trim());
    return removeVietnameseTones(cleaned);
  }, [draft]);
  
  // Optimize suggestions calculation - tìm kiếm chính xác theo tên đầy đủ
  const staffSuggestions = useMemo(() => {
    if (!normalizedQuery || normalizedQuery.length < 1) return [];
    
    // Tìm kiếm trong tất cả tên, không giới hạn
    const matches: Array<{ display: string; original: string; normalized: string }> = [];
    
    for (const originalName of safeStaffNames) {
      if (!originalName || originalName === "nan") continue;
      
      // Clean và normalize tên gốc
      const cleaned = cleanStaffName(originalName);
      const normalized = removeVietnameseTones(cleaned);
      
      // Tìm kiếm chính xác: tên phải chứa query (substring match)
      // Ưu tiên tên bắt đầu với query
      if (normalized.includes(normalizedQuery)) {
        const startsWith = normalized.startsWith(normalizedQuery);
        matches.push({
          display: cleaned, // Hiển thị tên đã clean (không có số_)
          original: originalName, // Tên gốc để search
          normalized: normalized,
        });
      }
    }
    
    // Sort by relevance:
    // 1. Tên bắt đầu với query (startsWith) xếp trước
    // 2. Sau đó sort theo độ dài (tên ngắn hơn = chính xác hơn)
    matches.sort((a, b) => {
      const aStarts = a.normalized.startsWith(normalizedQuery);
      const bStarts = b.normalized.startsWith(normalizedQuery);
      
      // Ưu tiên startsWith
      if (aStarts && !bStarts) return -1;
      if (!aStarts && bStarts) return 1;
      
      // Nếu cùng startsWith hoặc cùng không startsWith, sort theo độ dài
      return a.normalized.length - b.normalized.length;
    });
    
    // Giới hạn 8 kết quả
    return matches.slice(0, 8).map(m => ({
      display: m.display,
      original: m.original,
    }));
  }, [normalizedQuery, safeStaffNames]);

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:flex-row sm:items-center sm:justify-between">
      {/* Search - full width on mobile, flex-1 on desktop */}
      <div className="relative flex h-10 w-full items-center sm:flex-1 sm:min-w-0">
        <Search className="pointer-events-none absolute left-3.5 h-4 w-4 text-slate-400" />
        <Input
          ref={inputRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Tìm theo tên, cửa hàng, địa điểm..."
          className="h-10 rounded-xl border-slate-200 bg-white pl-10 pr-11 text-sm shadow-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-slate-700 dark:bg-slate-800"
          onFocus={() => setFocused(true)}
          onBlur={() => {
            // Increase delay for mobile to allow tap events to register
            const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
            const delay = isMobile ? 200 : 120;
            window.setTimeout(() => setFocused(false), delay);
          }}
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
                  onTouchStart={(e) => e.preventDefault()}
                  onClick={() => {
                    // Sử dụng tên gốc (original) để search - đảm bảo match chính xác
                    // Nhưng hiển thị tên đã clean (display) trong input
                    const searchValue = item.original;
                    setDraft(searchValue);
                    onQueryChange(searchValue);
                    setFocused(false);
                    inputRef.current?.blur();
                    try {
                      localStorage.setItem("last_search_query", searchValue);
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

      {/* Right controls - full width on mobile, auto on desktop */}
      <div className="flex w-full flex-col gap-2.5 sm:flex-row sm:items-center sm:w-auto">
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
          <SelectTrigger className="h-10 w-full rounded-xl border-slate-200 bg-white text-sm shadow-none dark:border-slate-700 dark:bg-slate-900 sm:w-[160px]">
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
          <SelectTrigger className="h-10 w-full rounded-xl border-slate-200 bg-white text-sm shadow-none dark:border-slate-700 dark:bg-slate-900 sm:w-[150px]">
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
      </div>
    </div>
  );
}
