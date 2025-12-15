export type Job = Record<string, string | undefined> & {
  Store?: string;
  Address?: string;
  "Studio/Room"?: string;
  "Date livestream"?: string;
  "Time slot"?: string;
  "Type of session"?: string;
  "Talent 1"?: string;
  "Talent 2"?: string;
  "Coordinator 1"?: string;
  "Coordinator 2"?: string;
  host_zalo_link?: string;
  brand_zalo_link?: string;
};

export type ScheduleResponse = {
  jobs: Job[];
  dates: string[];
  sessions: string[];
  stores: string[];
};

export type GroupLink = {
  originalName: string;
  link: string;
};

export type GroupsResponse = {
  hostGroups: Record<string, GroupLink>;
  brandGroups: Record<string, GroupLink>;
  hostCount?: number;
  brandCount?: number;
};

export type ScheduleFilters = {
  dateFrom: Date | null;
  dateTo: Date | null;
  session: string;
  query: string;
};


