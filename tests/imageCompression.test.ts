import { describe, it, expect } from "vitest";
import {
  computeTargetSize,
  formatBytes,
  validateImageFile,
  MAX_UPLOAD_BYTES,
} from "../src/lib/imageCompression";

/** Minimal File stand-in: only `type` and `size` are read by the validator. */
const fakeFile = (type: string, size: number) => ({ type, size }) as File;

describe("computeTargetSize", () => {
  it("leaves images smaller than the limit untouched", () => {
    expect(computeTargetSize(320, 240, 512)).toEqual({ width: 320, height: 240 });
  });

  it("scales a landscape image by its width", () => {
    expect(computeTargetSize(2000, 1000, 512)).toEqual({ width: 512, height: 256 });
  });

  it("scales a portrait image by its height", () => {
    expect(computeTargetSize(1000, 2000, 512)).toEqual({ width: 256, height: 512 });
  });

  it("preserves the aspect ratio on odd dimensions", () => {
    const { width, height } = computeTargetSize(1920, 1080, 512);
    expect(width).toBe(512);
    expect(height).toBe(288);
    expect(Math.abs(width / height - 1920 / 1080)).toBeLessThan(0.01);
  });

  it("never returns a zero edge for extreme ratios", () => {
    const { width, height } = computeTargetSize(4000, 3, 512);
    expect(width).toBe(512);
    expect(height).toBeGreaterThanOrEqual(1);
  });

  it("treats an image exactly at the limit as already sized", () => {
    expect(computeTargetSize(512, 512, 512)).toEqual({ width: 512, height: 512 });
  });

  it("returns zeroes for degenerate input", () => {
    expect(computeTargetSize(0, 100, 512)).toEqual({ width: 0, height: 0 });
    expect(computeTargetSize(-10, 10, 512)).toEqual({ width: 0, height: 0 });
  });
});

describe("formatBytes", () => {
  it("renders each magnitude readably", () => {
    expect(formatBytes(0)).toBe("0 KB");
    expect(formatBytes(512)).toBe("512 B");
    expect(formatBytes(2048)).toBe("2 KB");
    expect(formatBytes(3 * 1024 * 1024)).toBe("3.0 MB");
  });

  it("survives invalid numbers", () => {
    expect(formatBytes(Number.NaN)).toBe("0 KB");
    expect(formatBytes(-5)).toBe("0 KB");
  });
});

describe("validateImageFile", () => {
  it("accepts ordinary images", () => {
    expect(validateImageFile(fakeFile("image/png", 1024))).toBeNull();
    expect(validateImageFile(fakeFile("image/jpeg", 500_000))).toBeNull();
    expect(validateImageFile(fakeFile("image/webp", 20_000))).toBeNull();
  });

  it("rejects non-images", () => {
    expect(validateImageFile(fakeFile("application/pdf", 1024))).toMatch(/image file/i);
    expect(validateImageFile(fakeFile("text/plain", 10))).toMatch(/image file/i);
  });

  it("rejects files above the upload ceiling", () => {
    expect(validateImageFile(fakeFile("image/png", MAX_UPLOAD_BYTES + 1))).toMatch(/under/i);
    expect(validateImageFile(fakeFile("image/png", MAX_UPLOAD_BYTES))).toBeNull();
  });
});
