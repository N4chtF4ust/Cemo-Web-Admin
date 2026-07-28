// TEMPORARY visual harness — not routed in production. Delete after review.
import { ChartCard } from "~/components/dashboard/charts/ChartCard";
import { LineChart } from "~/components/dashboard/charts/LineChart";
import { BarChart } from "~/components/dashboard/charts/BarChart";
import { SERIES_1, SERIES_2 } from "~/components/dashboard/charts/chartUtils";

const labels = Array.from({ length: 30 }, (_, i) => `Jul ${i + 1}`);
const full = labels.map((l) => `${l}, 2026`);
const individual = labels.map((_, i) => Number((2 + Math.sin(i / 3) * 1.8 + (i % 5) * 0.4).toFixed(2)));
const establishment = labels.map((_, i) => Number((5 + Math.cos(i / 4) * 3 + (i % 7) * 0.5).toFixed(2)));
const temps = labels.map((_, i) => (i % 6 === 0 ? null : Number((26 + Math.sin(i / 2) * 3).toFixed(1))));

const contributors = [
  { key: "a", label: "Sunrise Cafe & Bistro", value: 128.4, detail: "Establishment" },
  { key: "b", label: "Maria Santos", value: 96.2, detail: "Individual" },
  { key: "c", label: "Green Leaf Restaurant", value: 71.8, detail: "Establishment" },
  { key: "d", label: "Juan dela Cruz", value: 44.05, detail: "Individual" },
  { key: "e", label: "Campus Canteen", value: 21.5, detail: "Establishment" },
  { key: "f", label: "A", value: 3.2, detail: "Individual" },
];

export function ChartHarness() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black p-8 space-y-6">
      <ChartCard
        title="Waste collected over time"
        subtitle="Kilograms per day, split by account type."
        table={{ columns: ["Date", "Total"], rows: full.map((f, i) => [f, (individual[i] + establishment[i]).toFixed(2)]) }}
      >
        <LineChart
          labels={labels}
          fullLabels={full}
          series={[
            { key: "i", label: "Individual", color: SERIES_1, values: individual },
            { key: "e", label: "Establishment", color: SERIES_2, values: establishment },
          ]}
          unit="kg"
          height={320}
          digits={2}
        />
      </ChartCard>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard
          title="Top contributors"
          subtitle="Total kilograms logged in the selected range."
          table={{ columns: ["Contributor", "Total"], rows: contributors.map((c) => [c.label, c.value.toFixed(2)]) }}
        >
          <BarChart data={contributors} unit="kg" digits={2} />
        </ChartCard>

        <ChartCard
          title="Average temperature"
          subtitle="Degrees Celsius recorded at disposal."
          table={{ columns: ["Date", "Avg"], rows: full.map((f, i) => [f, temps[i]?.toFixed(1) ?? "No reading"]) }}
        >
          <LineChart
            labels={labels}
            fullLabels={full}
            series={[{ key: "t", label: "Avg. temperature", color: SERIES_1, values: temps }]}
            unit="°C"
            area
            height={180}
          />
        </ChartCard>
      </div>

      <ChartCard title="Empty state" subtitle="No data in range." table={{ columns: ["Date", "Total"], rows: [] }}>
        <LineChart
          labels={labels.slice(0, 7)}
          fullLabels={full.slice(0, 7)}
          series={[{ key: "x", label: "Waste", color: SERIES_1, values: Array(7).fill(null) }]}
          unit="kg"
          height={180}
        />
      </ChartCard>
    </div>
  );
}

export default ChartHarness;
