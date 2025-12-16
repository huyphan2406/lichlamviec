import React, { useCallback, useMemo, useState, useDeferredValue } from "react";
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

    // Always default to TODAY on page refresh/load
    // Don't load date range from localStorage - always start fresh with today
    return { dateFrom: start, dateTo: end, session: "", query };
  };

  const [filters, setFilters] = useState<ScheduleFilters>(() => ({
    ...getInitialFilters(),
  }));
  const deferredQuery = useDeferredValue(filters.query);
  const filtersForSearch = useMemo(
    () => ({ ...filters, query: deferredQuery }),
    [filters, deferredQuery],
  );

  // Memoize group indices separately to avoid recreating them
  const groupIndices = useMemo(() => {
    const hostGroups = groups.data?.hostGroups;
    const brandGroups = groups.data?.brandGroups;
    return {
      brandIndex: createGroupIndex(brandGroups),
      hostIndex: createGroupIndex(hostGroups),
      hostNameIndex: createHostNameIndex(hostGroups),
    };
  }, [groups.data?.hostGroups, groups.data?.brandGroups]);

  const jobMetaByRef = useMemo(() => {
    const { brandIndex, hostIndex, hostNameIndex } = groupIndices;

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
  }, [jobs, groupIndices]);

  const getExtraSearchText = useCallback(
    (job: Job) => {
      const meta = jobMetaByRef.get(job);
      const brand = meta?.brandGroup;
      const host = meta?.hostGroup;
      return `${brand?.originalName || ""} ${brand?.link || ""} ${host?.originalName || ""} ${host?.link || ""}`;
    },
    [jobMetaByRef],
  );

  const { filteredJobs } = useScheduleFilters(jobs, filtersForSearch, { getExtraSearchText });
  const dateRange: DateRange | undefined = useMemo(() => {
    if (!filters.dateFrom && !filters.dateTo) return undefined;
    return { from: filters.dateFrom ?? undefined, to: filters.dateTo ?? undefined };
  }, [filters.dateFrom, filters.dateTo]);

  // Cache isActive calculations to avoid recomputing
  const activeStatusCache = useMemo(() => {
    const cache = new WeakMap<Job, boolean>();
    return cache;
  }, []);

  const jobItems = useMemo(() => {
    return filteredJobs.map((job) => {
      const meta = jobMetaByRef.get(job);
      const brandGroup = meta?.brandGroup ?? null;
      const hostGroup = meta?.hostGroup ?? null;
      
      // Cache isActive calculation
      let isActiveValue = activeStatusCache.get(job);
      if (isActiveValue === undefined) {
        isActiveValue = isJobActive(job);
        activeStatusCache.set(job, isActiveValue);
      }
      
      return {
        job,
        isActive: isActiveValue,
        brandGroup,
        hostGroup,
      };
    });
  }, [filteredJobs, jobMetaByRef, activeStatusCache]);

  const grouped = useMemo(() => {
    return groupJobsByTime(jobItems, (it) => it.job["Time slot"]);
  }, [jobItems]);
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

  // Memoize callbacks to prevent re-renders
  const handleQueryChange = useCallback((value: string) => {
    try {
      localStorage.setItem("last_search_query", value);
    } catch {
      // ignore
    }
    setFilters((p) => ({ ...p, query: value }));
  }, []);

  const handleSessionChange = useCallback((value: string) => {
    setFilters((p) => ({ ...p, session: value }));
  }, []);

  const handleDateRangeChange = useCallback((range: DateRange | undefined) => {
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
  }, []);

  return (
    <div className="-mx-3 -my-3 bg-white px-3 py-4 sm:-mx-4 sm:-my-4 sm:px-4 sm:py-6 dark:bg-slate-950">
      <QuickReportDialog open={reportOpen} onOpenChange={setReportOpen} job={reportJob} />
      <div className="grid gap-3">
        <ScheduleToolbar
          query={filters.query}
          onQueryChange={handleQueryChange}
          uniqueStaffNames={uniqueStaffNames}
          session={filters.session}
          onSessionChange={handleSessionChange}
          sessionOptions={sessions}
          dateRange={dateRange}
          onDateRangeChange={handleDateRangeChange}
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
            <section key={group.timeSlot} className="mt-8 first:mt-4">
              <div className="sticky top-12 z-10 -mx-3 bg-white/95 px-3 py-3 backdrop-blur-sm sm:top-14 sm:-mx-4 sm:px-4 dark:bg-slate-950/95">
                <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 sm:text-xl">{group.timeSlot}</h2>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-3">
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


