import React, { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import type { EventAttributes } from "ics";
import type { DateRange } from "react-day-picker";
import { useGroupsData, useScheduleData } from "@/features/schedule/api";
import type { GroupLink, Job, ScheduleFilters } from "@/features/schedule/types";
import {
  createGroupIndex,
  createHostNameIndex,
  findGroupLinkWithIndex,
  findHostGroupFromNamesIndex,
} from "@/features/schedule/groupMatching";
import { useScheduleFilters } from "@/features/schedule/useScheduleFilters";
import { combineLocation, combineNames, groupJobsByTime, isJobActive } from "@/features/schedule/utils";
import { QuickReportDialog } from "@/components/schedule/QuickReportDialog";
import { JobCard } from "@/components/schedule/JobCard";
import { ScheduleToolbar } from "@/components/schedule/ScheduleToolbar";
import { Card } from "@/components/ui/card";

export function SchedulePage() {
  const schedule = useScheduleData();
  const groups = useGroupsData();

  const jobs = schedule.data?.jobs ?? [];
  const sessions = schedule.data?.sessions ?? [];
  const uniqueStaffNames = useMemo(() => {
    const set = new Set<string>();
    for (const job of jobs) {
      const candidates = [job["Talent 1"], job["Talent 2"], job["Coordinator 1"], job["Coordinator 2"]];
      for (const c of candidates) {
        const val = (c || "").toString().trim();
        if (val && val !== "nan") set.add(val);
      }
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [jobs]);

  const getInitialFilters = (): ScheduleFilters => {
    const today = new Date();
    const start = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0, 0);
    const end = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);

    let query = "";
    try {
      query = localStorage.getItem("last_search_query") || "";
    } catch {
      // ignore
    }

    // Optional persistence for date range (robust): if user ever clears we store "ALL".
    try {
      const raw = localStorage.getItem("last_date_range");
      if (raw === "ALL") {
        return { dateFrom: null, dateTo: null, session: "", query };
      }
      if (raw) {
        const parsed = JSON.parse(raw) as { from?: string; to?: string };
        const from = parsed.from ? new Date(parsed.from) : null;
        const to = parsed.to ? new Date(parsed.to) : null;
        if (from && !Number.isNaN(from.getTime())) {
          return { dateFrom: from, dateTo: to && !Number.isNaN(to.getTime()) ? to : from, session: "", query };
        }
      }
    } catch {
      // ignore
    }

    // Default: TODAY
    return { dateFrom: start, dateTo: end, session: "", query };
  };

  const [filters, setFilters] = useState<ScheduleFilters>(() => ({
    ...getInitialFilters(),
  }));

  const jobMetaByRef = useMemo(() => {
    const hostGroups = groups.data?.hostGroups;
    const brandGroups = groups.data?.brandGroups;
    const brandIndex = createGroupIndex(brandGroups);
    const hostIndex = createGroupIndex(hostGroups);
    const hostNameIndex = createHostNameIndex(hostGroups);

    const map = new Map<Job, { brandGroup: GroupLink | null; hostGroup: GroupLink | null }>();
    for (const job of jobs) {
      const brandGroup = findGroupLinkWithIndex(job, brandIndex, "brand");
      const directHostGroup = findGroupLinkWithIndex(job, hostIndex, "host");
      const talentDisplay = combineNames(job["Talent 1"], job["Talent 2"]);
      const coordDisplay = combineNames(job["Coordinator 1"], job["Coordinator 2"]);
      const hostGroup = directHostGroup || findHostGroupFromNamesIndex(hostNameIndex, { talentDisplay, coordDisplay });

      // Ensure quick-access links exist on the Job object (so JobCard can rely on job.host_zalo_link/job.brand_zalo_link).
      // This keeps behavior stable even if the schedule sheet doesn't include these fields explicitly.
      if (!job.host_zalo_link && hostGroup?.link) job.host_zalo_link = hostGroup.link;
      if (!job.brand_zalo_link && brandGroup?.link) job.brand_zalo_link = brandGroup.link;

      map.set(job, { brandGroup, hostGroup });
    }
    return map;
  }, [jobs, groups.data?.hostGroups, groups.data?.brandGroups]);

  const getExtraSearchText = useCallback(
    (job: Job) => {
      const meta = jobMetaByRef.get(job);
      const brand = meta?.brandGroup;
      const host = meta?.hostGroup;
      return `${brand?.originalName || ""} ${brand?.link || ""} ${host?.originalName || ""} ${host?.link || ""}`;
    },
    [jobMetaByRef],
  );

  const { filteredJobs } = useScheduleFilters(jobs, filters, { getExtraSearchText });
  const dateRange: DateRange | undefined = useMemo(() => {
    if (!filters.dateFrom && !filters.dateTo) return undefined;
    return { from: filters.dateFrom ?? undefined, to: filters.dateTo ?? undefined };
  }, [filters.dateFrom, filters.dateTo]);

  const jobItems = useMemo(() => {
    return filteredJobs.map((job) => {
      const meta = jobMetaByRef.get(job);
      const brandGroup = meta?.brandGroup ?? null;
      const hostGroup = meta?.hostGroup ?? null;
      return {
        job,
        isActive: isJobActive(job),
        brandGroup,
        hostGroup,
      };
    });
  }, [filteredJobs, jobMetaByRef]);

  const grouped = useMemo(() => {
    return groupJobsByTime(jobItems, (it) => it.job["Time slot"]);
  }, [jobItems]);

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
      const fromLabel = filters.dateFrom ? filters.dateFrom.toLocaleDateString("vi-VN").replaceAll("/", "-") : "";
      const toLabel = filters.dateTo ? filters.dateTo.toLocaleDateString("vi-VN").replaceAll("/", "-") : "";
      const label = fromLabel || toLabel ? `${fromLabel || "all"}_${toLabel || fromLabel || "all"}` : "all";
      link.setAttribute("download", `Schedule_${label}.ics`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(url), 150);
      toast.success("Đã xuất lịch thành công!");
    } catch {
      toast.error("Không thể xuất lịch.");
    }
  }, [filteredJobs, filters.dateFrom, filters.dateTo]);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportJob, setReportJob] = useState<Job | null>(null);
  const handleQuickReport = useCallback((job: Job) => {
    setReportJob(job);
    setReportOpen(true);
  }, []);

  const applySearch = useCallback((q: string) => {
    try {
      localStorage.setItem("last_search_query", q);
    } catch {
      // ignore
    }
    setFilters((p) => ({ ...p, query: q }));
  }, []);

  return (
    <div className="-mx-3 -my-3 bg-slate-50 px-3 py-4 sm:-mx-4 sm:-my-4 sm:px-4 sm:py-6 dark:bg-slate-950">
      <QuickReportDialog open={reportOpen} onOpenChange={setReportOpen} job={reportJob} />
      <div className="grid gap-3">
        <ScheduleToolbar
          query={filters.query}
          onQueryChange={(value) => {
            try {
              localStorage.setItem("last_search_query", value);
            } catch {
              // ignore
            }
            setFilters((p) => ({ ...p, query: value }));
          }}
          uniqueStaffNames={uniqueStaffNames}
          session={filters.session}
          onSessionChange={(value) => setFilters((p) => ({ ...p, session: value }))}
          sessionOptions={sessions}
          dateRange={dateRange}
          onDateRangeChange={(range) => {
            const from = range?.from ?? null;
            const to = range?.to ?? null;
            try {
              if (!from && !to) {
                localStorage.setItem("last_date_range", "ALL");
              } else {
                localStorage.setItem(
                  "last_date_range",
                  JSON.stringify({
                    from: from ? from.toISOString() : undefined,
                    to: to ? to.toISOString() : undefined,
                  }),
                );
              }
            } catch {
              // ignore
            }
            setFilters((p) => ({ ...p, dateFrom: from, dateTo: to || from }));
          }}
          onExportIcs={onExportICS}
          availableDates={schedule.data?.dates || []}
        />

        <div className="px-1 text-sm text-[var(--color-text-secondary)]">
          {schedule.isLoading ? "Đang tải..." : `Tìm thấy ${filteredJobs.length} công việc`}
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

        {/* Time-blocked grouped layout */}
        <div className="pb-20">
          {grouped.map((group) => (
            <section key={group.timeSlot} className="mt-8 first:mt-2">
              <div className="sticky top-12 z-10 -mx-3 bg-slate-50/95 px-3 py-2 backdrop-blur sm:top-14 sm:-mx-4 sm:px-4 dark:bg-slate-950/85">
                <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">{group.timeSlot}</h2>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
                {group.items.map((item, index) => {
                  const job = item.job;
                  const stableKey = `${group.timeSlot}|${job["Date livestream"] || "na"}|${job.Store || "na"}|${index}`;
                  return (
                    <JobCard
                      key={stableKey}
                      job={item.job}
                      isActive={item.isActive}
                      brandGroup={item.brandGroup}
                      hostGroup={item.hostGroup}
                      onQuickReport={handleQuickReport}
                      onApplySearch={applySearch}
                    />
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}


