import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useWindowVirtualizer } from "@tanstack/react-virtual";
import { Download, Filter, Search } from "lucide-react";
import { toast } from "sonner";
import type { EventAttributes } from "ics";
import { useGroupsData, useScheduleData } from "@/features/schedule/api";
import type { Job, ScheduleFilters } from "@/features/schedule/types";
import {
  createGroupIndex,
  createHostNameIndex,
  findGroupLinkWithIndex,
  findHostGroupFromNamesIndex,
} from "@/features/schedule/groupMatching";
import { useScheduleFilters } from "@/features/schedule/useScheduleFilters";
import { combineLocation, combineNames, getTodayDDMMYYYY, isJobActive } from "@/features/schedule/utils";
import { QuickReportDialog } from "@/components/schedule/QuickReportDialog";
import { JobCard } from "@/components/schedule/JobCard";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

function useGridLanes() {
  const [lanes, setLanes] = useState(1);
  useEffect(() => {
    const md = window.matchMedia("(min-width: 640px)");
    const lg = window.matchMedia("(min-width: 1024px)");
    const update = () => setLanes(lg.matches ? 3 : md.matches ? 2 : 1);
    update();
    md.addEventListener("change", update);
    lg.addEventListener("change", update);
    return () => {
      md.removeEventListener("change", update);
      lg.removeEventListener("change", update);
    };
  }, []);
  return lanes;
}

