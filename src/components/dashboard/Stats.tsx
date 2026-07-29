import { HugeiconsIcon } from "@hugeicons/react";
import { Note01Icon } from "@hugeicons/core-free-icons";
import { formatDistanceToNow } from "date-fns";
import { cn } from "~/lib/utils";
import type { WasteEntry } from "~/lib/firestore/wasteEntries";
import type { UserProfile } from "~/lib/firestore/users";
import { Skeleton } from "~/components/ui/skeleton";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: any;
  className?: string;
}

export function StatsCard({ title, value, icon, className }: StatsCardProps) {
  return (
    <div className={cn(
      "bg-white/70 dark:bg-white/[0.03] backdrop-blur-xl border border-zinc-200 dark:border-white/[0.08] rounded-2xl p-4 sm:p-6 shadow-sm hover:shadow-md transition-all group overflow-hidden relative",
      className
    )}>
      {/* Decorative background glow */}
      <div className="absolute -right-4 -top-4 size-24 bg-cemo-primary/5 rounded-full blur-2xl group-hover:bg-cemo-primary/10 transition-colors" />

      <div className="flex items-start justify-between gap-2 relative z-10">
        <div className="space-y-2 sm:space-y-3 min-w-0">
          <p className="text-[10px] sm:text-xs font-bold text-zinc-500 uppercase tracking-wider sm:tracking-widest">{title}</p>
          <h3 className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-white tracking-tight truncate">{value}</h3>
        </div>
        <div className="shrink-0 p-2.5 sm:p-3 bg-zinc-100 dark:bg-white/5 rounded-xl border border-zinc-200/50 dark:border-white/10 group-hover:scale-110 transition-transform">
          <HugeiconsIcon icon={icon} className="size-5 sm:size-6 text-zinc-900 dark:text-white" />
        </div>
      </div>
    </div>
  );
}

interface RecentActivityProps {
  entries: WasteEntry[];
  users: UserProfile[];
  loading?: boolean;
}

/**
 * The five most recent disposals logged by the mobile app.
 */
export function RecentActivity({ entries, users, loading }: RecentActivityProps) {
  const recent = [...entries]
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    .slice(0, 5);

  const labelFor = (entry: WasteEntry) => {
    const user = users.find((u) => u.uid === entry.userId);
    if (!user) return "Unknown user";
    if (!user.isIndividual && user.establishmentName) return user.establishmentName;
    return user.displayName
      || `${user.firstName || ""} ${user.lastName || ""}`.trim()
      || user.email;
  };

  return (
    <div className="bg-white/70 dark:bg-white/[0.03] backdrop-blur-xl border border-zinc-200 dark:border-white/[0.08] rounded-2xl p-6 shadow-sm flex flex-col h-full">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-bold text-lg text-zinc-900 dark:text-white">Recent Activity</h3>
        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Latest disposals</span>
      </div>
      <div className="space-y-4 flex-1">
        {loading ? (
          [1, 2, 3].map((i) => <Skeleton key={i} className="h-20 w-full rounded-xl" />)
        ) : recent.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
            <div className="p-4 bg-zinc-100 dark:bg-white/5 rounded-2xl">
              <HugeiconsIcon icon={Note01Icon} className="size-6 text-zinc-400" />
            </div>
            <p className="text-sm text-zinc-500 font-medium">No disposals logged yet.</p>
          </div>
        ) : (
          recent.map((entry) => (
            <div key={entry.id} className="p-4 bg-zinc-50/50 dark:bg-white/[0.02] border border-zinc-200/50 dark:border-white/[0.05] rounded-xl">
              <div className="flex items-start gap-3">
                <div className="size-2 rounded-full mt-1.5 shrink-0 bg-cemo-primary shadow-[0_0_8px_rgba(57,255,20,0.5)]" />
                <div className="space-y-1 flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="text-sm font-bold text-zinc-900 dark:text-white truncate">
                      {entry.weightAdded.toFixed(2)} kg
                    </h4>
                    <span className="text-[10px] text-zinc-500 font-medium shrink-0">
                      {formatDistanceToNow(entry.timestamp, { addSuffix: true })}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-500 leading-relaxed truncate">{labelFor(entry)}</p>
                  <p className="text-[10px] text-zinc-400 font-medium">
                    {entry.temperature.toFixed(1)}°C · {entry.humidity.toFixed(0)}% humidity
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
