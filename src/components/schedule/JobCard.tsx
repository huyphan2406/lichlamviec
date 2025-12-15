import React from "react";
import { Building2, FilePenLine, MapPin, MessageCircle, Monitor, User } from "lucide-react";
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
  const staff = combineNames(job["Talent 1"], job["Talent 2"]);
  const standby = combineNames(job["Coordinator 1"], job["Coordinator 2"]);
  const sessionType = (job["Type of session"] || "").trim().toLowerCase();
  const isCaNoi = sessionType === "ca nối" || sessionType === "ca noi";
  const hostZaloLink = (job.host_zalo_link || "").toString().trim();
  const brandZaloLink = (job.brand_zalo_link || "").toString().trim();
  const brandName = brandGroup?.originalName || title;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 h-full transition-all duration-200 hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
      <div className="flex h-full flex-col justify-between gap-4">
        {/* Header: title + badge + report */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-start gap-2">
              <p className="text-base font-extrabold leading-snug text-slate-900 dark:text-slate-50">
                <span className="block whitespace-normal break-words">{title}</span>
              </p>
              {isCaNoi ? (
                <span className="mt-0.5 inline-flex h-6 items-center rounded-md border border-slate-600 px-2 text-[11px] font-extrabold uppercase tracking-wide text-slate-700 dark:border-slate-400 dark:text-slate-200">
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

        {/* Details stack (same white background) */}
        <div className="flex flex-col gap-3 border-t border-slate-100 pt-3 dark:border-slate-800">
          <div className="flex items-start gap-2">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />
            <p className="whitespace-normal break-words text-sm text-slate-600 dark:text-slate-300">{location}</p>
          </div>

          {/* Host */}
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-slate-400" />
            <span
              className="text-sm font-medium text-slate-700 hover:text-blue-600 cursor-pointer transition-colors"
              onClick={() => {
                const q = staff === "..." ? "" : staff;
                if (q) onApplySearch?.(q);
              }}
              title="Lọc theo nhân sự"
            >
              {staff}
            </span>

            {/* FORCE RENDER ZALO BUTTON FOR HOST */}
            {hostZaloLink && (
              <a
                href={hostZaloLink}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white transition-all ml-1"
                title="Join Host Zalo Group"
              >
                <MessageCircle className="w-3.5 h-3.5" />
              </a>
            )}
          </div>

          {/* Brand */}
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-slate-400" />
            <span
              className="text-sm font-medium text-slate-700 hover:text-blue-600 cursor-pointer transition-colors"
              onClick={() => {
                const q = brandGroup?.originalName || brandName;
                if (q) onApplySearch?.(q);
              }}
              title="Lọc theo brand"
            >
              {brandName}
            </span>

            {/* FORCE RENDER ZALO BUTTON FOR BRAND */}
            {brandZaloLink && (
              <a
                href={brandZaloLink}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white transition-all ml-1"
                title="Join Brand Zalo Group"
              >
                <MessageCircle className="w-3.5 h-3.5" />
              </a>
            )}
          </div>

          {/* Status/Standby */}
          <div className="flex items-start gap-2">
            <Monitor className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />
            <button
              type="button"
              className="text-left text-sm text-slate-600 hover:text-slate-900 hover:underline dark:text-slate-300 dark:hover:text-white"
              onClick={() => {
                const q = standby === "..." ? "" : standby;
                if (q) onApplySearch?.(q);
              }}
              title="Lọc theo standby"
            >
              {standby}
            </button>
          </div>
        </div>

        {/* Optional: ACTIVE status, subtle */}
        {isActive ? (
          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">ACTIVE</div>
        ) : null}
      </div>
    </div>
  );
}