function FiltersForm({
  filters,
  setFilters,
  dates,
  sessions,
  stores,
}: {
  filters: ScheduleFilters;
  setFilters: React.Dispatch<React.SetStateAction<ScheduleFilters>>;
  dates: string[];
  sessions: string[];
  stores: string[];
}) {
  const ALL = "__ALL__";
  const safeDates = useMemo(() => dates.filter((d) => d && d !== "nan"), [dates]);
  const safeSessions = useMemo(() => sessions.filter((s) => s && s !== "nan"), [sessions]);
  const safeStores = useMemo(() => stores.filter((s) => s && s !== "nan"), [stores]);

  return (
    <div className="grid gap-3">
      <div className="grid gap-1.5">
        <Label htmlFor="q">Tìm kiếm</Label>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-secondary)]" />
          <Input
            id="q"
            value={filters.query}
            onChange={(e) => setFilters((p) => ({ ...p, query: e.target.value }))}
            className="pl-9"
            placeholder="Tên, store, địa điểm..."
            inputMode="search"
          />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="grid gap-1.5">
          <Label>Ngày</Label>
          <Select
            value={filters.date || ALL}
            onValueChange={(v) => setFilters((p) => ({ ...p, date: v === ALL ? "" : v }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Tất cả" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Tất cả</SelectItem>
              {safeDates.map((d) => (
                <SelectItem key={d} value={d}>
                  {d}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-1.5">
          <Label>Loại ca</Label>
          <Select
            value={filters.session || ALL}
            onValueChange={(v) => setFilters((p) => ({ ...p, session: v === ALL ? "" : v }))}
          >
            <SelectTrigger>
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
          <Label>Store</Label>
          <Select
            value={filters.store || ALL}
            onValueChange={(v) => setFilters((p) => ({ ...p, store: v === ALL ? "" : v }))}
          >
            <SelectTrigger>
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
      </div>
    </div>
  );
}

export function SchedulePage() {
  const schedule = useScheduleData();
  const groups = useGroupsData();

  const jobs = schedule.data?.jobs ?? [];
  const dates = schedule.data?.dates ?? [];
  const sessions = schedule.data?.sessions ?? [];
  const stores = schedule.data?.stores ?? [];

  const [filters, setFilters] = useState<ScheduleFilters>(() => ({
    date: getTodayDDMMYYYY(),
    session: "",
    store: "",
    query: "",
  }));

  const { filteredJobs } = useScheduleFilters(jobs, filters);

  const lanes = useGridLanes();
  const jobItems = useMemo(() => {
    const hostGroups = groups.data?.hostGroups;
    const brandGroups = groups.data?.brandGroups;
    const brandIndex = createGroupIndex(brandGroups);
    const hostIndex = createGroupIndex(hostGroups);
    const hostNameIndex = createHostNameIndex(hostGroups);

    return filteredJobs.map((job) => {
      const brandGroup = findGroupLinkWithIndex(job, brandIndex, "brand");
      const directHostGroup = findGroupLinkWithIndex(job, hostIndex, "host");
      const talentDisplay = combineNames(job["Talent 1"], job["Talent 2"]);
      const coordDisplay = combineNames(job["Coordinator 1"], job["Coordinator 2"]);
      const hostGroup =
        directHostGroup || findHostGroupFromNamesIndex(hostNameIndex, { talentDisplay, coordDisplay });
      return {
        job,
        isActive: isJobActive(job),
        brandGroup,
        hostGroup,
      };
    });
  }, [filteredJobs, groups.data?.hostGroups, groups.data?.brandGroups]);

  const [scrollMargin, setScrollMargin] = useState(0);
  useEffect(() => {
    const el = document.getElementById("schedule-grid-anchor");
    if (!el) return;
    const update = () => setScrollMargin(el.getBoundingClientRect().top + window.scrollY);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const rowVirtualizer = useWindowVirtualizer({
    count: jobItems.length,
    estimateSize: () => 200,
    overscan: 6,
    lanes,
    scrollMargin,
  });

  const onExportICS = useCallback(async () => {
    try {
      const ics = (await import("ics")) as unknown as {
        createEvents: (events: EventAttributes[]) => { error: unknown; value?: string };
      };

      const events: EventAttributes[] = [];
      for (const job of filteredJobs) {
        const date = job["Date livestream"];
        const slot = job["Time slot"];
        if (!date || !slot) continue;

        const [day, month, year] = date.split("/").map(Number);
        const [startTimeStr, endTimeStr] = slot.split(" - ");
        const [startHour, startMinute] = startTimeStr.split(":").map(Number);
        const [endHour, endMinute] = (endTimeStr || startTimeStr).split(":").map(Number);

        const startDate = new Date(0, 0, 0, startHour, startMinute);
        const endDate = new Date(0, 0, 0, endHour, endMinute);
        let diffMs = endDate.getTime() - startDate.getTime();
        if (diffMs <= 0) diffMs = 60 * 60 * 1000;
        const durationHours = Math.floor(diffMs / (1000 * 60 * 60));
        const durationMinutes = (diffMs / (1000 * 60)) % 60;

        events.push({
          title: job.Store || "Unnamed Job",
          start: [year, month, day, startHour, startMinute] as [number, number, number, number, number],
          duration: { hours: durationHours, minutes: durationMinutes },
          location: combineLocation(job),
          description: `MC: ${combineNames(job["Talent 1"], job["Talent 2"])}\nCoordinator: ${combineNames(
            job["Coordinator 1"],
            job["Coordinator 2"],
          )}`,
        });
      }

      if (!events.length) {
        toast.error("Không có sự kiện hợp lệ để xuất lịch.");
        return;
      }

      const { error, value } = ics.createEvents(events);
      if (error || !value) {
        toast.error("Lỗi khi tạo file ICS.");
        return;
      }

      const blob = new Blob([value], { type: "text/calendar;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `Schedule_${(filters.date || "all").replaceAll("/", "-")}.ics`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(url), 150);
      toast.success("Đã xuất lịch thành công!");
    } catch {
      toast.error("Không thể xuất lịch.");
    }
  }, [filteredJobs, filters.date]);

  const [sheetOpen, setSheetOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportJob, setReportJob] = useState<Job | null>(null);
  const handleQuickReport = useCallback((job: Job) => {
    setReportJob(job);
    setReportOpen(true);
  }, []);

  return (
    <div className="-mx-3 -my-3 bg-slate-50 px-3 py-3 sm:-mx-4 sm:-my-4 sm:px-4 sm:py-4 dark:bg-slate-950">
      <QuickReportDialog open={reportOpen} onOpenChange={setReportOpen} job={reportJob} />
      <div className="grid gap-3">
        {/* Mobile: top actions row */}
        <div className="flex items-center gap-2 sm:hidden">
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetTrigger asChild>
            <Button variant="secondary" className="flex-1">
              <Filter className="h-4 w-4" />
              Lọc
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="rounded-t-xl">
            <SheetHeader>
              <SheetTitle>Bộ lọc</SheetTitle>
              <SheetDescription>Giữ giao diện gọn, nhưng vẫn đủ mạnh.</SheetDescription>
            </SheetHeader>
            <div className="mt-4">
              <FiltersForm filters={filters} setFilters={setFilters} dates={dates} sessions={sessions} stores={stores} />
              <div className="mt-4 flex gap-2">
                <Button
                  variant="secondary"
                  className="flex-1"
                  onClick={() => {
                    setFilters({ date: getTodayDDMMYYYY(), session: "", store: "", query: "" });
                  }}
                >
                  Reset
                </Button>
                <Button className="flex-1" onClick={() => setSheetOpen(false)}>
                  Xong
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>

        <Button variant="secondary" size="icon" onClick={onExportICS} aria-label="Xuất lịch">
          <Download className="h-4 w-4" />
        </Button>
        </div>

        {/* Desktop/tablet: inline filters */}
        <div className="hidden sm:block">
        <Card className="p-4">
          <FiltersForm filters={filters} setFilters={setFilters} dates={dates} sessions={sessions} stores={stores} />
          <Separator className="my-4" />
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-[var(--color-text-secondary)]">
              {schedule.isLoading ? "Đang tải..." : `Tìm thấy ${filteredJobs.length} công việc`}
            </p>
            <div className="flex items-center gap-2">
              <Button variant="secondary" onClick={onExportICS}>
                <Download className="h-4 w-4" />
                Xuất .ics
              </Button>
            </div>
          </div>
        </Card>
        </div>

        {/* Status / Errors */}
        {schedule.error ? (
        <Card className="p-4">
          <p className="text-sm font-medium">Không thể tải lịch.</p>
          <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
            Vui lòng kiểm tra quyền Google Sheet hoặc kết nối mạng.
          </p>
        </Card>
        ) : null}

        {/* Virtualized grid */}
        <div id="schedule-grid-anchor" className="relative">
        <div style={{ height: rowVirtualizer.getTotalSize(), position: "relative" }}>
          {rowVirtualizer.getVirtualItems().map((virtualRow) => {
            const item = jobItems[virtualRow.index];
            if (!item) return null;

            const gap = 12;
            const lane = (virtualRow as unknown as { lane?: number }).lane ?? 0;
            const left = lanes === 1 ? "0px" : `calc(${lane} * ((100% - ${(lanes - 1) * gap}px) / ${lanes} + ${gap}px))`;
            const width = lanes === 1 ? "100%" : `calc((100% - ${(lanes - 1) * gap}px) / ${lanes})`;

            return (
              <div
                key={`${virtualRow.index}_${lane}`}
                style={{
                  position: "absolute",
                  top: 0,
                  left,
                  width,
                  transform: `translateY(${virtualRow.start - scrollMargin}px)`,
                }}
              >
                <JobCard
                  job={item.job}
                  isActive={item.isActive}
                  brandGroup={item.brandGroup}
                  hostGroup={item.hostGroup}
                  onQuickReport={handleQuickReport}
                />
              </div>
            );
          })}
        </div>
        </div>
      </div>
    </div>
  );
}


