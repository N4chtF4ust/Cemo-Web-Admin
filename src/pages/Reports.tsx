import { useEffect, useMemo, useState } from "react";
import { format, startOfDay, startOfWeek, differenceInCalendarDays } from "date-fns";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  DatabaseIcon,
  Note01Icon,
  UserGroupIcon,
  WeightScaleIcon,
  ThermometerIcon,
  DropletIcon,
  Refresh01Icon,
  AlertCircleIcon,
} from "@hugeicons/core-free-icons";
import { DashboardLayout } from "~/components/dashboard/DashboardLayout";
import { StatsCard } from "~/components/dashboard/Stats";
import { ChartCard } from "~/components/dashboard/charts/ChartCard";
import { LineChart } from "~/components/dashboard/charts/LineChart";
import { BarChart, type BarDatum } from "~/components/dashboard/charts/BarChart";
import { SERIES_1, SERIES_2 } from "~/components/dashboard/charts/chartUtils";
import { Button } from "~/components/ui/button";
import { Skeleton } from "~/components/ui/skeleton";
import { getAllWasteEntries, type WasteEntry } from "~/lib/firestore/wasteEntries";
import { getUsers, type UserProfile } from "~/lib/firestore/users";
import { cn } from "~/lib/utils";

const RANGES = [
  { key: "7", label: "Last 7 days", days: 7 },
  { key: "30", label: "Last 30 days", days: 30 },
  { key: "90", label: "Last 90 days", days: 90 },
  { key: "all", label: "All time", days: null as number | null },
];

interface Bucket {
  start: Date;
  short: string;
  full: string;
  individual: number;
  establishment: number;
  temps: number[];
  humidities: number[];
  entries: number;
}

