import { useEffect, useRef, useState } from "react";

/** Series colors resolve through the CSS roles declared in app.css (.viz-root). */
export const SERIES_1 = "var(--viz-series-1)";
export const SERIES_2 = "var(--viz-series-2)";

/** Measures a container so the SVG can render at real pixel width (no viewBox distortion). */
export function useMeasure<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) setWidth(entry.contentRect.width);
    });
    observer.observe(el);
    setWidth(el.getBoundingClientRect().width);
    return () => observer.disconnect();
  }, []);

  return [ref, width] as const;
}

/**
 * Axis ticks rounded to clean 1/2/5 x 10^n numbers.
 * The top tick always covers `max`, so no mark is ever drawn above the
 * highest gridline and out of the plot area.
 */
export function niceTicks(max: number, count = 4): number[] {
  if (!isFinite(max) || max <= 0) return [0];
  const rawStep = max / count;
  const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep)));
  const normalized = rawStep / magnitude;
  const step = (normalized < 1.5 ? 1 : normalized < 3 ? 2 : normalized < 7 ? 5 : 10) * magnitude;
  const top = Math.ceil(max / step - 1e-9) * step;

  const ticks: number[] = [];
  for (let i = 0; i * step <= top + step * 1e-9; i++) {
    // Multiply rather than accumulate so 0.1-steps don't drift.
    ticks.push(Number((i * step).toPrecision(12)));
  }
  return ticks;
}

/** Compact axis/label formatting: 1284 -> 1,284 and 12900 -> 12.9K. */
export function formatCompact(value: number, digits = 1): string {
  if (Math.abs(value) >= 1000) {
    return `${Number((value / 1000).toFixed(digits))}K`;
  }
  return Number(value.toFixed(digits)).toLocaleString();
}

/**
 * A bar with a rounded data-end and a square baseline end, per the mark spec.
 * `orientation` says which end grows away from the baseline.
 */
export function barPath(
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
  orientation: "horizontal" | "vertical" = "horizontal",
): string {
  if (width <= 0 || height <= 0) return "";

  if (orientation === "horizontal") {
    const r = Math.min(radius, width, height / 2);
    if (r <= 0) return `M${x},${y} h${width} v${height} h${-width} Z`;
    return [
      `M${x},${y}`,
      `H${x + width - r}`,
      `A${r},${r} 0 0 1 ${x + width},${y + r}`,
      `V${y + height - r}`,
      `A${r},${r} 0 0 1 ${x + width - r},${y + height}`,
      `H${x}`,
      "Z",
    ].join(" ");
  }

  const r = Math.min(radius, height, width / 2);
  if (r <= 0) return `M${x},${y} h${width} v${height} h${-width} Z`;
  return [
    `M${x},${y + r}`,
    `A${r},${r} 0 0 1 ${x + r},${y}`,
    `H${x + width - r}`,
    `A${r},${r} 0 0 1 ${x + width},${y + r}`,
    `V${y + height}`,
    `H${x}`,
    "Z",
  ].join(" ");
}
