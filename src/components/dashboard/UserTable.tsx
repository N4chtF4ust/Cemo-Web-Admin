import { useEffect, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { MoreHorizontalIcon, ViewIcon, Edit01Icon, Delete01Icon } from "@hugeicons/core-free-icons";
import { cn } from "~/lib/utils";
import { getUsers, UserRole } from "~/lib/firestore/users";
import type { UserProfile } from "~/lib/firestore/users";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Badge } from "~/components/ui/badge";
import { Skeleton } from "~/components/ui/skeleton";
import { useNavigate } from "react-router-dom";

export function UserTable() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const data = await getUsers();
        // Limit to 5 for dashboard overview
        setUsers(data.slice(0, 5));
      } catch (error) {
        console.error("Error fetching users for dashboard:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  return (
    <div className="bg-white/70 dark:bg-white/[0.03] backdrop-blur-xl border border-zinc-200 dark:border-white/[0.08] rounded-2xl shadow-sm overflow-hidden">
      <div className="p-6 border-b border-zinc-200 dark:border-white/[0.08] flex items-center justify-between">
        <div>
          <h3 className="font-bold text-lg text-zinc-900 dark:text-white">Recent Users</h3>
          <p className="text-xs text-zinc-500">Overview of the latest registered accounts.</p>
        </div>
        <button 
          onClick={() => navigate("/users")}
          className="px-4 py-2 bg-cemo-primary/10 text-cemo-primary border border-cemo-primary/20 hover:bg-cemo-primary hover:text-black font-bold text-xs rounded-xl transition-all shadow-[0_0_15px_rgba(57,255,20,0.1)]"
        >
          View All
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-zinc-50/50 dark:bg-white/[0.02] text-[10px] font-bold text-zinc-500 uppercase tracking-widest border-b border-zinc-200 dark:border-white/[0.05]">
              <th className="px-6 py-4">User</th>
              <th className="px-6 py-4">Role</th>
              <th className="px-6 py-4">Joined</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-white/[0.05]">
            {loading ? (
              [1, 2, 3, 4].map((i) => (
                <tr key={i}>
                  <td className="px-6 py-4"><Skeleton className="h-10 w-40 rounded-lg" /></td>
                  <td className="px-6 py-4"><Skeleton className="h-6 w-20 rounded-md" /></td>
                  <td className="px-6 py-4"><Skeleton className="h-4 w-24 rounded" /></td>
                  <td className="px-6 py-4 text-right"><Skeleton className="h-8 w-8 rounded-lg ml-auto" /></td>
                </tr>
              ))
            ) : users.length > 0 ? (
              users.map((user) => {
                const fullName = user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.displayName || user.email.split('@')[0];
                const initials = (user.firstName?.[0] || "") + (user.lastName?.[0] || "") || user.displayName?.[0] || user.email[0];

                return (
                  <tr key={user.uid} className="hover:bg-zinc-50/50 dark:hover:bg-white/[0.01] transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="size-8 border border-zinc-200/50 dark:border-white/10">
                          <AvatarImage src={user.photoUrl || ""} />
                          <AvatarFallback className="bg-zinc-100 dark:bg-white/5 text-zinc-500 font-bold text-[10px] uppercase">
                            {initials}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-bold text-zinc-900 dark:text-white leading-none mb-1">{fullName}</p>
                          <p className="text-[10px] text-zinc-500">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge className={cn(
                        "text-[9px] font-bold tracking-wider uppercase px-2 py-0.5 border",
                        user.role === UserRole.ADMIN 
                          ? "bg-cemo-primary/20 text-cemo-primary border-cemo-primary/30" 
                          : "bg-zinc-100 dark:bg-white/5 text-zinc-500 border-zinc-200/50 dark:border-white/10"
                      )}>
                        {user.role}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-[11px] text-zinc-500 font-medium">
                      {user.createdAt.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => navigate("/users")}
                        className="p-2 hover:bg-zinc-100 dark:hover:bg-white/5 rounded-lg transition-colors text-zinc-400 hover:text-cemo-primary"
                      >
                        <HugeiconsIcon icon={ViewIcon} className="size-4" />
                      </button>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-zinc-500 text-sm font-medium">
                  No users found in the database.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
