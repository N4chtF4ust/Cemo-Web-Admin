import { useEffect, useState, useMemo } from "react";
import { 
  UserGroupIcon, 
  AnalyticsUpIcon,
  Note01Icon,
  DashboardCircleIcon,
  DatabaseIcon,
  Leaf01Icon
} from "@hugeicons/core-free-icons";
import { DashboardLayout } from "~/components/dashboard/DashboardLayout";
import { StatsCard, RecentAlerts } from "~/components/dashboard/Stats";
import { UserTable } from "~/components/dashboard/UserTable";
import { getUsers } from "~/lib/firestore/users";
import { getAllWasteEntries, type WasteEntry } from "~/lib/firestore/wasteEntries";
import { format } from "date-fns";
import { Badge } from "~/components/ui/badge";

function Dashboard() {
  const [totalUsers, setTotalUsers] = useState<number>(0);
  const [wasteEntries, setWasteEntries] = useState<WasteEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        const [users, entries] = await Promise.all([
          getUsers(),
          getAllWasteEntries(500) // Fetch a substantial amount for stats
        ]);
        setTotalUsers(users.length);
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
    const totalCH4 = wasteEntries.reduce((sum, e) => sum + e.methanePotential, 0);
    const totalCO2 = wasteEntries.reduce((sum, e) => sum + e.co2Potential, 0);
    
    return {
      weight: totalWeight.toFixed(1),
      ch4: totalCH4.toFixed(2),
      co2: totalCO2.toFixed(2),
      entriesCount: wasteEntries.length
    };
  }, [wasteEntries]);

  // Weekly Waste Generation
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

    wasteEntries.forEach(entry => {
      const entryDate = format(entry.timestamp, "yyyy-MM-dd");
      const day = last7Days.find(d => d.date === entryDate);
      if (day) day.weight += entry.weightAdded;
    });

    const maxWeight = Math.max(...last7Days.map(d => d.weight), 1);
    return last7Days.map(d => ({
      ...d,
      height: (d.weight / maxWeight) * 100
    }));
  }, [wasteEntries]);

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-1">
        <h2 className="text-3xl font-bold text-zinc-900 dark:text-white tracking-tight">System Overview</h2>
        <p className="text-zinc-500 text-sm">Real-time monitoring of food waste collection and environmental impact.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        <StatsCard 
          title="Total Users" 
          value={loading ? "..." : totalUsers} 
          icon={UserGroupIcon} 
        />
        <StatsCard 
          title="Total Waste (kg)" 
          value={loading ? "..." : stats.weight} 
          icon={DatabaseIcon} 
          className="bg-cemo-primary/5 border-cemo-primary/20"
        />
        <StatsCard 
          title="CH4 Potential" 
          value={loading ? "..." : stats.ch4} 
          icon={Leaf01Icon} 
        />
        <StatsCard 
          title="CO2 Potential" 
          value={loading ? "..." : stats.co2} 
          icon={AnalyticsUpIcon} 
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2 space-y-8">
          <div className="bg-white/70 dark:bg-white/[0.03] backdrop-blur-xl border border-zinc-200 dark:border-white/[0.08] rounded-2xl p-6 shadow-sm min-h-[400px] flex flex-col">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="font-bold text-lg text-zinc-900 dark:text-white">Waste Generation Trend</h3>
                <p className="text-xs text-zinc-500">Real-time waste weight (kg) collected over the last 7 days.</p>
              </div>
              <Badge variant="outline" className="rounded-lg border-cemo-primary/20 text-cemo-primary uppercase text-[10px] font-bold">
                Live Data
              </Badge>
            </div>
            
            <div className="flex-1 flex items-end justify-between gap-4 pb-2 px-4">
              {weeklyData.map((day, i) => (
                <div key={i} className="flex-1 group flex flex-col items-center gap-4">
                  <div className="w-full relative">
                    <div 
                      className="w-full bg-gradient-to-t from-cemo-primary/20 to-cemo-primary rounded-t-xl transition-all duration-500 group-hover:brightness-110 relative"
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
          <UserTable />
        </div>

        <div className="space-y-8">
          <RecentAlerts />
          <div className="bg-gradient-to-br from-zinc-900 to-black dark:from-white/5 dark:to-white/[0.02] border border-white/10 rounded-2xl p-6 shadow-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-cemo-primary/10 rounded-full blur-3xl" />
            <h3 className="font-bold text-white mb-4 relative z-10">Network Integrity</h3>
            <div className="space-y-4 relative z-10">
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-400">Total Entries Processed</span>
                <span className="text-cemo-primary font-bold">{stats.entriesCount}</span>
              </div>
              <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-cemo-primary w-[100%]" />
              </div>
              <p className="text-[10px] text-zinc-500 mt-2">All environmental metrics are synchronized with Firestore subcollections.</p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

export { Dashboard };
export default Dashboard;
