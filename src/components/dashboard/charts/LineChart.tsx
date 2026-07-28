import { useMemo, useState } from "react";
import { useMeasure, niceTicks, formatCompact } from "./chartUtils";

export interface ChartSeries {
  key: string;
  label: string;
  color: string;
  /** null = no reading for that bucket; the line breaks rather than plotting a false zero. */
  values: (number | null)[];
}

interface LineChartProps {
  /** Short x-axis tick labels. */
  labels: string[];
  /** Full labels used in the tooltip readout. */
  fullLabels: string[];
  series: ChartSeries[];
  unit: string;
  /** Wash under a single series. Only legal for one series. */
  area?: boolean;
  height?: number;
  /** Decimal places for values in labels and tooltips. */
  digits?: number;
}

const PAD = { top: 16, right: 20, bottom: 30, left: 52 };

export function LineChart({
  labels,
  fullLabels,
  series,
  unit,
  area = false,
  height = 280,
  digits = 1,
}: LineChartProps) {
  const [wrapRef, width] = useMeasure<HTMLDivElement>();
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const plotWidth = Math.max(width - PAD.left - PAD.right, 0);
  const plotHeight = Math.max(height - PAD.top - PAD.bottom, 0);

  const maxValue = useMemo(() => {
    const all = series.flatMap((s) => s.values.filter((v): v is number => v !== null));
    return all.length ? Math.max(...all) : 0;
  }, [series]);

  const ticks = useMemo(() => niceTicks(maxValue), [maxValue]);
  const scaleMax = ticks[ticks.length - 1] || 1;

  const count = labels.length;
  const stepX = count > 1 ? plotWidth / (count - 1) : 0;
  const xAt = (i: number) => PAD.left + (count > 1 ? i * stepX : plotWidth / 2);
  const yAt = (v: number) => PAD.top + plotHeight - (v / scaleMax) * plotHeight;

  // Show at most ~8 x-axis ticks so labels never collide.
  const tickStride = Math.max(1, Math.ceil(count / 8));

  const handlePointer = (event: React.PointerEvent<SVGSVGElement>) => {
    if (count === 0 || plotWidth <= 0) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left - PAD.left;
    const index = count > 1 ? Math.round(x / stepX) : 0;
    setHoverIndex(Math.min(Math.max(index, 0), count - 1));
  };

  if (width === 0) {
    return <div ref={wrapRef} style={{ height }} />;
  }

  const hasData = series.some((s) => s.values.some((v) => v !== null));

  return (
    <div ref={wrapRef} className="relative">
      {series.length > 1 && (
        <div className="flex items-center gap-5 mb-4">
          {series.map((s) => (
            <div key={s.key} className="flex items-center gap-2">
              <svg width="14" height="2" aria-hidden="true">
                <line x1="0" y1="1" x2="14" y2="1" stroke={s.color} strokeWidth="2" strokeLinecap="round" />
              </svg>
              <span className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400">{s.label}</span>
            </div>
          ))}
        </div>
      )}

      <svg
        width={width}
        height={height}
        role="img"
        aria-label={`${series.map((s) => s.label).join(" and ")} over time, in ${unit}`}
        onPointerMove={handlePointer}
        onPointerLeave={() => setHoverIndex(null)}
        style={{ touchAction: "none" }}
      >
        {/* Gridlines — solid hairlines, one step off the surface */}
        {ticks.map((tick) => (
          <g key={tick}>
            <line
              x1={PAD.left}
              y1={yAt(tick)}
              x2={PAD.left + plotWidth}
              y2={yAt(tick)}
              stroke="var(--viz-grid)"
              strokeWidth="1"
            />
            <text
              x={PAD.left - 10}
              y={yAt(tick) + 4}
              textAnchor="end"
              fill="var(--viz-muted)"
              className="text-[10px]"
              style={{ fontVariantNumeric: "tabular-nums" }}
            >
              {formatCompact(tick, digits)}
            </text>
          </g>
        ))}

        {/* Baseline */}
        <line
          x1={PAD.left}
          y1={PAD.top + plotHeight}
          x2={PAD.left + plotWidth}
          y2={PAD.top + plotHeight}
          stroke="var(--viz-axis)"
          strokeWidth="1"
        />

        {/* X ticks */}
        {labels.map((label, i) =>
          i % tickStride === 0 ? (
            <text
              key={`${label}-${i}`}
              x={xAt(i)}
              y={PAD.top + plotHeight + 18}
              textAnchor="middle"
              fill="var(--viz-muted)"
              className="text-[10px]"
            >
              {label}
            </text>
          ) : null,
        )}

        {/* Crosshair sits under the marks */}
        {hoverIndex !== null && hasData && (
          <line
            x1={xAt(hoverIndex)}
            y1={PAD.top}
            x2={xAt(hoverIndex)}
            y2={PAD.top + plotHeight}
            stroke="var(--viz-axis)"
            strokeWidth="1"
          />
        )}

        {series.map((s) => {
          // Break the path wherever a bucket has no reading.
          const segments: { i: number; v: number }[][] = [];
          let current: { i: number; v: number }[] = [];
          s.values.forEach((v, i) => {
            if (v === null) {
              if (current.length) segments.push(current);
              current = [];
            } else {
              current.push({ i, v });
            }
          });
          if (current.length) segments.push(current);

          return (
            <g key={s.key}>
              {area &&
                segments.map((segment, si) => {
                  if (segment.length < 2) return null;
                  const top = segment.map((p) => `${xAt(p.i)},${yAt(p.v)}`).join(" L");
                  const baseline = PAD.top + plotHeight;
                  return (
                    <path
                      key={`area-${si}`}
                      d={`M${top} L${xAt(segment[segment.length - 1].i)},${baseline} L${xAt(segment[0].i)},${baseline} Z`}
                      fill={s.color}
                      opacity="0.1"
                    />
                  );
                })}

              {segments.map((segment, si) =>
                segment.length >= 2 ? (
                  <path
                    key={`line-${si}`}
                    d={`M${segment.map((p) => `${xAt(p.i)},${yAt(p.v)}`).join(" L")}`}
                    fill="none"
                    stroke={s.color}
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                ) : (
                  // A lone reading still deserves a mark
                  <circle
                    key={`dot-${si}`}
                    cx={xAt(segment[0].i)}
                    cy={yAt(segment[0].v)}
                    r="4"
                    fill={s.color}
                    stroke="var(--viz-surface)"
                    strokeWidth="2"
                  />
                ),
              )}
            </g>
          );
        })}

        {/* Hovered points: >=8px marker with a 2px surface ring */}
        {hoverIndex !== null &&
          series.map((s) => {
            const value = s.values[hoverIndex];
            if (value === null || value === undefined) return null;
            return (
              <circle
                key={`hover-${s.key}`}
                cx={xAt(hoverIndex)}
                cy={yAt(value)}
                r="4"
                fill={s.color}
                stroke="var(--viz-surface)"
                strokeWidth="2"
              />
            );
          })}

        {!hasData && (
          <text
            x={PAD.left + plotWidth / 2}
            y={PAD.top + plotHeight / 2}
            textAnchor="middle"
            fill="var(--viz-muted)"
            className="text-xs"
          >
            No readings in this range
          </text>
        )}
      </svg>

      {hoverIndex !== null && hasData && (
        <div
          className="pointer-events-none absolute z-20 rounded-xl border border-zinc-200 dark:border-white/10 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-sm px-3 py-2 shadow-lg"
          style={{
            left: Math.min(Math.max(xAt(hoverIndex) - 70, 0), Math.max(width - 150, 0)),
            top: 0,
            minWidth: 140,
          }}
        >
          <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1.5">
            {fullLabels[hoverIndex]}
          </p>
          {series.map((s) => {
            const value = s.values[hoverIndex];
            return (
              <div key={s.key} className="flex items-center justify-between gap-3 py-0.5">
                <span className="flex items-center gap-1.5">
                  <svg width="10" height="2" aria-hidden="true">
                    <line x1="0" y1="1" x2="10" y2="1" stroke={s.color} strokeWidth="2" strokeLinecap="round" />
                  </svg>
                  <span className="text-[11px] text-zinc-500">{s.label}</span>
                </span>
                <span
                  className="text-xs font-bold text-zinc-900 dark:text-white"
                  style={{ fontVariantNumeric: "tabular-nums" }}
                >
                  {value === null || value === undefined ? "—" : `${value.toFixed(digits)} ${unit}`}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
