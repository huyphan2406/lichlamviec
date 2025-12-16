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
    const query = filters.query ? filters.query.trim() : "";
    
    if (query) {
      // Normalize query once for comparison (cache this)
      const normalizedQuery = removeVietnameseTones(query);
      
      // Cache normalized field values to avoid repeated calculations
      const normalizedCache = new WeakMap<Job, Map<string, string>>();
      
      const getNormalizedField = (job: Job, fieldKey: string, fieldValue: string | undefined | null): string => {
        if (!fieldValue) return "";
        const str = String(fieldValue).trim();
        if (!str || str === "nan") return "";
        
        // Check cache first
        let jobCache = normalizedCache.get(job);
        if (!jobCache) {
          jobCache = new Map();
          normalizedCache.set(job, jobCache);
        }
        
        const cacheKey = `${fieldKey}:${str}`;
        if (jobCache.has(cacheKey)) {
          return jobCache.get(cacheKey)!;
        }
        
        const normalized = removeVietnameseTones(str);
        jobCache.set(cacheKey, normalized);
        return normalized;
      };
      
      // Step B: Filter with field-by-field search (optimized with caching)
      list = list.filter((job) => {
        // Helper to safely extract field values
        const safeField = (value: string | undefined | null): string => {
          if (!value) return "";
          const str = String(value).trim();
          return str && str !== "nan" ? str : "";
        };
        
        // Helper để tìm kiếm chính xác trong một field (tìm theo chuỗi đầy đủ, không word-by-word)
        const matchesField = (fieldValue: string, fieldKey: string): boolean => {
          if (!fieldValue) return false;
          const normalizedField = getNormalizedField(job, fieldKey, fieldValue);
          // Tìm kiếm theo chuỗi đầy đủ trong field đó (substring match, không phải word-by-word)
          return normalizedField.includes(normalizedQuery);
        };
        
        // Early return pattern - check most common fields first
        
        // 1. Job name (Title/Store) - most common search
        const jobName = safeField(job.Store);
        if (jobName && matchesField(jobName, "Store")) return true;
        
        // 2. Staff names (Host/KOL) - second most common
        // Tìm kiếm cả tên gốc (có số_) và tên đã clean (không có số_)
        const staffFields = [
          { val: job["Talent 1"], key: "Talent1" },
          { val: job["Talent 2"], key: "Talent2" },
          { val: job["Coordinator 1"], key: "Coord1" },
          { val: job["Coordinator 2"], key: "Coord2" },
          { val: job.staff_name, key: "staff_name" },
        ];
        
        for (const { val, key } of staffFields) {
          if (!val) continue;
          const originalName = safeField(val);
          // Tìm kiếm với tên gốc (có thể có số_ ở đầu) - ưu tiên
          if (originalName && matchesField(originalName, key)) return true;
          // Tìm kiếm với tên đã clean (không có số_) - fallback
          const cleaned = originalName.replace(/^\d+_/, "").trim();
          if (cleaned && cleaned !== originalName && matchesField(cleaned, `${key}_cleaned`)) return true;
        }
        
        // 3. Original Brand name
        const brandName = safeField(job.brand_name);
        if (brandName && matchesField(brandName, "brand_name")) return true;
        
        // 4. Location (Address)
        const location = safeField(job.Address);
        if (location && matchesField(location, "Address")) return true;
        
        // 5. Room
        const room = safeField(job["Studio/Room"]);
        if (room && matchesField(room, "Room")) return true;
        
        // 6. Group Zalo links (if available)
        const groupZaloLink = safeField(job.group_zalo_link || job.brand_zalo_link || job.host_zalo_link);
        if (groupZaloLink && matchesField(groupZaloLink, "zalo_link")) return true;
        
        // 7. Type of session
        const sessionType = safeField(job["Type of session"]);
        if (sessionType && matchesField(sessionType, "session")) return true;
        
        // 8. Date livestream (as string for search)
        const dateLivestream = safeField(job["Date livestream"]);
        if (dateLivestream && matchesField(dateLivestream, "date")) return true;
        
        // 9. Time slot
        const timeSlot = safeField(job["Time slot"]);
        if (timeSlot && matchesField(timeSlot, "time")) return true;
        
        // 10. Extra search text (e.g., group names from getExtraSearchText)
        const extra = options?.getExtraSearchText?.(job) || "";
        if (extra && matchesField(extra, "extra")) return true;
        
        // Không match với field nào
        return false;
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


