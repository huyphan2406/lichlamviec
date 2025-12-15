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
          
          // 1. Store/Title
          const store = (job.Store || "").toString().trim();
          if (store && store !== "nan") searchableFields.push(store);
          
          // 2. Brand name
          const brandName = (job.brand_name || "").toString().trim();
          if (brandName && brandName !== "nan") searchableFields.push(brandName);
          
          // 3. Staff names (Host/KOL) - normalize to remove numbers and special chars
          const staffFields = [
            job["Talent 1"],
            job["Talent 2"],
            job["Coordinator 1"],
            job["Coordinator 2"],
            job.staff_name,
          ]
            .filter(Boolean)
            .map((v) => String(v).trim())
            .filter((v) => v && v !== "nan");
          
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
          const address = (job.Address || "").toString().trim();
          if (address && address !== "nan") searchableFields.push(address);
          
          // 5. Room
          const room = (job["Studio/Room"] || "").toString().trim();
          if (room && room !== "nan") searchableFields.push(room);
          
          // 6. Type of session
          const sessionType = (job["Type of session"] || "").toString().trim();
          if (sessionType && sessionType !== "nan") searchableFields.push(sessionType);
          
          // 7. Date livestream (as string for search)
          const dateLivestream = (job["Date livestream"] || "").toString().trim();
          if (dateLivestream && dateLivestream !== "nan") searchableFields.push(dateLivestream);
          
          // 8. Time slot
          const timeSlot = (job["Time slot"] || "").toString().trim();
          if (timeSlot && timeSlot !== "nan") searchableFields.push(timeSlot);
          
          // 9. Extra search text (e.g., group names from getExtraSearchText)
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


