import { useMemo } from "react";
import { isValid, parse } from "date-fns";
import type { Job, ScheduleFilters } from "./types";
import { removeAccents } from "./utils";

function parseDDMMYYYY(dateStr: string) {
  const parsed = parse(dateStr, "dd/MM/yyyy", new Date());
  return isValid(parsed) ? parsed : null;
}

export type ScheduleFilterOptions = {
  getExtraSearchText?: (job: Job) => string;
};

export function useScheduleFilters(jobs: Job[], filters: ScheduleFilters, options?: ScheduleFilterOptions) {
  const filteredJobs = useMemo(() => {
    if (!jobs.length) return [];

    let list = jobs;

    const normQuery = filters.query ? removeAccents(filters.query.toLowerCase().trim()) : "";
    if (normQuery) {
      const cache = new WeakMap<Job, string>();
      list = list.filter((job) => {
        let haystack = cache.get(job);
        if (!haystack) {
          const base = Object.values(job).map((v) => (v ?? "").toString()).join(" ");
          const extra = options?.getExtraSearchText?.(job) ?? "";
          haystack = removeAccents(`${base} ${extra}`.toLowerCase());
          cache.set(job, haystack);
        }
        return haystack.includes(normQuery);
      });
      if (!list.length) return [];
    }

    if (filters.dateFrom || filters.dateTo) {
      const fromTs = filters.dateFrom ? filters.dateFrom.setHours(0, 0, 0, 0) : null;
      const toTs = filters.dateTo ? filters.dateTo.setHours(23, 59, 59, 999) : null;

      list = list.filter((job) => {
        const raw = String(job["Date livestream"] || "");
        const d = raw ? parseDDMMYYYY(raw) : null;
        if (!d) return false;
        const ts = d.getTime();
        if (fromTs != null && ts < fromTs) return false;
        if (toTs != null && ts > toTs) return false;
        return true;
      });
      if (!list.length) return [];
    }

    if (filters.session) {
      const normalizedFilter = filters.session.toLowerCase();
      list = list.filter((job) => String(job["Type of session"] || "").trim().toLowerCase() === normalizedFilter);
      if (!list.length) return [];
    }

    return list;
  }, [jobs, filters.query, filters.dateFrom, filters.dateTo, filters.session, options?.getExtraSearchText]);

  const groupedByTime = useMemo(() => {
    const map = new Map<string, Job[]>();
    for (const job of filteredJobs) {
      const key = job["Time slot"] || "N/A";
      const arr = map.get(key);
      if (arr) arr.push(job);
      else map.set(key, [job]);
    }
    return map;
  }, [filteredJobs]);

  return { filteredJobs, groupedByTime };
}


