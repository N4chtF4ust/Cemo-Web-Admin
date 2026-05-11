import { useState, useEffect } from "react";
import { DashboardLayout } from "~/components/dashboard/DashboardLayout";
import { UserStats } from "~/components/dashboard/users/UserStats";
import { UserManagementTable } from "~/components/dashboard/users/UserManagementTable";
import { UserDialog } from "~/components/dashboard/users/UserDialog";
import { UserDetails } from "~/components/dashboard/users/UserDetails";
import { 
  getUsers, 
  updateUserProfile, 
  deleteUserProfile, 
  createUserProfile,
} from "~/lib/firestore/users";
import type { UserProfile } from "~/lib/firestore/users";
import { Skeleton } from "~/components/ui/skeleton";
import { HugeiconsIcon } from "@hugeicons/react";
import { AlertCircleIcon } from "@hugeicons/core-free-icons";

export function Users() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Dialog/Sheet states
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getUsers();
      setUsers(data);
    } catch (err: any) {
      console.error("Error fetching users:", err);
      setError(err.message || "Failed to fetch users. Check console for details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleAddUser = () => {
    setSelectedUser(null);
    setIsDialogOpen(true);
  };

  const handleEditUser = (user: UserProfile) => {
    setSelectedUser(user);
    setIsDialogOpen(true);
  };

  const handleViewUser = (user: UserProfile) => {
    setSelectedUser(user);
    setIsDetailsOpen(true);
  };

  const handleDeleteUser = async (uid: string) => {
    if (window.confirm("Are you sure you want to delete this user? This action cannot be undone.")) {
      try {
        await deleteUserProfile(uid);
        await fetchUsers();
      } catch (err: any) {
        console.error("Error deleting user:", err);
        alert("Error: " + err.message);
      }
    }
  };

  const handleSaveUser = async (data: Partial<UserProfile>) => {
    try {
      if (selectedUser) {
        await updateUserProfile(selectedUser.uid, data);
      } else {
        const newUid = Math.random().toString(36).substring(2, 15);
        await createUserProfile({
          uid: newUid,
          email: data.email!,
          displayName: data.displayName || null,
          firstName: data.firstName || null,
          lastName: data.lastName || null,
          photoUrl: data.photoUrl || null,
          role: data.role!,
        });
      }
      await fetchUsers();
    } catch (err: any) {
      console.error("Error saving user:", err);
      throw err;
    }
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-1">
        <h2 className="text-3xl font-bold text-zinc-900 dark:text-white tracking-tight">Users</h2>
        <p className="text-zinc-500 text-sm">Manage registered accounts and permissions</p>
      </div>

      {loading ? (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-24 rounded-2xl" />)}
          </div>
          <Skeleton className="h-[500px] w-full rounded-2xl" />
        </div>
      ) : error ? (
        <div className="mt-8 p-12 bg-red-500/5 border border-red-500/20 rounded-2xl text-center flex flex-col items-center gap-4">
          <div className="p-3 bg-red-500/10 rounded-xl text-red-500">
            <HugeiconsIcon icon={AlertCircleIcon} className="size-8" />
          </div>
          <div className="space-y-1">
            <h3 className="font-bold text-lg text-zinc-900 dark:text-white">Access Anomaly</h3>
            <p className="text-zinc-500 text-sm max-w-md">{error}</p>
          </div>
          <button 
            onClick={fetchUsers}
            className="px-6 py-2 bg-zinc-900 dark:bg-white text-white dark:text-black font-bold rounded-xl text-xs hover:scale-105 transition-transform"
          >
            Retry Protocol
          </button>
        </div>
      ) : (
        <div className="space-y-8 animate-in fade-in duration-500">
          <UserStats users={users} />
          <UserManagementTable 
            users={users} 
            onView={handleViewUser}
            onEdit={handleEditUser}
            onDelete={handleDeleteUser}
            onRefresh={fetchUsers}
            onAdd={handleAddUser}
          />
        </div>
      )}

      <UserDialog 
        isOpen={isDialogOpen} 
        onClose={() => setIsDialogOpen(false)} 
        onSave={handleSaveUser}
        user={selectedUser}
      />

      <UserDetails 
        isOpen={isDetailsOpen} 
        onClose={() => setIsDetailsOpen(false)} 
        user={selectedUser}
      />
    </DashboardLayout>
  );
}
