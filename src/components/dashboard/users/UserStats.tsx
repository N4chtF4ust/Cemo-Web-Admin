import { 
  UserGroupIcon, 
  UserCircleIcon, 
  UserAdd01Icon,
  Clock01Icon
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Card } from "~/components/ui/card";
import { cn } from "~/lib/utils";
import { UserRole } from "~/lib/firestore/users";
import type { UserProfile } from "~/lib/firestore/users";

interface UserStatsProps {
  users: UserProfile[];
}

function UserStats({ users }: UserStatsProps) {
  const totalUsers = users.length;
  const adminUsers = users.filter(u => u.role === UserRole.ADMIN).length;
  const individualUsers = users.filter((u) => u.isIndividual).length;
  
  // Calculate unique actual establishments
  const establishmentMap = new Set<string>();
  users
    .filter((u) => !u.isIndividual)
    .forEach((u) => {
      const name = (u.establishmentName || "Unnamed Establishment").trim().toLowerCase();
      const address = (u.establishmentAddress || "No address provided").trim().toLowerCase();
      establishmentMap.add(`${name}::${address}`);
    });
  const totalEstablishments = establishmentMap.size;
  
  const now = new Date();
  const recentlyUpdated = users.filter(u => {
    const diff = now.getTime() - u.updatedAt.getTime();
    return diff < 24 * 60 * 60 * 1000; // Last 24 hours
  }).length;

  const stats = [
    { title: "Total Users", value: totalUsers, icon: UserGroupIcon, color: "text-blue-500" },
    { title: "Admin Users", value: adminUsers, icon: UserCircleIcon, color: "text-purple-500" },
    { title: "Individual Users", value: individualUsers, icon: UserGroupIcon, color: "text-emerald-500" },
    { title: "Establishments", value: totalEstablishments, icon: UserAdd01Icon, color: "text-cemo-primary" },
    { title: "Recently Updated", value: recentlyUpdated, icon: Clock01Icon, color: "text-orange-500" },
  ];

  return (
    <div className="grid grid-cols-2 @2xl:grid-cols-3 @5xl:grid-cols-5 gap-3 sm:gap-4">
      {stats.map((stat, i) => (
        <Card key={i} className="bg-white/70 dark:bg-white/[0.03] backdrop-blur-xl border-zinc-200 dark:border-white/[0.08] p-4 sm:p-5 rounded-2xl shadow-sm group hover:shadow-md transition-all duration-300">
          <div className="flex items-center justify-between gap-2">
            <div className="space-y-1 min-w-0">
              <p className="text-[10px] sm:text-xs font-bold text-zinc-500 uppercase tracking-wider">{stat.title}</p>
              <p className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-white">{stat.value}</p>
            </div>
            <div className={cn("shrink-0 p-2.5 sm:p-3 rounded-xl bg-zinc-100 dark:bg-white/5 group-hover:scale-110 transition-transform duration-300", stat.color)}>
              <HugeiconsIcon icon={stat.icon} className="size-5" />
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

export { UserStats };
export default UserStats;
