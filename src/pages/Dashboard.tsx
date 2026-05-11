import { useEffect, useState } from "react";
import { 
  UserGroupIcon, 
  AnalyticsUpIcon,
  Delete01Icon,
  DashboardCircleIcon
} from "@hugeicons/core-free-icons";
import { DashboardLayout } from "~/components/dashboard/DashboardLayout";
import { StatsCard, RecentAlerts } from "~/components/dashboard/Stats";
import { UserTable } from "~/components/dashboard/UserTable";
import { getUsers } from "~/lib/firestore/users";

export function Dashboard() {
  const [totalUsers, setTotalUsers] = useState<string>("...");

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const users = await getUsers();
        setTotalUsers(users.length.toLocaleString());
      } catch (error) {
        console.error("Error fetching dashboard stats:", error);
        setTotalUsers("Error");
      }
    };

    fetchStats();
  }, []);

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-1">
        <h2 className="text-3xl font-bold text-zinc-900 dark:text-white tracking-tight">System Overview</h2>
        <p className="text-zinc-500 text-sm">Real-time monitoring of food waste collection and IoT device status.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        <StatsCard 
          title="Total Users" 
          value={totalUsers} 
          change="+12%" 
          trend="up"
          icon={UserGroupIcon} 
        />
        <StatsCard 
          title="Active Devices" 
          value="42" 
          change="+5%" 
          trend="up"
          icon={DashboardCircleIcon} 
        />
        <StatsCard 
          title="Waste Today" 
          value="428 kg" 
          change="-8%" 
          trend="down"
          icon={AnalyticsUpIcon} 
        />
        <StatsCard 
          title="Full Bins" 
          value="12" 
          icon={Delete01Icon} 
          className="bg-cemo-primary/5 border-cemo-primary/20"
        />
        <StatsCard 
          title="Collections" 
          value="156" 
          change="+18%" 
          trend="up"
          icon={AnalyticsUpIcon} 
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2 space-y-8">
          <div className="bg-white/70 dark:bg-white/[0.03] backdrop-blur-xl border border-zinc-200 dark:border-white/[0.08] rounded-2xl p-6 shadow-sm min-h-[400px] flex flex-col">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="font-bold text-lg text-zinc-900 dark:text-white">Waste Trend Analysis</h3>
                <p className="text-xs text-zinc-500">Weekly waste generation across all monitored sectors.</p>
              </div>
            </div>
            
            <div className="flex-1 flex items-end justify-between gap-4 pb-2 px-4">
              {[60, 45, 80, 55, 90, 70, 85].map((height, i) => (
                <div key={i} className="flex-1 group flex flex-col items-center gap-4">
                  <div className="w-full relative">
                    <div 
                      className="w-full bg-gradient-to-t from-cemo-primary/20 to-cemo-primary rounded-t-xl transition-all duration-500 group-hover:brightness-110 relative"
                      style={{ height: `${height * 3}px` }}
                    />
                  </div>
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-tighter">
                    {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][i]}
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
            <h3 className="font-bold text-white mb-4 relative z-10">Device Health</h3>
            <div className="space-y-4 relative z-10">
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-400">Online</span>
                <span className="text-cemo-primary font-bold">98.2%</span>
              </div>
              <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-cemo-primary w-[98.2%]" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
