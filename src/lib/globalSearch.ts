import { format } from "date-fns";
import type { UserProfile } from "./firestore/users";
import type { WasteEntry } from "./firestore/wasteEntries";

export type SearchResultKind = "page" | "user" | "establishment" | "entry";

export interface SearchResult {
  id: string;
  kind: SearchResultKind;
  title: string;
  subtitle: string;
  /** Route (with query params) the result navigates to. */
  url: string;
  /** Fields the query is matched against. */
  keywords: string[];
}

export const SEARCH_KIND_LABELS: Record<SearchResultKind, string> = {
  page: "Pages",
  user: "Users",
  establishment: "Establishments",
  entry: "Waste Entries",
};

/** Static destinations, always searchable without hitting Firestore. */
export const PAGE_RESULTS: SearchResult[] = [
  {
    id: "page:dashboard",
    kind: "page",
    title: "Dashboard",
    subtitle: "Control center overview",
    url: "/dashboard",
    keywords: ["dashboard", "home", "overview", "stats", "charts"],
  },
  {
    id: "page:users",
    kind: "page",
    title: "Users",
    subtitle: "Registered accounts and permissions",
    url: "/users",
    keywords: ["users", "accounts", "people", "admins", "permissions", "roles"],
  },
  {
    id: "page:waste-entries",
    kind: "page",
    title: "Waste Entries",
    subtitle: "Disposal logs across the system",
    url: "/waste-entries",
    keywords: ["waste", "entries", "logs", "disposal", "devices"],
  },
  {
    id: "page:reports",
    kind: "page",
    title: "Reports",
    subtitle: "Generated analytics and exports",
    url: "/reports",
    keywords: ["reports", "analytics", "export", "summary"],
  },
  {
    id: "page:settings",
    kind: "page",
    title: "Settings",
    subtitle: "Administrator account and credentials",
    url: "/settings",
    keywords: ["settings", "account", "credentials", "password", "email", "profile"],
  },
];

/** Rank bump so a page beats an individual log line at equal text relevance. */
const KIND_WEIGHT: Record<SearchResultKind, number> = {
  page: 12,
  user: 8,
  establishment: 6,
  entry: 2,
};

const WORD_BOUNDARY = /[\s@._\-/,:]/;

export const displayName = (user: UserProfile): string =>
  `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
  user.displayName ||
  user.email ||
  user.uid;

/**
 * Scores a single field: exact > prefix > word-start > loose substring.
 * Returns 0 when the query is absent from the field.
 */
const scoreField = (field: string, query: string): number => {
  const value = field.toLowerCase();
  if (!value) return 0;

  const index = value.indexOf(query);
  if (index === -1) return 0;
  if (index === 0) return value.length === query.length ? 100 : 80;
  if (WORD_BOUNDARY.test(value.charAt(index - 1))) return 60;
  return 30;
};

const scoreResult = (result: SearchResult, query: string): number => {
  let best = 0;
  for (const keyword of result.keywords) {
    const score = scoreField(keyword, query);
    if (score > best) best = score;
  }
  return best === 0 ? 0 : best + KIND_WEIGHT[result.kind];
};

/** Groups establishment users by name + address, mirroring the Users page. */
const buildEstablishmentResults = (users: UserProfile[]): SearchResult[] => {
  const map = new Map<string, { name: string; address: string; members: UserProfile[] }>();

  users
    .filter((user) => !user.isIndividual)
    .forEach((user) => {
      const name = user.establishmentName || "Unnamed Establishment";
      const address = user.establishmentAddress || "No address provided";
      const key = `${name}::${address}`;
      const existing = map.get(key);

      if (existing) {
        existing.members.push(user);
      } else {
        map.set(key, { name, address, members: [user] });
      }
    });

  return Array.from(map.entries()).map(([key, establishment]) => ({
    id: `establishment:${key}`,
    kind: "establishment" as const,
    title: establishment.name,
    subtitle: `${establishment.address} · ${establishment.members.length} linked user${
      establishment.members.length === 1 ? "" : "s"
    }`,
    url: `/users?est=${encodeURIComponent(establishment.name)}`,
    keywords: [
      establishment.name,
      establishment.address,
      ...establishment.members.map(displayName),
      ...establishment.members.map((member) => member.email),
    ],
  }));
};

const buildUserResults = (users: UserProfile[]): SearchResult[] =>
  users.map((user) => {
    const name = displayName(user);
    return {
      id: `user:${user.uid}`,
      kind: "user" as const,
      title: name,
      subtitle: `${user.email || "No email"} · ${user.role}`,
      url: `/users?uid=${encodeURIComponent(user.uid)}&q=${encodeURIComponent(user.email || name)}`,
      keywords: [
        name,
        user.email,
        user.uid,
        user.displayName || "",
        user.establishmentName || "",
        user.role,
        user.isIndividual ? "individual" : "establishment",
      ].filter(Boolean),
    };
  });

const buildEntryResults = (entries: WasteEntry[], users: UserProfile[]): SearchResult[] => {
  const usersByUid = new Map(users.map((user) => [user.uid, user]));

  return entries
    .filter((entry) => Boolean(entry.userId))
    .map((entry) => {
      const owner = entry.userId ? usersByUid.get(entry.userId) : undefined;
      const ownerName = owner ? displayName(owner) : "Unknown user";
      const stamp = format(entry.timestamp, "MMM dd, yyyy HH:mm");

      return {
        id: `entry:${entry.userId}:${entry.id}`,
        kind: "entry" as const,
        title: `${entry.weightAdded.toFixed(2)} kg`,
        subtitle: `${ownerName} · ${stamp}`,
        url: `/waste-entries?uid=${encodeURIComponent(entry.userId!)}`,
        keywords: [ownerName, owner?.email || "", stamp, entry.id].filter(Boolean),
      };
    });
};

/**
 * Flattens users, establishments and waste entries into one searchable list,
 * with the static pages always first.
 */
export const buildSearchIndex = (users: UserProfile[], entries: WasteEntry[]): SearchResult[] => [
  ...PAGE_RESULTS,
  ...buildUserResults(users),
  ...buildEstablishmentResults(users),
  ...buildEntryResults(entries, users),
];

/** Returns the best matches for `query`, highest score first. */
export const searchIndex = (
  index: SearchResult[],
  query: string,
  limit = 8,
): SearchResult[] => {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return [];

  return index
    .map((result) => ({ result, score: scoreResult(result, normalized) }))
    .filter((scored) => scored.score > 0)
    .sort((a, b) => b.score - a.score || a.result.title.localeCompare(b.result.title))
    .slice(0, limit)
    .map((scored) => scored.result);
};

/** Preserves index order (pages, users, establishments, entries) inside each group. */
export const groupResults = (results: SearchResult[]): Array<[SearchResultKind, SearchResult[]]> => {
  const groups = new Map<SearchResultKind, SearchResult[]>();

  results.forEach((result) => {
    const existing = groups.get(result.kind);
    if (existing) {
      existing.push(result);
    } else {
      groups.set(result.kind, [result]);
    }
  });

  return Array.from(groups.entries());
};
