import { useState, type ReactNode } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Chart01Icon, Table01Icon } from "@hugeicons/core-free-icons";
import { cn } from "~/lib/utils";

export interface TableView {
  columns: string[];
  rows: (string | number)[][];
}

interface ChartCardProps {
  title: string;
  subtitle?: string;
  /** The WCAG-clean twin. Every chart ships one — tooltips enhance, they never gate. */
  table: TableView;
  children: ReactNode;
  className?: string;
  /** Held at reduced opacity during refetch — no skeleton flash, no layout jump. */
  refreshing?: boolean;
}

export function ChartCard({ title, subtitle, table, children, className, refreshing }: ChartCardProps) {
  const [showTable, setShowTable] = useState(false);

  return (
    <div
      className={cn(
        "viz-root bg-white/70 dark:bg-white/[0.03] backdrop-blur-xl border border-zinc-200 dark:border-white/[0.08] rounded-2xl p-6 shadow-sm",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h3 className="font-bold text-base text-zinc-900 dark:text-white">{title}</h3>
          {subtitle && <p className="text-xs text-zinc-500 mt-0.5">{subtitle}</p>}
        </div>
        <button
          type="button"
          onClick={() => setShowTable((v) => !v)}
          aria-pressed={showTable}
          className="shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-white/10 text-[10px] font-bold uppercase tracking-wider text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/5 transition-colors"
        >
          <HugeiconsIcon icon={showTable ? Chart01Icon : Table01Icon} className="size-3.5" />
          {showTable ? "Chart" : "Table"}
        </button>
      </div>

      <div className={cn("transition-opacity duration-200", refreshing && "opacity-50")}>
        {showTable ? (
          <div className="overflow-x-auto max-h-[320px] overflow-y-auto">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-sm">
                <tr className="border-b border-zinc-200 dark:border-white/10">
                  {table.columns.map((column) => (
                    <th
                      key={column}
                      className="py-2 pr-4 text-[10px] font-bold uppercase tracking-wider text-zinc-500 whitespace-nowrap"
                    >
                      {column}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {table.rows.length === 0 ? (
                  <tr>
                    <td colSpan={table.columns.length} className="py-8 text-center text-xs text-zinc-500">
                      No data in this range
                    </td>
                  </tr>
                ) : (
                  table.rows.map((row, i) => (
                    <tr key={i} className="border-b border-zinc-100 dark:border-white/5 last:border-0">
                      {row.map((cell, j) => (
                        <td
                          key={j}
                          className={cn(
                            "py-2 pr-4 text-xs whitespace-nowrap",
                            j === 0 ? "text-zinc-500" : "text-zinc-900 dark:text-white font-medium",
                          )}
                          style={j === 0 ? undefined : { fontVariantNumeric: "tabular-nums" }}
                        >
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  );
}
