import useSWR from "swr";
import type { GroupsResponse, ScheduleResponse } from "./types";

const jsonFetcher = async <T,>(url: string): Promise<T> => {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  return (await res.json()) as T;
};

export function useScheduleData() {
  return useSWR<ScheduleResponse>("/api/get-schedule", (url) => jsonFetcher<ScheduleResponse>(url), {
    refreshInterval: 120_000,
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
    dedupingInterval: 60_000,
    errorRetryCount: 2,
    errorRetryInterval: 2_000,
    keepPreviousData: true,
  });
}

export function useGroupsData() {
  return useSWR<GroupsResponse>("/api/get-groups", (url) => jsonFetcher<GroupsResponse>(url), {
    refreshInterval: 300_000,
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
    dedupingInterval: 120_000,
    errorRetryCount: 1,
    errorRetryInterval: 3_000,
    keepPreviousData: true,
  });
}


