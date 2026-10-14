import * as XLSX from "xlsx";
import { format } from "date-fns";
import type { UserProfile } from "./firestore/users";
import type { WasteEntry } from "./firestore/wasteEntries";
import { displayName } from "./globalSearch";

export const formatDateSafe = (date?: Date | string | number | null): string => {
  if (!date) return "";
  try {
    const d = date instanceof Date ? date : new Date(date);
    return isNaN(d.getTime()) ? "" : format(d, "yyyy-MM-dd HH:mm:ss");
  } catch {
    return "";
  }
};

/** Calculates reasonable column widths based on content lengths. */
export const autoFitColumns = (data: Record<string, any>[]): { wch: number }[] => {
  if (!data.length) return [];
  const keys = Object.keys(data[0]);
  return keys.map((key) => {
    let maxLen = key.length;
    for (const row of data) {
      const val = row[key];
      const str = val !== null && val !== undefined ? String(val) : "";
      if (str.length > maxLen) {
        maxLen = Math.min(str.length, 50);
      }
    }
    return { wch: Math.max(maxLen + 3, 10) };
  });
};

/** Downloads the Excel workbook in browser environments. */
export const downloadWorkbook = (wb: XLSX.WorkBook, filename: string): void => {
  if (typeof window !== "undefined" && typeof document !== "undefined") {
    XLSX.writeFile(wb, filename);
  }
};

/**
 * Builds an Excel workbook for the Users dataset.
 */
export const buildUsersWorkbook = (users: UserProfile[]): XLSX.WorkBook => {
  const wb = XLSX.utils.book_new();

  const rows = users.map((u) => {
    const fullName = `${u.firstName || ""} ${u.lastName || ""}`.trim() || u.displayName || "N/A";
    return {
      "User ID": u.uid,
      "Full Name": fullName,
      "First Name": u.firstName || "",
      "Last Name": u.lastName || "",
      "Display Name": u.displayName || "",
      "Email Address": u.email,
      "Role": u.role,
      "Account Type": u.isIndividual ? "Individual" : "Establishment",
      "Establishment Name": u.establishmentName || "N/A",
      "Establishment Address": u.establishmentAddress || "N/A",
      "Registered Date": formatDateSafe(u.createdAt),
      "Last Updated": formatDateSafe(u.updatedAt),
    };
  });

  const ws = XLSX.utils.json_to_sheet(rows);
  ws["!cols"] = autoFitColumns(rows);
  XLSX.utils.book_append_sheet(wb, ws, "Users");

  return wb;
};

/**
 * Exports user records to an Excel file and triggers a browser download.
 */
export const exportUsersToExcel = (users: UserProfile[], filename?: string): void => {
  const name = filename || `cemo_users_${format(new Date(), "yyyy-MM-dd")}.xlsx`;
  const wb = buildUsersWorkbook(users);
  downloadWorkbook(wb, name);
};

export interface ReportsExportBucket {
  start: Date;
  short: string;
  full: string;
  individual: number;
  establishment: number;
  temps: number[];
  humidities: number[];
  entries: number;
}

export interface ReportsExportData {
  buckets: ReportsExportBucket[];
  scopedEntries: WasteEntry[];
  users: UserProfile[];
  rangeLabel: string;
  accountFilter: string;
  stats: {
    totalWeight: string;
    entryCount: number;
    contributors: number;
    avgWeight: string;
  };
}

/**
 * Builds a multi-sheet Excel workbook for analytics and reports.
 */
