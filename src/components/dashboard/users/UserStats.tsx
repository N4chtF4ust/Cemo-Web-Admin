import { 
  UserGroupIcon, 
  UserCircleIcon, 
  UserAdd01Icon,
  Calendar01Icon,
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

export function UserStats({ users }: UserStatsProps) {
  const totalUsers = users.length;
  const adminUsers = users.filter(u => u.role === UserRole.ADMIN).length;
  const standardUsers = totalUsers - adminUsers;
  
  const now = new Date();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const newThisMonth = users.filter(u => u.createdAt >= firstDayOfMonth).length;
  
  const recentlyUpdated = users.filter(u => {
    const diff = now.getTime() - u.updatedAt.getTime();
    return diff < 24 * 60 * 60 * 1000; // Last 24 hours
  }).length;

  const stats = [
    { title: "Total Users", value: totalUsers, icon: UserGroupIcon, color: "text-blue-500" },
    { title: "Admin Users", value: adminUsers, icon: UserCircleIcon, color: "text-purple-500" },
    { title: "Standard Users", value: standardUsers, icon: UserGroupIcon, color: "text-emerald-500" },
    { title: "New This Month", value: newThisMonth, icon: UserAdd01Icon, color: "text-cemo-primary" },
    { title: "Recently Updated", value: recentlyUpdated, icon: Clock01Icon, color: "text-orange-500" },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
      {stats.map((stat, i) => (
        <Card key={i} className="bg-white/70 dark:bg-white/[0.03] backdrop-blur-xl border-zinc-200 dark:border-white/[0.08] p-5 rounded-2xl shadow-sm group hover:shadow-md transition-all duration-300">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider">{stat.title}</p>
              <p className="text-2xl font-bold text-zinc-900 dark:text-white">{stat.value}</p>
            </div>
            <div className={cn("p-3 rounded-xl bg-zinc-100 dark:bg-white/5 group-hover:scale-110 transition-transform duration-300", stat.color)}>
              <HugeiconsIcon icon={stat.icon} className="size-5" />
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
