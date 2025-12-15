import React, { useCallback, useMemo, useState } from "react";
import { Download, Filter, Search } from "lucide-react";
import { toast } from "sonner";
import type { EventAttributes } from "ics";
import type { DateRange } from "react-day-picker";
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
import { ScheduleToolbar } from "@/components/schedule/ScheduleToolbar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

export function SchedulePage() {
  const schedule = useScheduleData();
  const groups = useGroupsData();

  const jobs = schedule.data?.jobs ?? [];
  const sessions = schedule.data?.sessions ?? [];

  const [filters, setFilters] = useState<ScheduleFilters>(() => ({
    dateFrom: null,
    dateTo: null,
    session: "",
    query: "",
  }));

  const { filteredJobs } = useScheduleFilters(jobs, filters);
  const dateRange: DateRange | undefined = useMemo(() => {
    if (!filters.dateFrom && !filters.dateTo) return undefined;
    return { from: filters.dateFrom ?? undefined, to: filters.dateTo ?? undefined };
  }, [filters.dateFrom, filters.dateTo]);

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
        <ScheduleToolbar
          query={filters.query}
          onQueryChange={(value) => setFilters((p) => ({ ...p, query: value }))}
          session={filters.session}
          onSessionChange={(value) => setFilters((p) => ({ ...p, session: value }))}
          sessionOptions={sessions}
          dateRange={dateRange}
          onDateRangeChange={(range) =>
            setFilters((p) => ({ ...p, dateFrom: range?.from ?? null, dateTo: range?.to ?? null }))
          }
          onExportIcs={onExportICS}
        />

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
              <div className="mt-4 flex gap-2">
                <Button
                  variant="secondary"
                  className="flex-1"
                  onClick={() => {
                    setFilters({ dateFrom: null, dateTo: null, session: "", query: "" });
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

        {/* Native CSS Grid (no virtualization to avoid overlap with dynamic heights) */}
        <div className="grid grid-cols-1 gap-4 pb-20 md:grid-cols-2 xl:grid-cols-3">
          {jobItems.map((item, index) => {
            const job = item.job;
            const stableKey = `${job["Date livestream"] || "na"}|${job["Time slot"] || "na"}|${job.Store || "na"}|${index}`;
            return (
              <JobCard
                key={stableKey}
                job={item.job}
                isActive={item.isActive}
                brandGroup={item.brandGroup}
                hostGroup={item.hostGroup}
                onQuickReport={handleQuickReport}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}


