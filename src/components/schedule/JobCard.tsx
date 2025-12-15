import React from "react";
import { DoorOpen, FilePenLine, MapPin, MessageCircle, Monitor, User } from "lucide-react";
import type { GroupLink, Job } from "@/features/schedule/types";
import { combineNames } from "@/features/schedule/utils";

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
  
  // Tách Location và Room thành 2 phần riêng
  const addressName = (job.Address || "").trim();
  const roomName = (job["Studio/Room"] || "").trim();
  
  // Nếu không có room riêng, thử split từ address nếu có format "H2 - G03A"
  let locationName = addressName;
  let finalRoomName = roomName;
  
  if (!finalRoomName && locationName.includes(" - ")) {
    const parts = locationName.split(" - ").map((p) => p.trim());
    if (parts.length >= 2) {
      locationName = parts[0];
      finalRoomName = parts.slice(1).join(" - ");
    }
  }
  
  // Fallback nếu không có gì
  if (!locationName && !finalRoomName) {
    locationName = "No location";
  }
  
  const staff = (job.staff_name || combineNames(job["Talent 1"], job["Talent 2"])).toString();
  const standby = combineNames(job["Coordinator 1"], job["Coordinator 2"]);
  const sessionType = (job["Type of session"] || "").trim().toLowerCase();
  const isCaNoi = sessionType === "ca nối" || sessionType === "ca noi";
  
  // Get Zalo links with fallback logic
  const hostZaloLink = (job.host_zalo_link || hostGroup?.link || "").toString().trim();
  const brandZaloLink = (job.brand_zalo_link || brandGroup?.link || "").toString().trim();
  
  // DEBUG: Log để kiểm tra data (có thể comment lại sau)
  if (process.env.NODE_ENV === 'development') {
    if (hostGroup || brandGroup) {
      console.log('[JobCard Debug]', {
        jobTitle: title,
        hasHostGroup: !!hostGroup,
        hostGroupLink: hostGroup?.link,
        hasBrandGroup: !!brandGroup,
        brandGroupLink: brandGroup?.link,
        hostZaloLink,
        brandZaloLink,
      });
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 h-full flex flex-col transition-all duration-200 hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
      {/* Header: title + badge + report */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-base font-extrabold leading-tight text-slate-900 dark:text-slate-50">
              <span className="block whitespace-normal break-words">{title}</span>
            </p>
            {/* Zalo buttons next to title - Brand và Host */}
            {brandZaloLink && (
              <a
                href={brandZaloLink}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => {
                  e.stopPropagation();
                  window.open(brandZaloLink, '_blank');
                }}
                className="inline-flex items-center gap-1 rounded-full bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 text-xs font-medium transition-colors shrink-0 shadow-sm"
                title={`Join Brand Zalo Group${brandGroup?.originalName ? `: ${brandGroup.originalName}` : ""}`}
                aria-label="Join Brand Zalo Group"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>Zalo</span>
              </a>
            )}
            {hostZaloLink && !brandZaloLink && (
              <a
                href={hostZaloLink}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => {
                  e.stopPropagation();
                  window.open(hostZaloLink, '_blank');
                }}
                className="inline-flex items-center gap-1 rounded-full bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 text-xs font-medium transition-colors shrink-0 shadow-sm"
                title={`Join Host Zalo Group${hostGroup?.originalName ? `: ${hostGroup.originalName}` : ""}`}
                aria-label="Join Host Zalo Group"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>Zalo</span>
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
        {/* Location - Dòng 1 */}
        {locationName && (
          <div className="flex items-center gap-2.5">
            <MapPin className="h-4 w-4 shrink-0 text-red-500" />
            <p className="flex-1 whitespace-normal break-words text-sm font-normal text-slate-700 dark:text-slate-200 leading-relaxed">
              {locationName}
            </p>
            {/* Join Host Zalo Group Button - bên cạnh address */}
            {(hostZaloLink || hostGroup?.link) && (
              <a
                href={hostZaloLink || hostGroup?.link || "#"}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => {
                  e.stopPropagation();
                  if (!hostZaloLink && !hostGroup?.link) {
                    e.preventDefault();
                  }
                }}
                className="ml-auto inline-flex items-center justify-center w-7 h-7 rounded-full bg-blue-500 text-white hover:bg-blue-600 transition-all shrink-0 shadow-md hover:shadow-lg"
                title={`Join Host Zalo Group${hostGroup?.originalName ? `: ${hostGroup.originalName}` : ""}`}
                aria-label="Join Host Zalo Group"
              >
                <MessageCircle className="w-4 h-4" />
              </a>
            )}
          </div>
        )}
        
        {/* Room - Dòng 2 (ở dưới Location) */}
        {finalRoomName && (
          <div className="flex items-center gap-2.5 ml-1">
            <DoorOpen className="h-4 w-4 shrink-0 text-indigo-500" />
            <p className="flex-1 whitespace-normal break-words text-sm text-slate-600 dark:text-slate-300">
              {finalRoomName}
            </p>
          </div>
        )}

        {/* Host */}
        <div className="flex items-center gap-2.5">
          <User className="h-4 w-4 shrink-0 text-blue-500" />
          <span className="flex-1 text-sm font-normal text-slate-700 dark:text-slate-200" title="Nhân sự">
            {staff}
          </span>
          {/* Join Host Zalo Group Button - lấy link từ get-groups.js hoặc job */}
          {(hostZaloLink || hostGroup?.link) && (
            <a
              href={hostZaloLink || hostGroup?.link || "#"}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => {
                e.stopPropagation();
                if (!hostZaloLink && !hostGroup?.link) {
                  e.preventDefault();
                }
              }}
              className="ml-1 inline-flex items-center justify-center w-7 h-7 rounded-full bg-blue-500 text-white hover:bg-blue-600 transition-all shrink-0 shadow-md hover:shadow-lg"
              title={`Join Host Zalo Group${hostGroup?.originalName ? `: ${hostGroup.originalName}` : ""}`}
              aria-label="Join Host Zalo Group"
            >
              <MessageCircle className="w-4 h-4" />
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

      {/* Optional: ACTIVE status - badge tròn màu xanh */}
      {isActive ? (
        <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-green-500 px-3 py-1 text-xs font-semibold text-white shadow-sm">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-green-300"></span>
            </span>
            ACTIVE
          </span>
        </div>
      ) : null}
    </div>
  );
}
