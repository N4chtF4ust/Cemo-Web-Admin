import { describe, it, expect } from "vitest";
import { niceTicks, formatCompact, barPath } from "../src/components/dashboard/charts/chartUtils";

describe("niceTicks", () => {
  it("rounds to clean 1/2/5 steps and always starts at zero", () => {
    expect(niceTicks(9.4)).toEqual([0, 2, 4, 6, 8, 10]);
    expect(niceTicks(1000)).toEqual([0, 200, 400, 600, 800, 1000]);
    expect(niceTicks(0.3)).toEqual([0, 0.1, 0.2, 0.3]);
  });

  it("covers the max value so no mark is drawn above the top gridline", () => {
    for (const max of [0.3, 3.7, 12.5, 87, 240, 1999]) {
      const ticks = niceTicks(max);
      expect(ticks[ticks.length - 1]).toBeGreaterThanOrEqual(max);
    }
  });

  it("degrades safely when there is no data", () => {
    expect(niceTicks(0)).toEqual([0]);
    expect(niceTicks(Number.NaN)).toEqual([0]);
  });
});

describe("formatCompact", () => {
  it("thousands-separates below 1K and compacts above it", () => {
    expect(formatCompact(0)).toBe("0");
    expect(formatCompact(847.5)).toBe("847.5");
    expect(formatCompact(12900)).toBe("12.9K");
  });
});

describe("barPath", () => {
  it("rounds only the data-end and keeps the baseline square", () => {
    const path = barPath(0, 0, 100, 20, 4, "horizontal");
    // Two arcs at the growing end, none at the baseline.
    expect(path.match(/A/g)).toHaveLength(2);
    expect(path.startsWith("M0,0")).toBe(true);
  });

  it("never emits geometry for a zero-length bar", () => {
    expect(barPath(0, 0, 0, 20, 4)).toBe("");
  });

  it("clamps the radius so a short bar cannot invert its own corners", () => {
    const path = barPath(0, 0, 2, 20, 4, "horizontal");
    expect(path).toContain("A2,2");
  });
});
