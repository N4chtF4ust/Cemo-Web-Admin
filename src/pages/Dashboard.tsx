import { useEffect, useState, useMemo } from "react";
import {
  UserGroupIcon,
  Note01Icon,
  DatabaseIcon,
  WeightScaleIcon,
  Building03Icon,
  UserCircleIcon
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { DashboardLayout } from "~/components/dashboard/DashboardLayout";
import { StatsCard, RecentActivity } from "~/components/dashboard/Stats";
import { UserTable } from "~/components/dashboard/UserTable";
import { getUsers, type UserProfile } from "~/lib/firestore/users";
import { getAllWasteEntries, type WasteEntry } from "~/lib/firestore/wasteEntries";
import { format, isToday } from "date-fns";
import { Badge } from "~/components/ui/badge";
import { cn } from "~/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { UserRole } from "~/lib/firestore/users";
import { useCurrentAdmin } from "~/hooks/useCurrentAdmin";

function Dashboard() {
  const { profile } = useCurrentAdmin();
  const isAdmin = profile?.role === UserRole.ADMIN;
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [wasteEntries, setWasteEntries] = useState<WasteEntry[]>([]);
  const [trendFilter, setTrendFilter] = useState<"all" | "establishment" | "individual">("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        const [usersData, entries] = await Promise.all([
          getUsers(),
          getAllWasteEntries(500) // Fetch a substantial amount for stats
        ]);
        setUsers(usersData);
        setWasteEntries(entries);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const stats = useMemo(() => {
    const totalWeight = wasteEntries.reduce((sum, e) => sum + e.weightAdded, 0);
    const avgWeight = wasteEntries.length > 0 ? totalWeight / wasteEntries.length : 0;

    // User type breakdowns
    const individuals = users.filter(u => u.isIndividual);
    const establishmentUsers = users.filter(u => !u.isIndividual);

    // Group non-individual users by establishment name + address to get the actual total unique establishments
    const establishmentMap = new Map<string, { name: string; address: string; uids: string[] }>();
    establishmentUsers.forEach(u => {
      const name = (u.establishmentName || "Unnamed Establishment").trim();
      const address = (u.establishmentAddress || "No address provided").trim();
      const key = `${name.toLowerCase()}::${address.toLowerCase()}`;
      const existing = establishmentMap.get(key);
      if (existing) {
        existing.uids.push(u.uid);
      } else {
        establishmentMap.set(key, { name, address, uids: [u.uid] });
      }
    });
    const actualEstablishmentsCount = establishmentMap.size;
    
    // Waste breakdowns
    const individualUids = new Set(individuals.map(u => u.uid));
    const individualWaste = wasteEntries
        .filter(e => e.userId && individualUids.has(e.userId))
        .reduce((sum, e) => sum + e.weightAdded, 0);
    
    const establishmentWaste = totalWeight - individualWaste;

    // Total entries for the day (today)
    const todayEntriesCount = wasteEntries.filter(e => isToday(e.timestamp)).length;

    return {
      weight: totalWeight.toFixed(1),
      avgWeight: avgWeight.toFixed(2),
      entriesCount: wasteEntries.length,
      todayEntriesCount,
      totalUsers: users.length,
      totalIndividuals: individuals.length,
      totalEstablishments: actualEstablishmentsCount,
      totalEstablishmentUsers: establishmentUsers.length,
      individualWaste: individualWaste.toFixed(1),
      establishmentWaste: establishmentWaste.toFixed(1)
    };
  }, [wasteEntries, users]);

  // User ID sets for fast lookup
  const individualUids = useMemo(() => new Set(users.filter(u => u.isIndividual).map(u => u.uid)), [users]);
  const establishmentUids = useMemo(() => new Set(users.filter(u => !u.isIndividual).map(u => u.uid)), [users]);

  // Weekly Waste Generation filtered by selected account type
  const weeklyData = useMemo(() => {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const now = new Date();
    const last7Days = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date();
      d.setDate(now.getDate() - (6 - i));
      return {
        label: days[d.getDay()],
        date: format(d, "yyyy-MM-dd"),
        weight: 0
      };
    });

    const filtered = wasteEntries.filter(entry => {
      if (trendFilter === "all") return true;
      if (!entry.userId) return false;
      if (trendFilter === "individual") return individualUids.has(entry.userId);
      if (trendFilter === "establishment") return establishmentUids.has(entry.userId);
      return true;
    });

    filtered.forEach(entry => {
      const entryDate = format(entry.timestamp, "yyyy-MM-dd");
      const day = last7Days.find(d => d.date === entryDate);
      if (day) day.weight += entry.weightAdded;
    });

    const maxWeight = Math.max(...last7Days.map(d => d.weight), 1);
    return last7Days.map(d => ({
      ...d,
      height: (d.weight / maxWeight) * 100
    }));
  }, [wasteEntries, trendFilter, individualUids, establishmentUids]);

  const trendBarClass = useMemo(() => {
    if (trendFilter === "establishment") {
      return "bg-gradient-to-t from-blue-500/20 to-blue-500";
    }
    if (trendFilter === "individual") {
      return "bg-gradient-to-t from-orange-500/20 to-orange-500";
    }
    return "bg-gradient-to-t from-cemo-primary/20 to-cemo-primary";
  }, [trendFilter]);

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-1">
        <h2 className="text-3xl font-bold text-zinc-900 dark:text-white tracking-tight">System Overview</h2>
        <p className="text-zinc-500 text-sm">Real-time monitoring of food waste collection and environmental impact.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard 
          title="Total Users" 
          value={loading ? "..." : stats.totalUsers} 
          icon={UserGroupIcon} 
        />
        <StatsCard 
          title="Total Waste (kg)" 
          value={loading ? "..." : stats.weight} 
          icon={DatabaseIcon} 
          className="bg-cemo-primary/5 border-cemo-primary/20"
        />
        <StatsCard
          title="Total Entries (Today)"
          value={loading ? "..." : stats.todayEntriesCount}
          icon={Note01Icon}
        />
        <StatsCard
          title="Avg. per Entry (kg)"
          value={loading ? "..." : stats.avgWeight}
          icon={WeightScaleIcon}
        />
      </div>

      {/* Breakdown Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white/70 dark:bg-white/[0.03] backdrop-blur-xl border border-zinc-200 dark:border-white/[0.08] rounded-2xl p-6 shadow-sm flex items-center gap-6 group">
            <div className="p-4 bg-blue-500/10 rounded-2xl text-blue-500 group-hover:scale-110 transition-transform">
                <HugeiconsIcon icon={Building03Icon} className="size-8" />
            </div>
            <div className="space-y-1">
                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Total Establishments</p>
                <div className="flex items-baseline gap-2">
                    <h3 className="text-2xl font-bold text-zinc-900 dark:text-white">{loading ? "..." : stats.totalEstablishments}</h3>
                    <span className="text-xs text-zinc-400">registered</span>
                </div>
                <p className="text-xs font-medium text-zinc-500">
                  Contributed <span className="text-zinc-900 dark:text-white font-bold">{stats.establishmentWaste} kg</span> total waste
                  {stats.totalEstablishmentUsers > 0 && (
                    <span className="text-zinc-400 font-normal"> ({stats.totalEstablishmentUsers} linked account{stats.totalEstablishmentUsers === 1 ? "" : "s"})</span>
                  )}
                </p>
            </div>
        </div>

        <div className="bg-white/70 dark:bg-white/[0.03] backdrop-blur-xl border border-zinc-200 dark:border-white/[0.08] rounded-2xl p-6 shadow-sm flex items-center gap-6 group">
            <div className="p-4 bg-orange-500/10 rounded-2xl text-orange-500 group-hover:scale-110 transition-transform">
                <HugeiconsIcon icon={UserCircleIcon} className="size-8" />
            </div>
            <div className="space-y-1">
                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Total Individual Users</p>
                <div className="flex items-baseline gap-2">
                    <h3 className="text-2xl font-bold text-zinc-900 dark:text-white">{loading ? "..." : stats.totalIndividuals}</h3>
                    <span className="text-xs text-zinc-400">active accounts</span>
                </div>
                <p className="text-xs font-medium text-zinc-500">Contributed <span className="text-zinc-900 dark:text-white font-bold">{stats.individualWaste} kg</span> total waste</p>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2 space-y-8">
          <div className="bg-white/70 dark:bg-white/[0.03] backdrop-blur-xl border border-zinc-200 dark:border-white/[0.08] rounded-2xl p-6 shadow-sm min-h-[400px] flex flex-col">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
              <div>
                <h3 className="font-bold text-lg text-zinc-900 dark:text-white">Waste Generation Trend</h3>
                <p className="text-xs text-zinc-500">
                  {trendFilter === "all" && "Real-time waste weight (kg) collected over the last 7 days."}
                  {trendFilter === "establishment" && "Real-time waste weight (kg) from establishments over the last 7 days."}
                  {trendFilter === "individual" && "Real-time waste weight (kg) from individual users over the last 7 days."}
                </p>
              </div>
              <div className="flex items-center gap-2.5">
                <Select value={trendFilter} onValueChange={(val: "all" | "establishment" | "individual") => setTrendFilter(val)}>
                  <SelectTrigger className="h-8 min-w-[130px] text-xs font-semibold rounded-xl bg-zinc-100 dark:bg-white/5 border-zinc-200 dark:border-white/10 px-3">
                    <SelectValue placeholder="All Accounts" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-zinc-200 dark:border-white/10">
                    <SelectItem value="all">All Accounts</SelectItem>
                    <SelectItem value="establishment">Establishment</SelectItem>
                    <SelectItem value="individual">Individual</SelectItem>
                  </SelectContent>
                </Select>
                <Badge variant="outline" className="rounded-lg border-cemo-primary/20 text-cemo-primary uppercase text-[10px] font-bold">
                  Live Data
                </Badge>
              </div>
            </div>
            
            <div className="flex-1 flex items-end justify-between gap-4 pb-2 px-4">
              {weeklyData.map((day, i) => (
                <div key={i} className="flex-1 group flex flex-col items-center gap-4">
                  <div className="w-full relative">
                    <div 
                      className={cn("w-full rounded-t-xl transition-all duration-500 group-hover:brightness-110 relative", trendBarClass)}
                      style={{ height: `${Math.max(day.height * 2.5, 4)}px` }}
                    >
                      <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-[10px] font-bold py-1 px-2 rounded-md pointer-events-none whitespace-nowrap">
                        {day.weight.toFixed(1)} kg
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-tighter">
                    {day.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
          {isAdmin && <UserTable />}
        </div>

        <div className="space-y-8">
          <RecentActivity entries={wasteEntries} users={users} loading={loading} />
        </div>
      </div>
    </DashboardLayout>
  );
}

export { Dashboard };
export default Dashboard;
