import { describe, it, expect } from "vitest";
import {
  buildSearchIndex,
  filterSearchIndexByRole,
  groupResults,
  searchIndex,
  PAGE_RESULTS,
} from "../src/lib/globalSearch";
import { UserRole, type UserProfile } from "../src/lib/firestore/users";
import type { WasteEntry } from "../src/lib/firestore/wasteEntries";

const makeUser = (overrides: Partial<UserProfile> = {}): UserProfile => ({
  uid: "uid-1",
  email: "ada@cemo.tech",
  displayName: "Ada L",
  firstName: "Ada",
  lastName: "Lovelace",
  photoUrl: null,
  role: UserRole.USER,
  isIndividual: true,
  establishmentName: null,
  establishmentAddress: null,
  createdAt: new Date("2026-01-01"),
  updatedAt: new Date("2026-01-01"),
  ...overrides,
});

const makeEntry = (overrides: Partial<WasteEntry> = {}): WasteEntry => ({
  id: "entry-1",
  weightAdded: 2.5,
  timestamp: new Date("2026-03-04T10:30:00"),
  humidity: 40,
  temperature: 22,
  userId: "uid-1",
  ...overrides,
});

describe("globalSearch", () => {
  it("returns nothing for an empty query", () => {
    const index = buildSearchIndex([makeUser()], [makeEntry()]);
    expect(searchIndex(index, "")).toEqual([]);
    expect(searchIndex(index, "   ")).toEqual([]);
  });

  it("finds pages without any Firestore data", () => {
    const results = searchIndex(buildSearchIndex([], []), "report");
    expect(results[0].kind).toBe("page");
    expect(results[0].url).toBe("/reports");
  });

  it("matches users by name, email and uid", () => {
    const index = buildSearchIndex([makeUser({ uid: "abc123xyz" })], []);

    expect(searchIndex(index, "lovelace")[0].title).toBe("Ada Lovelace");
    expect(searchIndex(index, "ada@cemo")[0].title).toBe("Ada Lovelace");
    expect(searchIndex(index, "abc123xyz")[0].title).toBe("Ada Lovelace");
  });

  it("links a user result to the users page with a deep link", () => {
    const index = buildSearchIndex([makeUser({ uid: "uid-9" })], []);
    const [result] = searchIndex(index, "lovelace");

    expect(result.url).toContain("/users?uid=uid-9");
    expect(result.url).toContain("q=ada%40cemo.tech");
  });

  it("groups establishment users into a single result", () => {
    const users = [
      makeUser({
        uid: "e1",
        email: "one@green.co",
        isIndividual: false,
        establishmentName: "Green Cafe",
        establishmentAddress: "12 Palm St",
      }),
      makeUser({
        uid: "e2",
        email: "two@green.co",
        isIndividual: false,
        establishmentName: "Green Cafe",
        establishmentAddress: "12 Palm St",
      }),
    ];

    const establishments = searchIndex(buildSearchIndex(users, []), "green cafe").filter(
      (result) => result.kind === "establishment",
    );

    expect(establishments).toHaveLength(1);
    expect(establishments[0].subtitle).toContain("2 linked users");
    expect(establishments[0].url).toBe("/users?est=Green%20Cafe");
  });

  it("matches waste entries by owner and by date", () => {
    const index = buildSearchIndex([makeUser()], [makeEntry()]);

    const byOwner = searchIndex(index, "lovelace").filter((r) => r.kind === "entry");
    expect(byOwner).toHaveLength(1);
    expect(byOwner[0].title).toBe("2.50 kg");
    expect(byOwner[0].subtitle).toContain("Ada Lovelace");
    expect(byOwner[0].url).toBe("/waste-entries?uid=uid-1");

    expect(searchIndex(index, "mar 04, 2026").filter((r) => r.kind === "entry")).toHaveLength(1);
  });

  it("skips entries with no owning user", () => {
    const index = buildSearchIndex([makeUser()], [makeEntry({ userId: undefined })]);
    expect(searchIndex(index, "lovelace").filter((r) => r.kind === "entry")).toEqual([]);
  });

  it("ranks prefix matches above mid-word matches", () => {
    const users = [
      makeUser({ uid: "u1", firstName: "Mark", lastName: "Reyes", email: "mark@cemo.tech" }),
      makeUser({ uid: "u2", firstName: "Demarco", lastName: "Cruz", email: "demarco@cemo.tech" }),
    ];

    const [first, second] = searchIndex(buildSearchIndex(users, []), "mar").filter(
      (result) => result.kind === "user",
    );
    expect(first.title).toBe("Mark Reyes");
    expect(second.title).toBe("Demarco Cruz");
  });

  it("ranks a page above another record at identical text relevance", () => {
    const rival = makeUser({
      uid: "e9",
      isIndividual: false,
      establishmentName: "Reports",
      establishmentAddress: "1 Market St",
    });

    const results = searchIndex(buildSearchIndex([rival], []), "reports");
    expect(results[0].kind).toBe("page");
    expect(results.some((result) => result.kind === "establishment")).toBe(true);
  });

  it("honours the result limit", () => {
    const users = Array.from({ length: 20 }, (_, i) =>
      makeUser({ uid: `uid-${i}`, firstName: "Test", lastName: `User${i}`, email: `t${i}@cemo.tech` }),
    );

    expect(searchIndex(buildSearchIndex(users, []), "test")).toHaveLength(8);
    expect(searchIndex(buildSearchIndex(users, []), "test", 3)).toHaveLength(3);
  });

  it("is case insensitive", () => {
    const index = buildSearchIndex([makeUser()], []);
    expect(searchIndex(index, "ADA")).toHaveLength(searchIndex(index, "ada").length);
  });

  it("groups results by kind while preserving order", () => {
    const users = [makeUser()];
    const results = searchIndex(buildSearchIndex(users, [makeEntry()]), "ada");
    const groups = groupResults(results);

    expect(groups.length).toBeGreaterThan(0);
    expect(groups.flatMap(([, items]) => items)).toHaveLength(results.length);
  });

  it("always includes every page in the index", () => {
    const index = buildSearchIndex([], []);
    expect(index.slice(0, PAGE_RESULTS.length)).toEqual(PAGE_RESULTS);
  });

  it("retains all results when filtering index for ADMIN role", () => {
    const users = [
      makeUser({ uid: "u1", firstName: "Alice" }),
      makeUser({ uid: "u2", isIndividual: false, establishmentName: "Cafe" }),
    ];
    const index = buildSearchIndex(users, [makeEntry()]);
    const filtered = filterSearchIndexByRole(index, UserRole.ADMIN);
    expect(filtered.length).toBe(index.length);
  });

  it("excludes /users, /reports, user results, and establishment results for STAFF role", () => {
    const users = [
      makeUser({ uid: "u1", firstName: "Alice" }),
      makeUser({ uid: "u2", isIndividual: false, establishmentName: "Cafe" }),
    ];
    const index = buildSearchIndex(users, [makeEntry()]);
    const filtered = filterSearchIndexByRole(index, UserRole.STAFF);

    // No user kind results
    expect(filtered.some((r) => r.kind === "user")).toBe(false);
    // No URLs pointing to /users or /reports
    expect(filtered.some((r) => r.url.startsWith("/users"))).toBe(false);
    expect(filtered.some((r) => r.url.startsWith("/reports"))).toBe(false);
    // Accessible pages and entries should remain
    expect(filtered.some((r) => r.url === "/dashboard")).toBe(true);
    expect(filtered.some((r) => r.url === "/waste-entries")).toBe(true);
    expect(filtered.some((r) => r.kind === "entry")).toBe(true);
  });
});