export const buildReportsWorkbook = (data: ReportsExportData): XLSX.WorkBook => {
  const wb = XLSX.utils.book_new();
  const usersByUid = new Map(data.users.map((u) => [u.uid, u]));

  // Sheet 1: Overview Summary
  const summaryRows = [
    { Metric: "Report Generated At", Value: formatDateSafe(new Date()) },
    { Metric: "Date Range Window", Value: data.rangeLabel },
    { Metric: "Account Filter", Value: data.accountFilter.toUpperCase() },
    { Metric: "Total Waste Collected (kg)", Value: Number(data.stats.totalWeight) },
    { Metric: "Total Entries Logged", Value: data.stats.entryCount },
    { Metric: "Active Contributors", Value: data.stats.contributors },
    { Metric: "Average Weight Per Entry (kg)", Value: Number(data.stats.avgWeight) },
  ];
  const wsSummary = XLSX.utils.json_to_sheet(summaryRows);
  wsSummary["!cols"] = autoFitColumns(summaryRows);
  XLSX.utils.book_append_sheet(wb, wsSummary, "Summary");

  // Sheet 2: Periodic Trends (Buckets)
  const calcAvg = (vals: number[]) => (vals.length ? Number((vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1)) : "N/A");

  const trendRows = data.buckets.map((b) => ({
    "Time Period": b.full,
    "Individual Waste (kg)": Number(b.individual.toFixed(2)),
    "Establishment Waste (kg)": Number(b.establishment.toFixed(2)),
    "Total Waste (kg)": Number((b.individual + b.establishment).toFixed(2)),
    "Avg Temperature (°C)": calcAvg(b.temps),
    "Avg Humidity (%)": calcAvg(b.humidities),
    "Entries Logged": b.entries,
  }));
  const wsTrends = XLSX.utils.json_to_sheet(trendRows);
  wsTrends["!cols"] = autoFitColumns(trendRows);
  XLSX.utils.book_append_sheet(wb, wsTrends, "Timeline & Trends");

  // Sheet 3: Contributors breakdown
  const contributorMap = new Map<string, { weight: number; count: number }>();
  data.scopedEntries.forEach((entry) => {
    if (!entry.userId) return;
    const existing = contributorMap.get(entry.userId) || { weight: 0, count: 0 };
    existing.weight += entry.weightAdded;
    existing.count += 1;
    contributorMap.set(entry.userId, existing);
  });

  const contributorRows = Array.from(contributorMap.entries())
    .map(([uid, stats]) => {
      const u = usersByUid.get(uid);
      const name = u
        ? (!u.isIndividual && u.establishmentName
            ? u.establishmentName
            : displayName(u))
        : "Unknown Contributor";
      return {
        "Contributor Name": name,
        "Account Type": u ? (u.isIndividual ? "Individual" : "Establishment") : "Unknown",
        "Total Waste (kg)": Number(stats.weight.toFixed(2)),
        "Total Entries": stats.count,
        "Email Address": u?.email || "N/A",
        "Establishment Address": u?.establishmentAddress || "N/A",
        "User ID": uid,
      };
    })
    .sort((a, b) => b["Total Waste (kg)"] - a["Total Waste (kg)"]);

  const wsContributors = XLSX.utils.json_to_sheet(contributorRows);
  wsContributors["!cols"] = autoFitColumns(contributorRows);
  XLSX.utils.book_append_sheet(wb, wsContributors, "Contributors");

  // Sheet 4: Raw Entries
  const rawEntryRows = data.scopedEntries.map((e) => {
    const u = e.userId ? usersByUid.get(e.userId) : undefined;
    const name = u ? displayName(u) : "Unknown Contributor";
    return {
      "Entry ID": e.id,
      "Timestamp": formatDateSafe(e.timestamp),
      "Contributor": name,
      "Account Type": u ? (u.isIndividual ? "Individual" : "Establishment") : "Unknown",
      "Establishment Name": u?.establishmentName || "N/A",
      "Weight Added (kg)": Number(e.weightAdded.toFixed(2)),
      "Temperature (°C)": e.temperature,
      "Humidity (%)": e.humidity,
      "User ID": e.userId || "N/A",
    };
  });
  const wsEntries = XLSX.utils.json_to_sheet(rawEntryRows);
  wsEntries["!cols"] = autoFitColumns(rawEntryRows);
  XLSX.utils.book_append_sheet(wb, wsEntries, "Raw Entries");

  return wb;
};

/**
 * Exports reports data to a multi-sheet Excel file and triggers a browser download.
 */
export const exportReportsToExcel = (data: ReportsExportData, filename?: string): void => {
  const name = filename || `cemo_reports_${format(new Date(), "yyyy-MM-dd")}.xlsx`;
  const wb = buildReportsWorkbook(data);
  downloadWorkbook(wb, name);
};
