import React from "react";
import { FilePenLine, MapPin, MessageCircle, Monitor, User } from "lucide-react";
import type { GroupLink, Job } from "@/features/schedule/types";
import { combineLocation, combineNames } from "@/features/schedule/utils";

type Props = {
  job: Job;
  isActive: boolean;
  brandGroup: GroupLink | null;
  hostGroup: GroupLink | null;
  onQuickReport: (job: Job) => void;
  onApplySearch?: (query: string) => void;
};

export function JobCard({ job, isActive, brandGroup, hostGroup, onQuickReport, onApplySearch }: Props) {
  const title = (job.Store || "Unnamed Job").toUpperCase();
  const location = combineLocation(job);
  const staff = (job.staff_name || combineNames(job["Talent 1"], job["Talent 2"])).toString();
  const standby = combineNames(job["Coordinator 1"], job["Coordinator 2"]);
  const sessionType = (job["Type of session"] || "").trim().toLowerCase();
  const isCaNoi = sessionType === "ca nối" || sessionType === "ca noi";
  const hostZaloLink = (job.host_zalo_link || hostGroup?.link || "").toString().trim();
  const brandZaloLink = (job.brand_zalo_link || brandGroup?.link || "").toString().trim();

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 h-full flex flex-col transition-all duration-200 hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
      {/* Header: title + badge + report */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-base font-extrabold leading-tight text-slate-900 dark:text-slate-50">
              <span className="block whitespace-normal break-words">{title}</span>
            </p>
            {/* Brand Zalo button next to title */}
            {brandZaloLink && (
              <a
                href={brandZaloLink}
                target="_blank"
                rel="noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors shrink-0"
                title="Join Brand Zalo Group"
                aria-label="Join Brand Zalo Group"
              >
                <MessageCircle className="w-3.5 h-3.5" />
              </a>
            )}
            {isCaNoi ? (
              <span className="inline-flex h-5 items-center rounded-md border border-slate-600 px-2 text-[10px] font-extrabold uppercase tracking-wide text-slate-700 dark:border-slate-400 dark:text-slate-200 shrink-0">
                CA NỐI
              </span>
            ) : null}
          </div>
        </div>

        <button
          type="button"
          onClick={() => onQuickReport(job)}
          className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-800 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
        >
          <FilePenLine className="h-4 w-4 text-slate-500 dark:text-slate-300" />
          Điền report
        </button>
      </div>

      {/* Details stack - căn chỉnh đều */}
      <div className="flex flex-col gap-3 border-t border-slate-100 pt-3 flex-1">
        {/* Location */}
        <div className="flex items-center gap-2.5">
          <MapPin className="h-4 w-4 shrink-0 text-red-500" />
          <p className="flex-1 whitespace-normal break-words text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            {location}
          </p>
        </div>

        {/* Host */}
        <div className="flex items-center gap-2.5">
          <User className="h-4 w-4 shrink-0 text-blue-500" />
          <span className="flex-1 text-sm font-medium text-slate-700 dark:text-slate-200" title="Nhân sự">
            {staff}
          </span>
          {/* Join Host Zalo Group Button */}
          {hostZaloLink && (
            <a
              href={hostZaloLink}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-500 text-white hover:bg-blue-600 transition-colors shrink-0"
              title={`Join Host Zalo Group${hostGroup?.originalName ? `: ${hostGroup.originalName}` : ""}`}
              aria-label="Join Host Zalo Group"
            >
              <MessageCircle className="w-3.5 h-3.5" />
            </a>
          )}
        </div>

        {/* Status/Standby */}
        <div className="flex items-center gap-2.5">
          <Monitor className="h-4 w-4 shrink-0 text-purple-500" />
          <span className="flex-1 text-sm text-slate-600 dark:text-slate-300" title="Standby/Coordinator">
            {standby}
          </span>
        </div>
      </div>

      {/* Optional: ACTIVE status, subtle */}
      {isActive ? (
        <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs font-semibold text-slate-500 dark:text-slate-400">
          ACTIVE
        </div>
      ) : null}
    </div>
  );
}
