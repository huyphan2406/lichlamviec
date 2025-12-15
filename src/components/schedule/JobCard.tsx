import React from "react";
import { DoorOpen, MapPin, MessageCircle, Monitor, User } from "lucide-react";
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
  
  // Chỉ lấy brand name gốc từ brandGroup - đây là tên duy nhất hiển thị
  const brandName = brandGroup?.originalName?.trim() || "";
  
  // Chỉ hiển thị brand name gốc, không hiển thị title nếu có brand name
  // Nếu không có brand name thì mới hiển thị title
  const displayName = brandName || title;
  
  // Get Zalo links with fallback logic
  const hostZaloLink = (job.host_zalo_link || hostGroup?.link || "").toString().trim();
  const brandZaloLink = (job.brand_zalo_link || brandGroup?.link || "").toString().trim();
  
  // DEBUG MODE: Check links separately for Host and Brand
  const hasHostLink = !!hostZaloLink && hostZaloLink.length > 0 && hostZaloLink !== "#";
  const hasBrandLink = !!brandZaloLink && brandZaloLink.length > 0 && brandZaloLink !== "#";
  
  // DEBUG: Detailed console logs
  console.log(`[JobCard Debug] Job: ${title}`, {
    hasHostGroup: !!hostGroup,
    hostGroupLink: hostGroup?.link,
    hostGroupName: hostGroup?.originalName,
    hasBrandGroup: !!brandGroup,
    brandGroupLink: brandGroup?.link,
    brandGroupName: brandGroup?.originalName,
    jobHostZaloLink: job.host_zalo_link,
    jobBrandZaloLink: job.brand_zalo_link,
    finalHostLink: hostZaloLink,
    finalBrandLink: brandZaloLink,
    hasHostLink,
    hasBrandLink,
  });

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 h-full flex flex-col transition-all duration-200 hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
      {/* Header: title + badge + report */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            {/* Chỉ hiển thị 1 tên gốc duy nhất - ưu tiên brand name từ file gốc */}
            <p 
              className="text-base font-extrabold leading-tight text-slate-900 dark:text-slate-50 cursor-pointer hover:underline transition-all"
              onClick={() => onQuickReport(job)}
              title={brandName ? "Click để điền report" : ""}
            >
              <span className="block whitespace-normal break-words">{displayName}</span>
            </p>
            {/* CA NỐI badge - bên phải Brand name */}
            {isCaNoi ? (
              <span className="inline-flex h-5 items-center rounded-md border border-slate-600 px-2 text-[10px] font-extrabold uppercase tracking-wide text-slate-700 dark:border-slate-400 dark:text-slate-200 shrink-0">
                CA NỐI
              </span>
            ) : null}
          </div>
        </div>
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
        </div>

        {/* Status/Standby */}
        <div className="flex items-center gap-2.5">
          <Monitor className="h-4 w-4 shrink-0 text-purple-500" />
          <span className="flex-1 text-sm text-slate-600 dark:text-slate-300" title="Standby/Coordinator">
            {standby}
          </span>
        </div>
      </div>

      {/* Status section - ACTIVE hoặc INACTIVE + Zalo buttons luôn hiển thị */}
      <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
        {/* ACTIVE hoặc INACTIVE badge */}
        {isActive ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-green-500 px-3 py-1 text-xs font-semibold text-white shadow-sm">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-green-300"></span>
            </span>
            ACTIVE
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-400 px-3 py-1 text-xs font-semibold text-white shadow-sm">
            <span className="relative flex h-2 w-2">
              <span className="relative inline-flex h-2 w-2 rounded-full bg-gray-300"></span>
            </span>
            INACTIVE
          </span>
        )}
        {/* 2 Zalo buttons - luôn luôn hiển thị */}
        <div className="flex items-center gap-2">
          {/* Brand Group Button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (hasBrandLink && brandZaloLink) {
                window.open(brandZaloLink, '_blank');
              }
            }}
            disabled={!hasBrandLink}
            className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium transition-colors shrink-0 ${
              hasBrandLink
                ? 'bg-blue-500 text-white hover:bg-blue-600 cursor-pointer shadow-sm'
                : 'bg-gray-200 text-gray-500 cursor-not-allowed'
            }`}
            title={
              hasBrandLink
                ? `Join Brand Zalo Group${brandGroup?.originalName ? `: ${brandGroup.originalName}` : ""}`
                : 'No Brand Zalo link available'
            }
            aria-label={hasBrandLink ? 'Join Brand Zalo Group' : 'No Brand Zalo link available'}
          >
            <MessageCircle className="w-3.5 h-3.5" />
            <span>{hasBrandLink ? 'Brand' : 'No Link'}</span>
          </button>
          {/* Host Group Button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (hasHostLink && hostZaloLink) {
                window.open(hostZaloLink, '_blank');
              }
            }}
            disabled={!hasHostLink}
            className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium transition-colors shrink-0 ${
              hasHostLink
                ? 'bg-blue-500 text-white hover:bg-blue-600 cursor-pointer shadow-sm'
                : 'bg-gray-200 text-gray-500 cursor-not-allowed'
            }`}
            title={
              hasHostLink
                ? `Join Host Zalo Group${hostGroup?.originalName ? `: ${hostGroup.originalName}` : ""}`
                : 'No Host Zalo link available'
            }
            aria-label={hasHostLink ? 'Join Host Zalo Group' : 'No Host Zalo link available'}
          >
            <MessageCircle className="w-3.5 h-3.5" />
            <span>{hasHostLink ? 'Host' : 'No Link'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
