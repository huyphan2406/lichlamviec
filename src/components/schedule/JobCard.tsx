import React from "react";
import { Clock, FilePenLine, Key, MapPin, MessageCircle, Monitor } from "lucide-react";
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
  const time = job["Time slot"] || "N/A";
  const sessionType = (job["Type of session"] || "").trim().toLowerCase();
  const isCaNoi = sessionType === "ca nối" || sessionType === "ca noi";
  const brandZaloLink = (job.brand_zalo_link || brandGroup?.link || "").toString().trim();

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow p-4 h-full flex flex-col">
      {/* Top Row: Time */}
      <div className="flex items-center justify-between mb-2">
        <div className="text-blue-600 font-semibold text-sm flex items-center gap-1">
          <Clock className="w-4 h-4" />
          <span>{time}</span>
        </div>
        <button
          type="button"
          onClick={() => onQuickReport(job)}
          className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-2.5 text-xs font-semibold text-gray-800 hover:bg-gray-50"
        >
          <FilePenLine className="h-4 w-4 text-gray-500" />
          Điền report
        </button>
      </div>

      {/* Middle Row: Title & Zalo */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex-1 min-w-0">
          <p className="uppercase font-bold text-gray-800 text-base leading-tight whitespace-normal break-words">
            {title}
          </p>
          {isCaNoi ? (
            <span className="mt-1 inline-flex h-5 items-center rounded border border-gray-400 px-1.5 text-[10px] font-bold uppercase tracking-wide text-gray-600">
              CA NỐI
            </span>
          ) : null}
        </div>
        {brandZaloLink && (
          <button
            type="button"
            onClick={() => window.open(brandZaloLink, "_blank")}
            className="ml-auto bg-blue-500 hover:bg-blue-600 text-white text-xs font-medium px-3 py-1 rounded-full flex items-center gap-1 transition-colors shrink-0"
            title="Join Zalo Group"
          >
            <MessageCircle className="w-3.5 h-3.5" />
            <span>Zalo</span>
          </button>
        )}
      </div>

      {/* Bottom Section: Gray Box with Details */}
      <div className="bg-gray-50 rounded-lg p-3 mt-auto flex flex-col gap-2 border border-gray-100">
        {/* Location */}
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <MapPin className="w-4 h-4 text-red-500 shrink-0" />
          <p className="whitespace-normal break-words">{location}</p>
        </div>

        {/* Staff */}
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Key className="w-4 h-4 text-gray-400 shrink-0" />
          <span className="font-normal">{staff}</span>
        </div>

        {/* Status/Standby */}
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <Monitor className="w-4 h-4 text-blue-400 shrink-0" />
          <span>{standby}</span>
        </div>
      </div>

      {/* Optional: ACTIVE status */}
      {isActive ? (
        <div className="mt-2 text-xs font-semibold text-gray-500">ACTIVE</div>
      ) : null}
    </div>
  );
}


