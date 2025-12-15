import type { GroupLink, Job } from "./types";

// This logic is carried over from the legacy UI to preserve matching behavior,
// but rewritten to be typed and reusable.

const STORE_STOP_WORDS = new Set([
  "team",
  "livestream",
  "inhouse",
  "group",
  "brand",
  "official",
  "studio",
  "account",
  "page",
  "crew",
  "channel",
  "event",
  "agency",
]);

function normalizeNameForMatch(name?: string) {
  if (!name) return "";
  let str = String(name);
  str = str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  str = str.replace(/đ/g, "d").replace(/Đ/g, "D");
  str = str.toLowerCase();
  str = str.replace(/[^a-z\s]/g, "");
  str = str.replace(/\s+/g, " ").trim();
  return str;
}

function normalizeBrandName(name?: string) {
  if (!name) return "";
  let normalized = String(name).toLowerCase();
  normalized = normalized.replace(/\[|\]/g, "");
  normalized = normalized.replace(/\(([^)]+)\)/g, (_match, content: string) => ` ${content.replace(/\+/g, " ").trim()}`);

  normalized = normalized
    .replace(/\btts\b/g, "tiktok")
    .replace(/\bshp\b/g, "shopee")
    .replace(/\blaz\b/g, "lazada")
    .replace(/\becom\b/g, "ecommerce")
    .replace(/([a-z])tts(?![a-z])/g, "$1tiktok")
    .replace(/([a-z])shp(?![a-z])/g, "$1shopee")
    .replace(/([a-z])laz(?![a-z])/g, "$1lazada")
    .replace(/([a-z])ecom(?![a-z])/g, "$1ecommerce");

  normalized = normalized.replace(/\+/g, " ");
  normalized = normalized.replace(/&/g, " ");
  normalized = normalized.replace(/\//g, " ");
  normalized = normalized.replace(/[-|]/g, " ");
  normalized = normalized.replace(/\s+/g, " ").trim();
  return normalized;
}

function tokenize(str: string) {
  return str.split(" ").filter(Boolean);
}

function removeStopWords(tokens: string[]) {
  const filtered = tokens.filter((t) => !STORE_STOP_WORDS.has(t));
  return filtered.length ? filtered : tokens;
}

function buildCoreTokens(normalizedStr: string) {
  const tokens = tokenize(normalizedStr);
  const coreTokens = removeStopWords(tokens);
  return { tokens, coreTokens, coreName: coreTokens.join(" ") || normalizedStr };
}

function computeOverlapScore(tokensA: string[], tokensB: string[]) {
  if (!tokensA.length || !tokensB.length) return 0;
  const setB = new Set(tokensB);
  let matches = 0;
  for (const token of tokensA) if (setB.has(token)) matches++;
  return matches / Math.max(tokensA.length, tokensB.length);
}

type GroupIndexEntry = {
  key: string;
  value: GroupLink;
  keyTokens: string[];
  keyCoreTokens: string[];
  keyCoreName: string;
};

export type GroupIndex = {
  groups: Record<string, GroupLink>;
  entries: GroupIndexEntry[];
};

export function createGroupIndex(groups: Record<string, GroupLink> | undefined): GroupIndex | null {
  if (!groups) return null;

  const entries: GroupIndexEntry[] = [];
  for (const [key, value] of Object.entries(groups)) {
    if (!key) continue;
    const { tokens, coreTokens, coreName } = buildCoreTokens(key);
    entries.push({ key, value, keyTokens: tokens, keyCoreTokens: coreTokens, keyCoreName: coreName });
  }

  // Heuristic: check longer / more specific keys first to reduce false positives and allow early returns.
  entries.sort((a, b) => b.keyCoreTokens.length - a.keyCoreTokens.length || b.key.length - a.key.length);

  return { groups, entries };
}

export function findGroupLink(job: Job, groups: Record<string, GroupLink> | undefined, type: "brand" | "host") {
  if (!job || !groups || Object.keys(groups).length === 0) return null;
  return findGroupLinkWithIndex(job, createGroupIndex(groups), type);
}

export function findGroupLinkWithIndex(job: Job, index: GroupIndex | null, type: "brand" | "host") {
  if (!job || !index) return null;
  const groups = index.groups;
  const storeName = job.Store || "";
  if (!storeName) return null;

  const normalizedStore =
    type === "brand"
      ? normalizeNameForMatch(normalizeBrandName(storeName))
      : normalizeNameForMatch(storeName);

  if (groups[normalizedStore]) return groups[normalizedStore];

  const { coreTokens, coreName } = buildCoreTokens(normalizedStore);
  const candidateNames = new Set([normalizedStore, coreName].filter(Boolean));
  for (const candidate of candidateNames) {
    if (groups[candidate]) return groups[candidate];
  }

  let bestMatch: GroupLink | null = null;
  let bestScore = 0;

  const normalizedStoreTokens = tokenize(normalizedStore);

  for (const entry of index.entries) {
    if (candidateNames.has(entry.key)) return entry.value;

    if (coreName && entry.keyCoreName && coreName === entry.keyCoreName) return entry.value;

    if (entry.keyCoreTokens.length > 0) {
      const allKeyTokensInStore = entry.keyCoreTokens.every((t) => normalizedStoreTokens.includes(t));
      if (allKeyTokensInStore && entry.keyCoreTokens.length >= 2) return entry.value;
    }

    if (coreTokens.length > 0) {
      const allStoreTokensInKey = coreTokens.every((t) => entry.keyTokens.includes(t));
      if (allStoreTokensInKey && coreTokens.length >= 2) return entry.value;
    }

    if (coreName && entry.keyCoreName && (coreName.includes(entry.keyCoreName) || entry.keyCoreName.includes(coreName))) {
      bestMatch = entry.value;
      bestScore = 1;
      break;
    }

    const score = computeOverlapScore(coreTokens, entry.keyCoreTokens);
    if (score >= 0.85) return entry.value;

    if (score > bestScore && score >= 0.4) {
      bestScore = score;
      bestMatch = entry.value;
    }
  }

  return bestMatch;
}

type HostNameIndex = {
  entries: Array<{ key: string; value: GroupLink }>;
};

export function createHostNameIndex(hostGroups: Record<string, GroupLink> | undefined): HostNameIndex | null {
  if (!hostGroups) return null;
  const entries = Object.entries(hostGroups)
    .filter(([k]) => Boolean(k))
    .map(([key, value]) => ({ key, value }))
    .sort((a, b) => b.key.length - a.key.length);
  return { entries };
}

export function findHostGroupFromNamesIndex(
  hostIndex: HostNameIndex | null,
  opts?: { talentDisplay?: string; coordDisplay?: string },
) {
  if (!hostIndex) return null;
  const namesToCheck = [opts?.talentDisplay, opts?.coordDisplay].filter(Boolean) as string[];
  for (const name of namesToCheck) {
    const normalizedName = normalizeNameForMatch(name);
    for (const { key, value } of hostIndex.entries) {
      if (normalizedName.includes(key) || key.includes(normalizedName)) return value;
    }
  }
  return null;
}


