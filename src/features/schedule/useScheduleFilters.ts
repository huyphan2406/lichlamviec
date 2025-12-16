import { useMemo } from "react";
import { isValid, parse } from "date-fns";
import type { Job, ScheduleFilters } from "./types";
import { removeVietnameseTones } from "./utils";

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

    // Step A: Prepare the Query
    const normalizedQuery = filters.query ? removeVietnameseTones(filters.query) : "";
    
    if (normalizedQuery) {
      // Cache normalized search documents for performance
      const searchDocCache = new WeakMap<Job, string>();
      
      // Step B: Filter with robust search
      list = list.filter((job) => {
        // Get or create search document for this job
        let searchDoc = searchDocCache.get(job);
        if (!searchDoc) {
          // Construct search document from ALL relevant fields
          const searchableFields: string[] = [];
          
          // Helper to safely extract and normalize field values
          const safeField = (value: string | undefined | null): string => {
            if (!value) return "";
            const str = String(value).trim();
            return str && str !== "nan" ? str : "";
          };
          
          // 1. Job name (Title/Store)
          const jobName = safeField(job.Store);
          if (jobName) searchableFields.push(jobName);
          
          // 2. Original Brand name (CRITICAL - preserve original from job source)
          const brandName = safeField(job.brand_name);
          if (brandName) searchableFields.push(brandName);
          
          // 3. Staff names (Host/KOL) - normalize to remove numbers and special chars
          const staffFields = [
            job["Talent 1"],
            job["Talent 2"],
            job["Coordinator 1"],
            job["Coordinator 2"],
            job.staff_name,
          ]
            .filter(Boolean)
            .map((v) => safeField(v))
            .filter(Boolean);
          
          // Normalize staff names: remove leading numbers_underscore, keep only letters and spaces
          const normalizedStaffNames = staffFields.map((name) => {
            return removeVietnameseTones(name)
              .replace(/^\d+_/, "") // Remove leading numbers and underscore (e.g., "123_An Lữ" → "An Lữ")
              .replace(/[^a-z0-9\s]/g, "") // Keep only letters, numbers, and spaces
              .replace(/\s+/g, " ") // Normalize whitespace
              .trim();
          });
          searchableFields.push(...normalizedStaffNames.filter(Boolean));
          
          // 4. Location (Address)
          const location = safeField(job.Address);
          if (location) searchableFields.push(location);
          
          // 5. Room
          const room = safeField(job["Studio/Room"]);
          if (room) searchableFields.push(room);
          
          // 6. Group Zalo links (if available)
          const groupZaloLink = safeField(job.group_zalo_link || job.brand_zalo_link || job.host_zalo_link);
          if (groupZaloLink) searchableFields.push(groupZaloLink);
          
          // 7. Type of session
          const sessionType = safeField(job["Type of session"]);
          if (sessionType) searchableFields.push(sessionType);
          
          // 8. Date livestream (as string for search)
          const dateLivestream = safeField(job["Date livestream"]);
          if (dateLivestream) searchableFields.push(dateLivestream);
          
          // 9. Time slot
          const timeSlot = safeField(job["Time slot"]);
          if (timeSlot) searchableFields.push(timeSlot);
          
          // 10. Extra search text (e.g., group names from getExtraSearchText)
          const extra = options?.getExtraSearchText?.(job) || "";
          if (extra) searchableFields.push(extra);
          
          // Combine all fields and normalize the entire document
          const fullSearchString = searchableFields.join(" ");
          searchDoc = removeVietnameseTones(fullSearchString);
          
          // Cache for performance
          searchDocCache.set(job, searchDoc);
        }
        
        // Step C: Check if normalized query is included in normalized document
        return searchDoc.includes(normalizedQuery);
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


