import { useDeferredValue, useMemo } from "react";
import type { Job, ScheduleFilters } from "./types";
import { removeAccents } from "./utils";

export function useScheduleFilters(jobs: Job[], filters: ScheduleFilters) {
  const deferredQuery = useDeferredValue(filters.query);

  const filteredJobs = useMemo(() => {
    if (!jobs.length) return [];

    let list = jobs;

    const normQuery = deferredQuery ? removeAccents(deferredQuery.toLowerCase().trim()) : "";
    if (normQuery) {
      list = list.filter((job) => {
        const jobStr = `${job["Talent 1"] || ""} ${job["Talent 2"] || ""} ${job["Coordinator 1"] || ""} ${
          job["Coordinator 2"] || ""
        } ${job.Store || ""} ${job.Address || ""} ${job["Studio/Room"] || ""}`;
        return removeAccents(jobStr.toLowerCase()).includes(normQuery);
      });
      if (!list.length) return [];
    }

    if (filters.date) {
      list = list.filter((job) => String(job["Date livestream"] || "") === filters.date);
      if (!list.length) return [];
    }

    if (filters.session) {
      const normalizedFilter = filters.session.toLowerCase();
      list = list.filter((job) => String(job["Type of session"] || "").trim().toLowerCase() === normalizedFilter);
      if (!list.length) return [];
    }

    if (filters.store) {
      const normalizedFilter = filters.store.toLowerCase();
      list = list.filter((job) => String(job.Store || "").trim().toLowerCase() === normalizedFilter);
    }

    return list;
  }, [jobs, filters.date, filters.session, filters.store, deferredQuery]);

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


