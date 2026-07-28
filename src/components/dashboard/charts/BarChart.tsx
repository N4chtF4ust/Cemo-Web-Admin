import { useState } from "react";
import { useMeasure, barPath, SERIES_1 } from "./chartUtils";

export interface BarDatum {
  key: string;
  label: string;
  value: number;
  /** Secondary line shown in the tooltip only. */
  detail?: string;
}

interface BarChartProps {
  data: BarDatum[];
  unit: string;
  digits?: number;
  /** Width reserved for the category labels on the left. */
  labelWidth?: number;
}

const BAR_THICKNESS = 20; // <= 24px per the mark spec
const ROW_GAP = 14;
const HIT_MIN = 24; // hover targets are bigger than the mark

/**
 * Nominal categories, so every bar takes the same slot-1 hue — bar length
 * already encodes magnitude, and a value-ramp here would double-encode it.
 */
export function BarChart({ data, unit, digits = 1, labelWidth = 132 }: BarChartProps) {
  const [wrapRef, width] = useMeasure<HTMLDivElement>();
  const [hoverKey, setHoverKey] = useState<string | null>(null);

  const rowHeight = BAR_THICKNESS + ROW_GAP;
  const height = Math.max(data.length * rowHeight, rowHeight);
  const valueGutter = 66;
  const plotWidth = Math.max(width - labelWidth - valueGutter, 0);
  const maxValue = Math.max(...data.map((d) => d.value), 0);

  if (width === 0) {
    return <div ref={wrapRef} style={{ height }} />;
  }

  if (data.length === 0) {
    return (
      <div ref={wrapRef} className="flex items-center justify-center" style={{ height }}>
        <p className="text-xs text-zinc-500">No contributors in this range</p>
      </div>
    );
  }

  return (
    <div ref={wrapRef} className="relative">
      <svg width={width} height={height} role="img" aria-label={`Waste collected per contributor, in ${unit}`}>
        {/* Baseline the bars grow from */}
        <line x1={labelWidth} y1={0} x2={labelWidth} y2={height} stroke="var(--viz-axis)" strokeWidth="1" />

        {data.map((datum, i) => {
          const y = i * rowHeight + ROW_GAP / 2;
          const barWidth = maxValue > 0 ? (datum.value / maxValue) * plotWidth : 0;
          const isHovered = hoverKey === datum.key;
          const hitHeight = Math.max(rowHeight, HIT_MIN);

          return (
            <g
              key={datum.key}
              onPointerEnter={() => setHoverKey(datum.key)}
              onPointerLeave={() => setHoverKey(null)}
              onFocus={() => setHoverKey(datum.key)}
              onBlur={() => setHoverKey(null)}
              tabIndex={0}
              role="listitem"
              aria-label={`${datum.label}: ${datum.value.toFixed(digits)} ${unit}`}
              style={{ outline: "none", cursor: "default" }}
            >
              {/* Transparent hit area, taller than the bar */}
              <rect x={0} y={i * rowHeight + (rowHeight - hitHeight) / 2} width={width} height={hitHeight} fill="transparent" />

              <text
                x={labelWidth - 12}
                y={y + BAR_THICKNESS / 2 + 4}
                textAnchor="end"
                fill="var(--viz-ink-secondary)"
                className="text-[11px]"
              >
                {datum.label.length > 18 ? `${datum.label.slice(0, 17)}…` : datum.label}
              </text>

              <path
                d={barPath(labelWidth, y, barWidth, BAR_THICKNESS, 4, "horizontal")}
                fill={SERIES_1}
                opacity={isHovered ? 0.85 : 1}
              />

              {/* Value rides outside the bar end, so it is never clipped by a short bar */}
              <text
                x={labelWidth + barWidth + 10}
                y={y + BAR_THICKNESS / 2 + 4}
                fill="var(--viz-ink)"
                className="text-[11px] font-bold"
                style={{ fontVariantNumeric: "tabular-nums" }}
              >
                {datum.value.toFixed(digits)}
              </text>
            </g>
          );
        })}
      </svg>

      {hoverKey && (() => {
        const index = data.findIndex((d) => d.key === hoverKey);
        const datum = data[index];
        if (!datum) return null;
        return (
          <div
            className="pointer-events-none absolute z-20 rounded-xl border border-zinc-200 dark:border-white/10 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-sm px-3 py-2 shadow-lg"
            style={{ left: Math.min(labelWidth + 16, Math.max(width - 200, 0)), top: index * rowHeight - 6 }}
          >
            <p className="text-xs font-bold text-zinc-900 dark:text-white" style={{ fontVariantNumeric: "tabular-nums" }}>
              {datum.value.toFixed(digits)} {unit}
            </p>
            <p className="text-[11px] text-zinc-500">{datum.label}</p>
            {datum.detail && <p className="text-[10px] text-zinc-400 mt-0.5">{datum.detail}</p>}
          </div>
        );
      })()}
    </div>
  );
}
