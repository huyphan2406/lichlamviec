import React from "react";
import { FilePenLine, Key, MapPin, MessageCircle, Monitor } from "lucide-react";
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
  const zaloLink = brandGroup?.link || "";
  const sessionType = (job["Type of session"] || "").trim().toLowerCase();
  const isCaNoi = sessionType === "ca nối" || sessionType === "ca noi";

  return (
    <div className="min-h-fit rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-col gap-3">
        {/* Top-right actions */}
        <div className="flex items-start justify-end gap-2">
          {isActive ? (
            <span className="mr-auto rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
              ACTIVE
            </span>
          ) : (
            <span className="mr-auto" />
          )}

          {zaloLink ? (
            <a
              href={zaloLink}
              target="_blank"
              rel="noopener noreferrer"
              title={brandGroup?.originalName || "Zalo"}
              className="inline-flex h-8 items-center gap-2 rounded-full bg-slate-900 px-3 text-xs font-semibold text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
            >
              <MessageCircle className="h-4 w-4" />
              Zalo
            </a>
          ) : null}

          <button
            type="button"
            onClick={() => onQuickReport(job)}
            className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-800 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
          >
            <FilePenLine className="h-4 w-4 text-slate-500 dark:text-slate-300" />
            Điền report
          </button>
        </div>

        {/* Title */}
        <div>
          <div className="flex flex-wrap items-start gap-2">
            <p className="min-w-0 flex-1 text-base font-extrabold leading-snug tracking-tight text-slate-900 dark:text-slate-50">
              <span className="block whitespace-normal break-words">{title}</span>
            </p>
            {isCaNoi ? (
              <span className="mt-0.5 inline-flex h-6 items-center rounded-md border border-slate-600 bg-white px-2 text-[11px] font-extrabold uppercase tracking-wide text-slate-700 dark:border-slate-400 dark:bg-slate-900 dark:text-slate-200">
                CA NỐI
              </span>
            ) : null}
          </div>
        </div>

        {/* Details box: vertical stacked layout */}
        <div className="rounded-lg bg-slate-100 p-3 dark:bg-slate-800/60">
          <div className="flex flex-col gap-2">
            <div className="flex items-start gap-2">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />
              <p className="whitespace-normal break-words text-sm text-slate-700 dark:text-slate-200">{location}</p>
            </div>

            <div className="flex items-start gap-2">
              <Key className="mt-0.5 h-4 w-4 shrink-0 text-slate-500 dark:text-slate-300" />
              <button
                type="button"
                className="text-left text-sm text-slate-700 hover:text-slate-900 hover:underline dark:text-slate-200 dark:hover:text-white"
                onClick={() => {
                  const q = staff === "..." ? "" : staff;
                  if (q) onApplySearch?.(q);
                }}
                title="Lọc theo nhân sự"
              >
                {staff}
              </button>
            </div>

            <div className="flex items-start gap-2">
              <Monitor className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />
              <div className="min-w-0 text-sm text-slate-700 dark:text-slate-200">
                {brandGroup?.originalName ? (
                  <button
                    type="button"
                    className="text-left font-semibold text-slate-600 hover:text-slate-900 hover:underline dark:text-slate-300 dark:hover:text-white"
                    onClick={() => onApplySearch?.(brandGroup.originalName)}
                    title="Lọc theo brand"
                  >
                    Brand: {brandGroup.originalName}
                  </button>
                ) : null}

                {brandGroup?.originalName && standby !== "..." ? <span className="text-slate-400"> {" • "} </span> : null}

                {standby !== "..." ? (
                  <button
                    type="button"
                    className="text-left hover:text-slate-900 hover:underline dark:hover:text-white"
                    onClick={() => onApplySearch?.(standby)}
                    title="Lọc theo standby"
                  >
                    Standby: {standby}
                  </button>
                ) : (
                  <span>Standby: {standby}</span>
                )}
              </div>
            </div>

            {hostGroup?.originalName ? (
              <div className="flex items-start gap-2">
                <MessageCircle className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />
                <div className="min-w-0 text-sm">
                  <button
                    type="button"
                    className="text-left font-semibold text-slate-600 hover:text-slate-900 hover:underline dark:text-slate-300 dark:hover:text-white"
                    onClick={() => onApplySearch?.(hostGroup.originalName)}
                    title="Lọc theo host"
                  >
                    Host: {hostGroup.originalName}
                  </button>
                  {hostGroup.link ? (
                    <>
                      <span className="text-slate-400"> {" • "} </span>
                      <a
                        href={hostGroup.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-semibold text-slate-600 hover:text-slate-900 hover:underline dark:text-slate-300 dark:hover:text-white"
                        title={hostGroup.originalName}
                      >
                        Mở group host
                      </a>
                    </>
                  ) : null}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}


