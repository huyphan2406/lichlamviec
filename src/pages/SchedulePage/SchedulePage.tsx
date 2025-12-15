import React, { useCallback, useMemo, useState } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { CalendarPlus, Download, Filter, Link as LinkIcon, MapPin, Search, User } from "lucide-react";
import { toast } from "sonner";
import type { EventAttributes } from "ics";
import { useGroupsData, useScheduleData } from "@/features/schedule/api";
import type { GroupLink, Job, ScheduleFilters } from "@/features/schedule/types";
import { findGroupLink, findHostGroupFromNames } from "@/features/schedule/groupMatching";
import { useScheduleFilters } from "@/features/schedule/useScheduleFilters";
import { combineLocation, combineNames, getTodayDDMMYYYY, isJobActive } from "@/features/schedule/utils";
import { QuickReportDialog } from "@/components/schedule/QuickReportDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

type RowItem =
  | { id: string; type: "header"; label: string }
  | {
      id: string;
      type: "job";
      job: Job;
      isActive: boolean;
      brandGroup: GroupLink | null;
      hostGroup: GroupLink | null;
    };

function getScrollElement() {
  return document.getElementById("app-scroll");
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
          <Select value={filters.date} onValueChange={(v) => setFilters((p) => ({ ...p, date: v }))}>
            <SelectTrigger>
              <SelectValue placeholder="Tất cả" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Tất cả</SelectItem>
              {dates.map((d) => (
                <SelectItem key={d} value={d}>
                  {d}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-1.5">
          <Label>Loại ca</Label>
          <Select value={filters.session} onValueChange={(v) => setFilters((p) => ({ ...p, session: v }))}>
            <SelectTrigger>
              <SelectValue placeholder="Tất cả" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Tất cả</SelectItem>
              {sessions.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-1.5">
          <Label>Store</Label>
          <Select value={filters.store} onValueChange={(v) => setFilters((p) => ({ ...p, store: v }))}>
            <SelectTrigger>
              <SelectValue placeholder="Tất cả" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Tất cả</SelectItem>
              {stores.map((s) => (
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

function JobCard({
  job,
  isActive,
  brandGroup,
  hostGroup,
  onQuickReport,
}: {
  job: Job;
  isActive: boolean;
  brandGroup: GroupLink | null;
  hostGroup: GroupLink | null;
  onQuickReport: (job: Job) => void;
}) {
  const time = job["Time slot"] || "N/A";
  const location = combineLocation(job);
  const talent = combineNames(job["Talent 1"], job["Talent 2"]);
  const coord = combineNames(job["Coordinator 1"], job["Coordinator 2"]);
  const sessionType = (job["Type of session"] || "").trim().toLowerCase();

  return (
    <Card className="p-3">
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate text-sm font-semibold">{job.Store || "Unnamed Job"}</p>
            {isActive ? <Badge variant="brand">Đang diễn ra</Badge> : null}
            {sessionType === "ca nối" || sessionType === "ca noi" ? <Badge>Ca nối</Badge> : null}
          </div>
          <div className="mt-1 grid gap-1 text-sm text-[var(--color-text-secondary)]">
            <div className="flex items-center gap-2">
              <CalendarPlus className="h-4 w-4" />
              <span className="truncate">{time}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              <span className="truncate">{location}</span>
            </div>
            <div className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span className="truncate">{talent}</span>
            </div>
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 opacity-70" />
              <span className="truncate">{coord}</span>
            </div>
          </div>
        </div>

        <div className="flex shrink-0 flex-col gap-2">
          <Button size="sm" variant="secondary" onClick={() => onQuickReport(job)}>
            Report
          </Button>
          <div className="grid gap-1">
            <a
              className="inline-flex items-center gap-1 text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
              href={brandGroup?.link || undefined}
              target={brandGroup ? "_blank" : undefined}
              rel={brandGroup ? "noopener noreferrer" : undefined}
              aria-disabled={!brandGroup}
              onClick={(e) => {
                if (!brandGroup) e.preventDefault();
              }}
              title={brandGroup?.originalName || "Chưa có link"}
            >
              <LinkIcon className="h-3.5 w-3.5" />
              Brand
            </a>
            <a
              className="inline-flex items-center gap-1 text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
              href={hostGroup?.link || undefined}
              target={hostGroup ? "_blank" : undefined}
              rel={hostGroup ? "noopener noreferrer" : undefined}
              aria-disabled={!hostGroup}
              onClick={(e) => {
                if (!hostGroup) e.preventDefault();
              }}
              title={hostGroup?.originalName || "Chưa có link"}
            >
              <LinkIcon className="h-3.5 w-3.5" />
              Host
            </a>
          </div>
        </div>
      </div>
    </Card>
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

  const { filteredJobs, groupedByTime } = useScheduleFilters(jobs, filters);

  const flatRows: RowItem[] = useMemo(() => {
    const items: RowItem[] = [];
    const hostGroups = groups.data?.hostGroups;
    const brandGroups = groups.data?.brandGroups;

    for (const [timeGroup, groupJobs] of groupedByTime.entries()) {
      items.push({ id: `h_${timeGroup}`, type: "header", label: timeGroup });
      groupJobs.forEach((job, idx) => {
        const brandGroup = findGroupLink(job, brandGroups, "brand");
        const directHostGroup = findGroupLink(job, hostGroups, "host");
        const talentDisplay = combineNames(job["Talent 1"], job["Talent 2"]);
        const coordDisplay = combineNames(job["Coordinator 1"], job["Coordinator 2"]);
        const hostGroup = directHostGroup || findHostGroupFromNames(job, hostGroups, { talentDisplay, coordDisplay });

        items.push({
          id: `j_${timeGroup}_${idx}`,
          type: "job",
          job,
          isActive: isJobActive(job),
          brandGroup,
          hostGroup,
        });
      });
    }

    return items;
  }, [groupedByTime, groups.data?.hostGroups, groups.data?.brandGroups]);

  const rowVirtualizer = useVirtualizer({
    count: flatRows.length,
    getScrollElement,
    estimateSize: (index) => (flatRows[index]?.type === "header" ? 44 : 148),
    overscan: 6,
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
    <div className="grid gap-3">
      <QuickReportDialog open={reportOpen} onOpenChange={setReportOpen} job={reportJob} />
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

      {/* Virtualized list */}
      <div className="relative">
        <div style={{ height: rowVirtualizer.getTotalSize(), position: "relative" }}>
          {rowVirtualizer.getVirtualItems().map((virtualRow) => {
            const item = flatRows[virtualRow.index];
            if (!item) return null;

            return (
              <div
                key={item.id}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  transform: `translateY(${virtualRow.start}px)`,
                  paddingBottom: 12,
                }}
              >
                {item.type === "header" ? (
                  <div className="px-1 py-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-secondary)]">
                      {item.label}
                    </p>
                  </div>
                ) : (
                  <JobCard
                    job={item.job}
                    isActive={item.isActive}
                    brandGroup={item.brandGroup}
                    hostGroup={item.hostGroup}
                    onQuickReport={handleQuickReport}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}


