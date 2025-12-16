import React, { useMemo, useCallback } from "react";
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

function JobCardComponent({ job, isActive, brandGroup, hostGroup, onQuickReport, onApplySearch }: Props) {
  // Memoize computed values to prevent recalculation on every render
  const { title, locationName, finalRoomName, staff, standby, isCaNoi, displayName, hasHostLink, hasBrandLink, hostZaloLink, brandZaloLink } = useMemo(() => {
    const titleValue = (job.Store || "Unnamed Job").toUpperCase();
    
    // Tách Location và Room thành 2 phần riêng
    const addressName = (job.Address || "").trim();
    const roomName = (job["Studio/Room"] || "").trim();
    
    // Nếu không có room riêng, thử split từ address nếu có format "H2 - G03A"
    let locationNameValue = addressName;
    let finalRoomNameValue = roomName;
    
    if (!finalRoomNameValue && locationNameValue.includes(" - ")) {
      const parts = locationNameValue.split(" - ").map((p) => p.trim());
      if (parts.length >= 2) {
        locationNameValue = parts[0];
        finalRoomNameValue = parts.slice(1).join(" - ");
      }
    }
    
    // Fallback nếu không có gì
    if (!locationNameValue && !finalRoomNameValue) {
      locationNameValue = "No location";
    }
    
    const staffValue = (job.staff_name || combineNames(job["Talent 1"], job["Talent 2"])).toString();
    const standbyValue = combineNames(job["Coordinator 1"], job["Coordinator 2"]);
    const sessionType = (job["Type of session"] || "").trim().toLowerCase();
    const isCaNoiValue = sessionType === "ca nối" || sessionType === "ca noi";
    
    // CRITICAL FIX: Lấy brand name GỐC từ job data (job.brand_name), KHÔNG phải từ brandGroup
    // brandGroup chỉ dùng để tìm Zalo link, KHÔNG dùng để hiển thị tên
    // Đảm bảo hiển thị tên gốc từ nguồn dữ liệu job, không bị overwrite bởi group name
    const originalBrandName = (job.brand_name || "").toString().trim();
    const brandName = originalBrandName || "";
    
    // Chỉ hiển thị brand name gốc từ job source, không hiển thị title nếu có brand name
    // Nếu không có brand name thì mới hiển thị title
    const displayNameValue = brandName || titleValue;
    
    // Get Zalo links with fallback logic
    const hostZaloLinkValue = (job.host_zalo_link || hostGroup?.link || "").toString().trim();
    const brandZaloLinkValue = (job.brand_zalo_link || brandGroup?.link || "").toString().trim();
    
    // Check links separately for Host and Brand
    const hasHostLinkValue = !!hostZaloLinkValue && hostZaloLinkValue.length > 0 && hostZaloLinkValue !== "#";
    const hasBrandLinkValue = !!brandZaloLinkValue && brandZaloLinkValue.length > 0 && brandZaloLinkValue !== "#";
    
    return {
      title: titleValue,
      locationName: locationNameValue,
      finalRoomName: finalRoomNameValue,
      staff: staffValue,
      standby: standbyValue,
      isCaNoi: isCaNoiValue,
      displayName: displayNameValue,
      hasHostLink: hasHostLinkValue,
      hasBrandLink: hasBrandLinkValue,
      hostZaloLink: hostZaloLinkValue,
      brandZaloLink: brandZaloLinkValue,
    };
  }, [job, brandGroup, hostGroup]);
  
  // Memoize click handlers to prevent re-creation
  const handleBrandClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (hasBrandLink && brandZaloLink) {
      window.open(brandZaloLink, '_blank');
    }
  }, [hasBrandLink, brandZaloLink]);
  
  const handleHostClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (hasHostLink && hostZaloLink) {
      window.open(hostZaloLink, '_blank');
    }
  }, [hasHostLink, hostZaloLink]);
  
  const handleReportClick = useCallback(() => {
    onQuickReport(job);
  }, [job, onQuickReport]);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 sm:p-5 h-full flex flex-col transition-all duration-200 hover:shadow-md hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700">
      {/* Header: title + badge */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            {/* Chỉ hiển thị 1 tên gốc duy nhất - ưu tiên brand name từ file gốc */}
            <p 
              className="text-sm sm:text-base font-extrabold leading-tight text-slate-900 dark:text-slate-50 cursor-pointer hover:underline transition-all"
              onClick={handleReportClick}
              title="Click để điền report"
            >
              <span className="block whitespace-normal break-words">{displayName}</span>
            </p>
            {/* CA NỐI badge - bên phải Brand name */}
            {isCaNoi ? (
              <span className="inline-flex h-5 items-center rounded-md border border-slate-300 bg-slate-50 px-2 text-[10px] font-extrabold uppercase tracking-wide text-slate-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 shrink-0">
                CA NỐI
              </span>
            ) : null}
          </div>
        </div>
      </div>

      {/* Details stack - căn chỉnh đều */}
      <div className="flex flex-col gap-2.5 sm:gap-3.5 border-t border-slate-100 dark:border-slate-800 pt-3 sm:pt-4 flex-1">
        {/* Location - Dòng 1 */}
        {locationName && (
          <div className="flex items-start gap-2.5">
            <MapPin className="h-4 w-4 shrink-0 text-red-500 mt-0.5" />
            <p className="flex-1 whitespace-normal break-words text-sm font-normal text-slate-700 dark:text-slate-200 leading-relaxed">
              {locationName}
            </p>
          </div>
        )}
        
        {/* Room - Dòng 2 (ở dưới Location) */}
        {finalRoomName && (
          <div className="flex items-start gap-2.5">
            <DoorOpen className="h-4 w-4 shrink-0 text-indigo-500 mt-0.5" />
            <p className="flex-1 whitespace-normal break-words text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              {finalRoomName}
            </p>
          </div>
        )}

        {/* Host */}
        <div className="flex items-start gap-2.5">
          <User className="h-4 w-4 shrink-0 text-blue-500 mt-0.5" />
          <span className="flex-1 text-sm font-normal text-slate-700 dark:text-slate-200 leading-relaxed" title="Nhân sự">
            {staff}
          </span>
        </div>

        {/* Status/Standby */}
        <div className="flex items-start gap-2.5">
          <Monitor className="h-4 w-4 shrink-0 text-purple-500 mt-0.5" />
          <span className="flex-1 text-sm text-slate-600 dark:text-slate-300 leading-relaxed" title="Standby/Coordinator">
            {standby}
          </span>
        </div>
      </div>

      {/* Status section - ACTIVE hoặc INACTIVE + Zalo buttons luôn hiển thị */}
      <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2 sm:gap-3">
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
        <div className="flex items-center gap-1 sm:gap-1.5 flex-shrink-0">
          {/* Brand Group Button */}
          <button
            type="button"
            onClick={handleBrandClick}
            disabled={!hasBrandLink}
            className={`inline-flex items-center gap-1 sm:gap-1.5 rounded-full px-2.5 sm:px-3 py-1 sm:py-1.5 text-[10px] sm:text-xs font-medium transition-all shrink-0 ${
              hasBrandLink
                ? 'bg-blue-500 text-white hover:bg-blue-600 cursor-pointer shadow-sm hover:shadow-md'
                : 'bg-gray-200 text-gray-500 cursor-not-allowed dark:bg-gray-700 dark:text-gray-400'
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
            onClick={handleHostClick}
            disabled={!hasHostLink}
            className={`inline-flex items-center gap-1 sm:gap-1.5 rounded-full px-2.5 sm:px-3 py-1 sm:py-1.5 text-[10px] sm:text-xs font-medium transition-all shrink-0 ${
              hasHostLink
                ? 'bg-blue-500 text-white hover:bg-blue-600 cursor-pointer shadow-sm hover:shadow-md'
                : 'bg-gray-200 text-gray-500 cursor-not-allowed dark:bg-gray-700 dark:text-gray-400'
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

// Memoize component to prevent unnecessary re-renders
// Use shallow comparison for better performance
export const JobCard = React.memo(JobCardComponent, (prevProps, nextProps) => {
  // Fast path: if references are the same, skip deep comparison
  if (prevProps.job === nextProps.job &&
      prevProps.isActive === nextProps.isActive &&
      prevProps.brandGroup === nextProps.brandGroup &&
      prevProps.hostGroup === nextProps.hostGroup &&
      prevProps.onQuickReport === nextProps.onQuickReport &&
      prevProps.onApplySearch === nextProps.onApplySearch) {
    return true; // Props are equal, skip re-render
  }
  
  // Deep comparison for job object (only if reference changed but might be same data)
  if (prevProps.job !== nextProps.job) {
    // Quick check: compare key fields that affect rendering
    const keyFields = ['Store', 'brand_name', 'Address', 'Studio/Room', 'Talent 1', 'Talent 2', 'Coordinator 1', 'Coordinator 2', 'Date livestream', 'Time slot'];
    for (const field of keyFields) {
      if (prevProps.job[field] !== nextProps.job[field]) {
        return false; // Props changed, need re-render
      }
    }
  }
  
  // All other props comparison
  return (
    prevProps.isActive === nextProps.isActive &&
    prevProps.brandGroup === nextProps.brandGroup &&
    prevProps.hostGroup === nextProps.hostGroup &&
    prevProps.onQuickReport === nextProps.onQuickReport &&
    prevProps.onApplySearch === nextProps.onApplySearch
  );
});