export function Reports() {
  const [entries, setEntries] = useState<WasteEntry[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rangeKey, setRangeKey] = useState("30");

  const load = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const [entryData, userData] = await Promise.all([getAllWasteEntries(1000), getUsers()]);
      setEntries(entryData);
      setUsers(userData);
    } catch (err: any) {
      console.error("Reports: failed to load data", err);
      setError(err?.message || "Failed to load report data.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const activeRange = RANGES.find((r) => r.key === rangeKey) ?? RANGES[1];

  /** Entries inside the selected window. Every chart and stat below reads from this slice. */
  const scopedEntries = useMemo(() => {
    if (activeRange.days === null) return entries;
    const cutoff = startOfDay(new Date());
    cutoff.setDate(cutoff.getDate() - (activeRange.days - 1));
    return entries.filter((e) => e.timestamp >= cutoff);
  }, [entries, activeRange]);

  /** Day buckets, or week buckets once the window is too wide to label per day. */
  const { buckets, granularity } = useMemo(() => {
    if (scopedEntries.length === 0 && activeRange.days === null) {
      return { buckets: [] as Bucket[], granularity: "day" as const };
    }

    const today = startOfDay(new Date());
    let firstDay: Date;
    if (activeRange.days === null) {
      const earliest = scopedEntries.reduce(
        (min, e) => (e.timestamp < min ? e.timestamp : min),
        scopedEntries[0]?.timestamp ?? today,
      );
      firstDay = startOfDay(earliest);
    } else {
      firstDay = new Date(today);
      firstDay.setDate(firstDay.getDate() - (activeRange.days - 1));
    }

    const span = differenceInCalendarDays(today, firstDay) + 1;
    const useWeeks = span > 120;
    const keyFor = (d: Date) => (useWeeks ? startOfWeek(d) : startOfDay(d));

    const map = new Map<number, Bucket>();
    let cursor = keyFor(firstDay);
    while (cursor <= today) {
      map.set(cursor.getTime(), {
        start: new Date(cursor),
        short: useWeeks ? format(cursor, "MMM d") : format(cursor, "MMM d"),
        full: useWeeks ? `Week of ${format(cursor, "MMM d, yyyy")}` : format(cursor, "EEE, MMM d, yyyy"),
        individual: 0,
        establishment: 0,
        temps: [],
        humidities: [],
        entries: 0,
      });
      const next = new Date(cursor);
      next.setDate(next.getDate() + (useWeeks ? 7 : 1));
      cursor = next;
    }

    const establishmentUids = new Set(users.filter((u) => !u.isIndividual).map((u) => u.uid));

    scopedEntries.forEach((entry) => {
      const bucket = map.get(keyFor(entry.timestamp).getTime());
      if (!bucket) return;
      if (entry.userId && establishmentUids.has(entry.userId)) bucket.establishment += entry.weightAdded;
      else bucket.individual += entry.weightAdded;
      // A reading of exactly 0 on both means the sensor never reported; don't average it in.
      if (entry.temperature !== 0 || entry.humidity !== 0) {
        bucket.temps.push(entry.temperature);
        bucket.humidities.push(entry.humidity);
      }
      bucket.entries += 1;
    });

    return {
      buckets: Array.from(map.values()).sort((a, b) => a.start.getTime() - b.start.getTime()),
      granularity: useWeeks ? ("week" as const) : ("day" as const),
    };
  }, [scopedEntries, users, activeRange]);

  const stats = useMemo(() => {
    const totalWeight = scopedEntries.reduce((sum, e) => sum + e.weightAdded, 0);
    const contributors = new Set(scopedEntries.map((e) => e.userId).filter(Boolean)).size;
    return {
      totalWeight: totalWeight.toFixed(1),
      entryCount: scopedEntries.length,
      contributors,
      avgWeight: scopedEntries.length ? (totalWeight / scopedEntries.length).toFixed(2) : "0.00",
    };
  }, [scopedEntries]);

  const contributors = useMemo<BarDatum[]>(() => {
    const totals = new Map<string, number>();
    scopedEntries.forEach((entry) => {
      if (!entry.userId) return;
      totals.set(entry.userId, (totals.get(entry.userId) || 0) + entry.weightAdded);
    });

    return Array.from(totals.entries())
      .map(([uid, value]) => {
        const user = users.find((u) => u.uid === uid);
        const label = !user
          ? "Unknown user"
          : !user.isIndividual && user.establishmentName
            ? user.establishmentName
            : user.displayName || `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.email;
        return {
          key: uid,
          label,
          value,
          detail: user ? (user.isIndividual ? "Individual" : "Establishment") : undefined,
        };
      })
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [scopedEntries, users]);

  const labels = buckets.map((b) => b.short);
  const fullLabels = buckets.map((b) => b.full);

  const avg = (values: number[]) =>
    values.length ? values.reduce((sum, v) => sum + v, 0) / values.length : null;

  const volumeSeries = [
    { key: "individual", label: "Individual", color: SERIES_1, values: buckets.map((b) => b.individual) },
    { key: "establishment", label: "Establishment", color: SERIES_2, values: buckets.map((b) => b.establishment) },
  ];

  const tempSeries = [
    { key: "temperature", label: "Avg. temperature", color: SERIES_1, values: buckets.map((b) => avg(b.temps)) },
  ];

  const humiditySeries = [
    { key: "humidity", label: "Avg. humidity", color: SERIES_1, values: buckets.map((b) => avg(b.humidities)) },
  ];

  const bucketLabel = granularity === "week" ? "Week" : "Date";

  if (error) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
          <div className="p-4 bg-red-500/10 rounded-2xl text-red-500">
            <HugeiconsIcon icon={AlertCircleIcon} className="size-8" />
          </div>
          <div className="space-y-1">
            <p className="font-bold text-zinc-900 dark:text-white">Could not build reports</p>
            <p className="text-xs text-zinc-500 max-w-sm">{error}</p>
          </div>
          <Button variant="outline" onClick={() => load()} className="rounded-xl">
            Retry
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-1 min-w-0">
          <h2 className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-white tracking-tight">Reports</h2>
          <p className="text-zinc-500 text-sm">
            Collection volume, contributors and sensor conditions from the CEMO devices.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => load(true)}
          disabled={refreshing}
          className="rounded-xl border-zinc-200 dark:border-white/10 gap-2 w-fit"
        >
          <HugeiconsIcon icon={Refresh01Icon} className="size-4" />
          {refreshing ? "Refreshing…" : "Refresh"}
        </Button>
      </div>

      {/* One filter row, above everything it scopes */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mr-1">Range</span>
        {RANGES.map((range) => (
          <button
            key={range.key}
            type="button"
            onClick={() => setRangeKey(range.key)}
            aria-pressed={rangeKey === range.key}
            className={cn(
              "px-3 sm:px-3.5 py-1.5 rounded-xl text-[11px] sm:text-xs font-bold transition-all border whitespace-nowrap",
              rangeKey === range.key
                ? "bg-cemo-primary text-black border-cemo-primary shadow-[0_0_15px_rgba(57,255,20,0.2)]"
                : "bg-transparent text-zinc-500 border-zinc-200 dark:border-white/10 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/5",
            )}
          >
            {range.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-6 lg:space-y-8">
          <div className="grid grid-cols-2 @3xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-28 sm:h-32 rounded-2xl" />
            ))}
          </div>
          <Skeleton className="h-[360px] sm:h-[420px] rounded-2xl" />
          <div className="grid grid-cols-1 @4xl:grid-cols-2 gap-4 lg:gap-6">
            <Skeleton className="h-[320px] rounded-2xl" />
            <Skeleton className="h-[320px] rounded-2xl" />
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 @3xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
            <StatsCard title="Waste Collected (kg)" value={stats.totalWeight} icon={DatabaseIcon} className="bg-cemo-primary/5 border-cemo-primary/20" />
            <StatsCard title="Entries" value={stats.entryCount} icon={Note01Icon} />
            <StatsCard title="Contributors" value={stats.contributors} icon={UserGroupIcon} />
            <StatsCard title="Avg. per Entry (kg)" value={stats.avgWeight} icon={WeightScaleIcon} />
          </div>

          <ChartCard
            title="Waste collected over time"
            subtitle={`Kilograms per ${granularity}, split by account type.`}
            refreshing={refreshing}
            table={{
              columns: [bucketLabel, "Individual (kg)", "Establishment (kg)", "Total (kg)", "Entries"],
              rows: buckets.map((b) => [
                b.full,
                b.individual.toFixed(2),
                b.establishment.toFixed(2),
                (b.individual + b.establishment).toFixed(2),
                b.entries,
              ]),
            }}
          >
            <LineChart labels={labels} fullLabels={fullLabels} series={volumeSeries} unit="kg" height={320} digits={2} />
          </ChartCard>

          {/* Two time-series side by side need ~440px each; below that they stack. */}
          <div className="grid grid-cols-1 @4xl:grid-cols-2 gap-4 lg:gap-6">
            <ChartCard
              title="Top contributors"
              subtitle="Total kilograms logged in the selected range."
              refreshing={refreshing}
              table={{
                columns: ["Contributor", "Type", "Total (kg)"],
                rows: contributors.map((c) => [c.label, c.detail || "—", c.value.toFixed(2)]),
              }}
            >
              <BarChart data={contributors} unit="kg" digits={2} />
            </ChartCard>

            <div className="grid grid-cols-1 gap-4 lg:gap-6">
              {/* Two measures, two scales -> two charts. Never a shared second axis. */}
              <ChartCard
                title="Average temperature"
                subtitle="Degrees Celsius recorded at disposal."
                refreshing={refreshing}
                table={{
                  columns: [bucketLabel, "Avg. temperature (°C)"],
                  rows: buckets.map((b) => [b.full, avg(b.temps)?.toFixed(1) ?? "No reading"]),
                }}
              >
                <LineChart
                  labels={labels}
                  fullLabels={fullLabels}
                  series={tempSeries}
                  unit="°C"
                  area
                  height={180}
                  digits={1}
                />
              </ChartCard>

              <ChartCard
                title="Average humidity"
                subtitle="Relative humidity recorded at disposal."
                refreshing={refreshing}
                table={{
                  columns: [bucketLabel, "Avg. humidity (%)"],
                  rows: buckets.map((b) => [b.full, avg(b.humidities)?.toFixed(1) ?? "No reading"]),
                }}
              >
                <LineChart
                  labels={labels}
                  fullLabels={fullLabels}
                  series={humiditySeries}
                  unit="%"
                  area
                  height={180}
                  digits={1}
                />
              </ChartCard>
            </div>
          </div>

          <div className="flex items-start gap-3 px-1">
            <HugeiconsIcon icon={ThermometerIcon} className="size-3.5 text-zinc-400 mt-0.5 shrink-0" />
            <HugeiconsIcon icon={DropletIcon} className="size-3.5 text-zinc-400 mt-0.5 shrink-0 -ml-2" />
            <p className="text-[11px] text-zinc-500 leading-relaxed">
              Sensor averages skip entries where both temperature and humidity were logged as 0 — the app records
              those when the device was not connected at disposal time, so counting them would drag the averages down.
            </p>
          </div>
        </>
      )}
    </DashboardLayout>
  );
}

export default Reports;
