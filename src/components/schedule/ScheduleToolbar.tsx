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
  const to = range.to ? format(range.to, "dd/MM") : from;
  return `${from} - ${to}`;
}

export function ScheduleToolbar({
  query,
  onQueryChange,
  session,
  onSessionChange,
  sessionOptions,
  dateRange,
  onDateRangeChange,
  onExportIcs,
}: Props) {
  const [draft, setDraft] = useState(query);
  useEffect(() => setDraft(query), [query]);

  useEffect(() => {
    const t = window.setTimeout(() => onQueryChange(draft), 300);
    return () => window.clearTimeout(t);
  }, [draft, onQueryChange]);

  const safeSessions = useMemo(() => sessionOptions.filter((s) => s && s !== "nan"), [sessionOptions]);

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-slate-100 bg-white p-2 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      {/* Search (left / grow) */}
      <div className="relative flex h-11 flex-1 items-center">
        <Search className="pointer-events-none absolute left-3 h-4 w-4 text-slate-400" />
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Tìm theo tên, cửa hàng, địa điểm..."
          className="h-11 rounded-xl border-slate-200 bg-slate-50 pl-9 pr-10 text-sm shadow-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand)] dark:border-slate-700 dark:bg-slate-800"
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
      </div>

      {/* Right controls */}
      <div className="flex flex-wrap items-center gap-2">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="secondary" className="h-11 gap-2 rounded-xl border-slate-200 bg-white px-3 dark:border-slate-700 dark:bg-slate-900">
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
          <SelectTrigger className="h-11 w-[150px] rounded-xl border-slate-200 bg-white text-sm shadow-none dark:border-slate-700 dark:bg-slate-900">
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

        <Button variant="secondary" size="icon" className="h-11 w-11 rounded-xl" onClick={onExportIcs} aria-label="Xuất .ics">
          <Download className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

import React, { useEffect, useMemo, useState } from "react";
import type { DateRange } from "react-day-picker";
import { Download, Filter, MapPin, Search, SlidersHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { DateRangePicker } from "@/components/schedule/DateRangePicker";
import { cn } from "@/lib/utils";

export type ToolbarFilters = {
  query: string;
  store: string;
  session: string;
  status: "ALL" | "ACTIVE" | "INACTIVE";
  dateRange?: DateRange;
};

type Props = {
  filters: ToolbarFilters;
  onChange: (next: ToolbarFilters) => void;
  stores: string[];
  sessions: string[];
  onExportICS: () => void;
  className?: string;
};

export function ScheduleToolbar({ filters, onChange, stores, sessions, onExportICS, className }: Props) {
  const ALL = "__ALL__";
  const safeStores = useMemo(() => stores.filter((s) => s && s !== "nan"), [stores]);
  const safeSessions = useMemo(() => sessions.filter((s) => s && s !== "nan"), [sessions]);

  // Debounced search (300ms) with instant clear.
  const [q, setQ] = useState(filters.query);
  useEffect(() => setQ(filters.query), [filters.query]);
  useEffect(() => {
    const t = window.setTimeout(() => {
      if (q !== filters.query) onChange({ ...filters, query: q });
    }, 300);
    return () => window.clearTimeout(t);
  }, [q, filters, onChange]);

  const statusLabel =
    filters.status === "ACTIVE" ? "Đang diễn ra" : filters.status === "INACTIVE" ? "Không active" : "Trạng thái";

  const SearchBox = (
    <div className={cn("relative flex-1", className)}>
      <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      <Input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Tìm theo job, nhân sự, địa điểm..."
        className="h-11 rounded-full border-slate-200 bg-white pl-11 pr-10 shadow-sm placeholder:text-slate-400 focus-visible:ring-indigo-500 dark:border-slate-800 dark:bg-slate-900"
        inputMode="search"
      />
      {q ? (
        <button
          type="button"
          onClick={() => {
            setQ("");
            onChange({ ...filters, query: "" });
          }}
          className="absolute right-3 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
          aria-label="Clear search"
        >
          <X className="h-4 w-4" />
        </button>
      ) : null}
    </div>
  );

  const DesktopControls = (
    <div className="hidden items-center justify-between gap-3 sm:flex">
      {SearchBox}
      <div className="flex shrink-0 items-center gap-2">
        <DateRangePicker value={filters.dateRange} onChange={(r) => onChange({ ...filters, dateRange: r })} />

        <Select
          value={filters.store || ALL}
          onValueChange={(v) => onChange({ ...filters, store: v === ALL ? "" : v })}
        >
          <SelectTrigger className="h-11 w-[180px] rounded-full border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <MapPin className="h-4 w-4 text-slate-500" />
            <SelectValue placeholder="Khu vực / Store" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Tất cả</SelectItem>
            {safeStores.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filters.session || ALL} onValueChange={(v) => onChange({ ...filters, session: v === ALL ? "" : v })}>
          <SelectTrigger className="h-11 w-[160px] rounded-full border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <SelectValue placeholder="Ca làm việc" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Tất cả</SelectItem>
            {safeSessions.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filters.status} onValueChange={(v) => onChange({ ...filters, status: v as ToolbarFilters["status"] })}>
          <SelectTrigger className="h-11 w-[160px] rounded-full border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <SelectValue placeholder={statusLabel} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Tất cả</SelectItem>
            <SelectItem value="ACTIVE">Đang diễn ra</SelectItem>
            <SelectItem value="INACTIVE">Không active</SelectItem>
          </SelectContent>
        </Select>

        <Button variant="secondary" size="icon" className="h-11 w-11 rounded-full" onClick={onExportICS} aria-label="Xuất lịch">
          <Download className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );

  const MobileControls = (
    <div className="grid gap-2 sm:hidden">
      {SearchBox}
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="secondary" className="h-11 w-full rounded-full">
            <SlidersHorizontal className="h-4 w-4" />
            Bộ lọc
          </Button>
        </SheetTrigger>
        <SheetContent side="bottom" className="rounded-t-2xl">
          <SheetHeader>
            <SheetTitle>Lọc & tìm</SheetTitle>
            <SheetDescription>Gọn gàng, nhanh, đủ mọi thứ cần thiết.</SheetDescription>
          </SheetHeader>

          <div className="mt-4 grid gap-4">
            <div className="grid gap-1.5">
              <Label>Ngày</Label>
              <DateRangePicker value={filters.dateRange} onChange={(r) => onChange({ ...filters, dateRange: r })} className="w-full" />
            </div>

            <div className="grid gap-1.5">
              <Label>Khu vực / Store</Label>
              <Select value={filters.store || ALL} onValueChange={(v) => onChange({ ...filters, store: v === ALL ? "" : v })}>
                <SelectTrigger className="h-11 rounded-xl">
                  <SelectValue placeholder="Tất cả" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>Tất cả</SelectItem>
                  {safeStores.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-1.5">
              <Label>Ca làm việc</Label>
              <Select value={filters.session || ALL} onValueChange={(v) => onChange({ ...filters, session: v === ALL ? "" : v })}>
                <SelectTrigger className="h-11 rounded-xl">
                  <SelectValue placeholder="Tất cả" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>Tất cả</SelectItem>
                  {safeSessions.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-1.5">
              <Label>Trạng thái</Label>
              <Select value={filters.status} onValueChange={(v) => onChange({ ...filters, status: v as ToolbarFilters["status"] })}>
                <SelectTrigger className="h-11 rounded-xl">
                  <SelectValue placeholder="Tất cả" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Tất cả</SelectItem>
                  <SelectItem value="ACTIVE">Đang diễn ra</SelectItem>
                  <SelectItem value="INACTIVE">Không active</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Button variant="secondary" className="h-11 rounded-xl" onClick={onExportICS}>
                <Download className="h-4 w-4" />
                Xuất .ics
              </Button>
              <Button
                variant="secondary"
                className="h-11 rounded-xl"
                onClick={() => onChange({ query: "", store: "", session: "", status: "ALL", dateRange: undefined })}
              >
                <Filter className="h-4 w-4" />
                Reset bộ lọc
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );

  return (
    <div className={cn("w-full", className)}>
      {DesktopControls}
      {MobileControls}
    </div>
  );
}


