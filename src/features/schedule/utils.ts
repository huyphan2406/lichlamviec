import type { Job } from "./types";

export function getTodayDDMMYYYY() {
  const today = new Date();
  const day = String(today.getDate()).padStart(2, "0");
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const year = String(today.getFullYear());
  return `${day}/${month}/${year}`;
}

export function removeAccents(str: string) {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D");
}

export function combineNames(name1?: string, name2?: string) {
  const n1 = name1 || "";
  const n2 = name2 && name2 !== "nan" ? name2 : "";
  if (n1 && n2) return `${n1} | ${n2}`;
  return n1 || n2 || "...";
}

export function combineLocation(job: Job) {
  const addressName = job.Address || "";
  const roomName = job["Studio/Room"] || "";
  const locationDisplay = [addressName, roomName].filter((part) => part && part !== "nan").join(" | ");
  return locationDisplay || "No location";
}

export function isJobActive(job: Job) {
  try {
    if (!job || !job["Date livestream"] || !job["Time slot"]) return false;

    const now = new Date();
    const [day, month, year] = (job["Date livestream"] || "").split("/");
    const [startTimeStr, endTimeStr] = (job["Time slot"] || "00:00 - 00:00").split(" - ");
    const [startHour, startMinute] = startTimeStr.split(":").map(Number);
    const [endHour, endMinute] = (endTimeStr || startTimeStr).split(":").map(Number);

    const jobStartTime = new Date(Number(year), Number(month) - 1, Number(day), startHour, startMinute);
    const jobEndTime = new Date(Number(year), Number(month) - 1, Number(day), endHour, endMinute);

    if (jobEndTime.getTime() < jobStartTime.getTime()) {
      jobEndTime.setDate(jobEndTime.getDate() + 1);
    }

    const isRunning = now.getTime() >= jobStartTime.getTime() && now.getTime() < jobEndTime.getTime();
    const soonThreshold = 60 * 60 * 1000;
    const timeToStart = jobStartTime.getTime() - now.getTime();
    const isStartingSoon = timeToStart > 0 && timeToStart <= soonThreshold;
    return isRunning || isStartingSoon;
  } catch {
    return false;
  }
}


