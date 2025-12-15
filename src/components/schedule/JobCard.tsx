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
};

export function JobCard({ job, isActive, brandGroup, hostGroup, onQuickReport }: Props) {
  const time = job["Time slot"] || "N/A";
  const title = (job.Store || "Unnamed Job").toUpperCase();
  const location = combineLocation(job);
  const staff = combineNames(job["Talent 1"], job["Talent 2"]);
  const standby = combineNames(job["Coordinator 1"], job["Coordinator 2"]);

  return (
    <div className="h-full rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition-shadow hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
      {/* Header row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-orange-50 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400">
            <Clock className="h-4 w-4" />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">{time}</p>
            {isActive ? (
              <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
                ACTIVE
              </span>
            ) : null}
          </div>
        </div>

        <button
          type="button"
          onClick={() => onQuickReport(job)}
          className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          <FilePenLine className="h-4 w-4 text-slate-500 dark:text-slate-300" />
          Điền report
        </button>
      </div>

      {/* Title row */}
      <div className="mt-3 flex items-start justify-between gap-3">
        <p className="flex-1 text-base font-extrabold tracking-tight text-slate-900 dark:text-slate-50">
          <span className="block whitespace-normal break-words">{title}</span>
        </p>

        <a
          href={brandGroup?.link || undefined}
          target={brandGroup ? "_blank" : undefined}
          rel={brandGroup ? "noopener noreferrer" : undefined}
          onClick={(e) => {
            if (!brandGroup) e.preventDefault();
          }}
          aria-disabled={!brandGroup}
          title={brandGroup?.originalName || "Chưa có link Zalo"}
          className={[
            "inline-flex h-8 shrink-0 items-center gap-2 rounded-full px-3 text-xs font-semibold",
            brandGroup
              ? "bg-blue-500 text-white hover:bg-blue-600"
              : "bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500",
          ].join(" ")}
        >
          <MessageCircle className="h-4 w-4" />
          Zalo
        </a>
      </div>

      {/* Details grid */}
      <div className="mt-4 rounded-xl bg-slate-50 p-4 dark:bg-slate-800/40">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="flex min-w-0 items-start gap-2">
            <MapPin className="h-4 w-4 shrink-0 text-rose-500" />
            <p className="whitespace-normal break-words text-sm text-slate-700 dark:text-slate-200">{location}</p>
          </div>
          <div className="flex min-w-0 items-start gap-2">
            <Key className="h-4 w-4 shrink-0 text-slate-500 dark:text-slate-300" />
            <p className="whitespace-normal break-words text-sm text-slate-700 dark:text-slate-200">{staff}</p>
          </div>
          <div className="flex min-w-0 items-start gap-2 sm:col-span-2">
            <Monitor className="h-4 w-4 shrink-0 text-sky-500" />
            <p className="whitespace-normal break-words text-sm text-slate-700 dark:text-slate-200">{standby}</p>
          </div>
        </div>

        {hostGroup ? (
          <a
            href={hostGroup.link}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-700 dark:text-slate-300 dark:hover:text-slate-100"
            title={hostGroup.originalName}
          >
            <MessageCircle className="h-4 w-4 text-sky-500" />
            Host group
          </a>
        ) : null}
      </div>
    </div>
  );
}


