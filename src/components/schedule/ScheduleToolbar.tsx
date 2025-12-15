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


