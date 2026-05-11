import { HugeiconsIcon } from "@hugeicons/react";
import { cn } from "~/lib/utils";

interface StatsCardProps {
  title: string;
  value: string | number;
  change?: string;
  icon: any;
  trend?: "up" | "down";
  className?: string;
}

export function StatsCard({ title, value, change, icon, trend, className }: StatsCardProps) {
  return (
    <div className={cn(
      "bg-white/70 dark:bg-white/[0.03] backdrop-blur-xl border border-zinc-200 dark:border-white/[0.08] rounded-2xl p-6 shadow-sm hover:shadow-md transition-all group overflow-hidden relative",
      className
    )}>
      {/* Decorative background glow */}
      <div className="absolute -right-4 -top-4 size-24 bg-cemo-primary/5 rounded-full blur-2xl group-hover:bg-cemo-primary/10 transition-colors" />
      
      <div className="flex items-start justify-between relative z-10">
        <div className="space-y-3">
          <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">{title}</p>
          <div className="space-y-1">
            <h3 className="text-3xl font-bold text-zinc-900 dark:text-white tracking-tight">{value}</h3>
            {change && (
              <p className={cn(
                "text-xs font-medium flex items-center gap-1",
                trend === "up" ? "text-cemo-primary" : "text-red-500"
              )}>
                <span>{trend === "up" ? "↑" : "↓"}</span>
                {change} from last month
              </p>
            )}
          </div>
        </div>
        <div className="p-3 bg-zinc-100 dark:bg-white/5 rounded-xl border border-zinc-200/50 dark:border-white/10 group-hover:scale-110 transition-transform">
          <HugeiconsIcon icon={icon} className="size-6 text-zinc-900 dark:text-white" />
        </div>
      </div>
    </div>
  );
}

export function RecentAlerts() {
  const alerts = [
    { id: 1, type: "error", title: "Bin #08 Full", time: "2 mins ago", description: "Waste level reached 95% at Barangay San Jose." },
    { id: 2, type: "warning", title: "Sensor Offline", time: "15 mins ago", description: "Device CEMO-IOT-42 is not responding." },
    { id: 3, type: "info", title: "Waste Spike Detected", time: "1 hour ago", description: "Unusual food waste increase in Zone B." },
  ];

  return (
    <div className="bg-white/70 dark:bg-white/[0.03] backdrop-blur-xl border border-zinc-200 dark:border-white/[0.08] rounded-2xl p-6 shadow-sm flex flex-col h-full">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-bold text-lg text-zinc-900 dark:text-white">Active Alerts</h3>
        <button className="text-xs font-bold text-cemo-primary uppercase tracking-widest hover:underline">View All</button>
      </div>
      <div className="space-y-4 flex-1">
        {alerts.map((alert) => (
          <div key={alert.id} className="p-4 bg-zinc-50/50 dark:bg-white/[0.02] border border-zinc-200/50 dark:border-white/[0.05] rounded-xl hover:border-cemo-primary/20 transition-all cursor-pointer group">
            <div className="flex items-start gap-3">
              <div className={cn(
                "size-2 rounded-full mt-1.5 shrink-0",
                alert.type === "error" ? "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]" :
                alert.type === "warning" ? "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]" :
                "bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]"
              )} />
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-zinc-900 dark:text-white group-hover:text-cemo-primary transition-colors">{alert.title}</h4>
                  <span className="text-[10px] text-zinc-500 font-medium">{alert.time}</span>
                </div>
                <p className="text-xs text-zinc-500 leading-relaxed">{alert.description}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
