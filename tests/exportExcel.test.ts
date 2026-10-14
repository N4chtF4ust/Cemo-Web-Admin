import { describe, it, expect } from "vitest";
import {
  buildUsersWorkbook,
  buildReportsWorkbook,
  autoFitColumns,
  formatDateSafe,
} from "../src/lib/exportExcel";
import { UserRole, type UserProfile } from "../src/lib/firestore/users";
import type { WasteEntry } from "../src/lib/firestore/wasteEntries";

const makeUser = (overrides: Partial<UserProfile> = {}): UserProfile => ({
  uid: "uid-001",
  email: "maria@cemo.tech",
  displayName: "Maria Santos",
  firstName: "Maria",
  lastName: "Santos",
  photoUrl: null,
  role: UserRole.USER,
  isIndividual: true,
  establishmentName: null,
  establishmentAddress: null,
  createdAt: new Date("2026-01-15T08:30:00Z"),
  updatedAt: new Date("2026-02-10T12:00:00Z"),
  ...overrides,
});

const makeEntry = (overrides: Partial<WasteEntry> = {}): WasteEntry => ({
  id: "entry-001",
  weightAdded: 5.75,
  timestamp: new Date("2026-03-01T09:00:00Z"),
  temperature: 24.5,
  humidity: 55,
  userId: "uid-001",
  ...overrides,
});

describe("exportExcel", () => {
  it("formats dates safely without throwing on null or invalid dates", () => {
    expect(formatDateSafe(null)).toBe("");
    expect(formatDateSafe(undefined)).toBe("");
    expect(formatDateSafe("invalid-date-string")).toBe("");
    expect(formatDateSafe(new Date("2026-03-01T10:00:00Z"))).toContain("2026-03-01");
  });

  it("calculates auto-fit column widths based on longest string", () => {
    const rows = [
      { Name: "Short", Note: "This is a much longer value that should widen the column" },
    ];
    const cols = autoFitColumns(rows);
    expect(cols).toHaveLength(2);
    expect(cols[1].wch).toBeGreaterThan(cols[0].wch);
  });

  it("builds a Users workbook with correct sheet name and columns", () => {
    const users = [
      makeUser({ uid: "u1", firstName: "Maria", lastName: "Santos" }),
      makeUser({
        uid: "u2",
        email: "cafe@green.org",
        isIndividual: false,
        establishmentName: "Green Cafe",
        establishmentAddress: "123 Solar Ave",
      }),
    ];

    const wb = buildUsersWorkbook(users);
    expect(wb.SheetNames).toContain("Users");

    const sheet = wb.Sheets["Users"];
    expect(sheet).toBeDefined();
    // Headers exist
    expect(sheet["A1"]?.v).toBe("User ID");
    expect(sheet["B1"]?.v).toBe("Full Name");
    expect(sheet["F1"]?.v).toBe("Email Address");
    expect(sheet["H1"]?.v).toBe("Account Type");
  });

  it("builds a Reports workbook with 4 structured sheets", () => {
    const user = makeUser();
    const entry = makeEntry();

    const wb = buildReportsWorkbook({
      buckets: [
        {
          start: new Date("2026-03-01"),
          short: "Mar 1",
          full: "Sun, Mar 1, 2026",
          individual: 5.75,
          establishment: 0,
          temps: [24.5],
          humidities: [55],
          entries: 1,
        },
      ],
      scopedEntries: [entry],
      users: [user],
      rangeLabel: "Last 30 days",
      accountFilter: "all",
      stats: {
        totalWeight: "5.8",
        entryCount: 1,
        contributors: 1,
        avgWeight: "5.75",
      },
    });

    expect(wb.SheetNames).toEqual([
      "Summary",
      "Timeline & Trends",
      "Contributors",
      "Raw Entries",
    ]);

    expect(wb.Sheets["Summary"]["A1"]?.v).toBe("Metric");
    expect(wb.Sheets["Timeline & Trends"]["A1"]?.v).toBe("Time Period");
    expect(wb.Sheets["Contributors"]["A1"]?.v).toBe("Contributor Name");
    expect(wb.Sheets["Raw Entries"]["A1"]?.v).toBe("Entry ID");
  });
});
