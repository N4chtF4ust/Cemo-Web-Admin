import { useState, useEffect, useMemo } from "react";
import type { ComponentType } from "react";
import { DashboardLayout } from "~/components/dashboard/DashboardLayout";
import * as UserStatsModule from "~/components/dashboard/users/UserStats";
import * as UserManagementTableModule from "~/components/dashboard/users/UserManagementTable";
import * as UserDialogModule from "~/components/dashboard/users/UserDialog";
import * as UserDetailsModule from "~/components/dashboard/users/UserDetails";
import { 
  getUsers, 
  updateUserProfile, 
  deleteUserProfile, 
  createUserProfile,
  UserRole,
} from "~/lib/firestore/users";
import type { UserProfile } from "~/lib/firestore/users";
import { Input } from "~/components/ui/input";
import { Skeleton } from "~/components/ui/skeleton";
import { HugeiconsIcon } from "@hugeicons/react";
import { AlertCircleIcon } from "@hugeicons/core-free-icons";

const UserStats = UserStatsModule.UserStats ?? UserStatsModule.default;
const UserManagementTable = UserManagementTableModule.UserManagementTable ?? UserManagementTableModule.default;
const UserDialog = UserDialogModule.UserDialog ?? UserDialogModule.default;
const UserDetails = UserDetailsModule.UserDetails ?? UserDetailsModule.default;
const resolveComponent = <TProps extends object>(
  component: unknown,
  displayName: string,
): ComponentType<TProps> => {
  if (typeof component === "function") {
    return component as ComponentType<TProps>;
  }

  return (() => (
    <div className="mt-8 p-6 bg-red-500/5 border border-red-500/20 rounded-xl text-sm text-red-500">
      Unable to load the {displayName} component. Please refresh the page.
    </div>
  )) as ComponentType<TProps>;
};

const SafeUserStats = resolveComponent<{ users: UserProfile[] }>(UserStats, "UserStats");
const SafeUserManagementTable = resolveComponent<{
  users: UserProfile[];
  canModifyUsers?: boolean;
  onView: (user: UserProfile) => void;
  onEdit: (user: UserProfile) => void;
  onDelete: (uid: string) => void;
  onRefresh: () => void;
  onAdd: () => void;
}>(UserManagementTable, "UserManagementTable");
const SafeUserDialog = resolveComponent<{
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<UserProfile>) => Promise<void>;
  user: UserProfile | null;
}>(UserDialog, "UserDialog");
const SafeUserDetails = resolveComponent<{
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile | null;
}>(UserDetails, "UserDetails");

function Users() {
  const canModifyUsers = false;
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Dialog/Sheet states
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [establishmentSearch, setEstablishmentSearch] = useState("");
  const [establishmentPage, setEstablishmentPage] = useState(1);
  const [expandedEstablishmentKey, setExpandedEstablishmentKey] = useState<string | null>(null);

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
    if (!canModifyUsers) {
      alert("Admin is not allowed to create, edit, or delete users.");
      return;
    }
    setSelectedUser(user);
    setIsDialogOpen(true);
  };

  const handleViewUser = (user: UserProfile) => {
    setSelectedUser(user);
    setIsDetailsOpen(true);
  };

  const handleDeleteUser = async (uid: string) => {
    if (!canModifyUsers) {
      alert("Admin is not allowed to create, edit, or delete users.");
      return;
    }

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
    const normalizeOptionalString = (value?: string | null) => {
      const trimmed = value?.trim();
      return trimmed ? trimmed : null;
    };

    const normalizedData: Partial<UserProfile> = {
      ...data,
      email: data.email?.trim().toLowerCase(),
      displayName: normalizeOptionalString(data.displayName),
      firstName: normalizeOptionalString(data.firstName),
      lastName: normalizeOptionalString(data.lastName),
      photoUrl: normalizeOptionalString(data.photoUrl),
      isIndividual: data.isIndividual ?? true,
      establishmentName: normalizeOptionalString(data.establishmentName),
      establishmentAddress: normalizeOptionalString(data.establishmentAddress),
      role: data.role ?? UserRole.USER,
    };

    try {
      if (selectedUser) {
        if (!canModifyUsers) {
          throw new Error("Admin is not allowed to edit users.");
        }
        await updateUserProfile(selectedUser.uid, normalizedData);
      } else {
        const newUid = Math.random().toString(36).substring(2, 15);
        await createUserProfile({
          uid: newUid,
          email: normalizedData.email!,
          displayName: normalizedData.displayName || null,
          firstName: normalizedData.firstName || null,
          lastName: normalizedData.lastName || null,
          photoUrl: normalizedData.photoUrl || null,
          role: normalizedData.role!,
          isIndividual: normalizedData.isIndividual ?? true,
          establishmentName: normalizedData.establishmentName || null,
          establishmentAddress: normalizedData.establishmentAddress || null,
        });
      }
      await fetchUsers();
    } catch (err: any) {
      console.error("Error saving user:", err);
      throw err;
    }
  };

  const establishmentSummaries = useMemo(() => {
    const map = new Map<string, { key: string; name: string; address: string; linkedUsers: UserProfile[] }>();

    users
      .filter((user) => !user.isIndividual)
      .forEach((user) => {
        const name = user.establishmentName || "Unnamed Establishment";
        const address = user.establishmentAddress || "No address provided";
        const key = `${name}::${address}`;
        const existing = map.get(key);

        if (existing) {
          existing.linkedUsers.push(user);
        } else {
          map.set(key, { key, name, address, linkedUsers: [user] });
        }
      });

    return Array.from(map.values()).sort((a, b) => b.linkedUsers.length - a.linkedUsers.length);
  }, [users]);

  const filteredEstablishments = useMemo(() => {
    const query = establishmentSearch.trim().toLowerCase();
    if (!query) return establishmentSummaries;

    return establishmentSummaries.filter((establishment) => {
      const establishmentMatch =
        establishment.name.toLowerCase().includes(query) ||
        establishment.address.toLowerCase().includes(query);

      if (establishmentMatch) return true;

      return establishment.linkedUsers.some((linkedUser) => {
        const linkedUserName =
          `${linkedUser.firstName || ""} ${linkedUser.lastName || ""}`.trim() ||
          linkedUser.displayName ||
          linkedUser.email;

        return (
          linkedUserName.toLowerCase().includes(query) ||
          linkedUser.email.toLowerCase().includes(query)
        );
      });
    });
  }, [establishmentSummaries, establishmentSearch]);

  const establishmentTotalPages = Math.max(1, Math.ceil(filteredEstablishments.length / 2));

  useEffect(() => {
    setEstablishmentPage((prevPage) => Math.min(prevPage, establishmentTotalPages));
  }, [establishmentTotalPages]);

  const pagedEstablishments = useMemo(() => {
    const start = (establishmentPage - 1) * 2;
    return filteredEstablishments.slice(start, start + 2);
  }, [filteredEstablishments, establishmentPage]);

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
          <SafeUserStats users={users} />
          <div className="space-y-3">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
              <div className="flex items-center justify-between lg:justify-start gap-3">
                <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-500">Establishments</h3>
                <span className="text-xs font-medium text-zinc-400">
                  {establishmentSummaries.length} registered
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  value={establishmentSearch}
                  onChange={(event) => {
                    setEstablishmentSearch(event.target.value);
                    setEstablishmentPage(1);
                    setExpandedEstablishmentKey(null);
                  }}
                  placeholder="Search establishment or linked user..."
                  className="w-full lg:w-[280px] rounded-xl border-zinc-200 dark:border-white/10 bg-white/50 dark:bg-white/[0.02]"
                />
                <button
                  type="button"
                  onClick={() => setEstablishmentPage((page) => Math.max(1, page - 1))}
                  disabled={establishmentPage === 1}
                  className="px-3 py-2 rounded-xl text-xs font-bold border border-zinc-200 dark:border-white/10 text-zinc-500 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Prev
                </button>
                <button
                  type="button"
                  onClick={() => setEstablishmentPage((page) => Math.min(establishmentTotalPages, page + 1))}
                  disabled={establishmentPage === establishmentTotalPages}
                  className="px-3 py-2 rounded-xl text-xs font-bold border border-zinc-200 dark:border-white/10 text-zinc-500 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
            <div className="text-[11px] text-zinc-400">
              Page {establishmentPage} of {establishmentTotalPages}
            </div>
            {pagedEstablishments.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {pagedEstablishments.map((establishment) => (
                  <div
                    key={establishment.key}
                    className="rounded-2xl border border-zinc-200 dark:border-white/10 bg-white/70 dark:bg-white/[0.03] p-4"
                  >
                    <p className="text-sm font-bold text-zinc-900 dark:text-white">{establishment.name}</p>
                    <p className="text-xs text-zinc-500 mt-1">{establishment.address}</p>
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedEstablishmentKey((current) =>
                          current === establishment.key ? null : establishment.key,
                        )
                      }
                      className="text-[11px] text-cemo-primary mt-3 font-bold hover:underline"
                    >
                      {establishment.linkedUsers.length} linked users
                    </button>
                    {expandedEstablishmentKey === establishment.key && (
                      <div className="mt-3 space-y-2 border-t border-zinc-200 dark:border-white/10 pt-3">
                        {establishment.linkedUsers.map((linkedUser) => {
                          const linkedUserName =
                            `${linkedUser.firstName || ""} ${linkedUser.lastName || ""}`.trim() ||
                            linkedUser.displayName ||
                            linkedUser.email;

                          return (
                            <button
                              key={linkedUser.uid}
                              type="button"
                              onClick={() => handleViewUser(linkedUser)}
                              className="w-full text-left rounded-lg px-2 py-1.5 hover:bg-zinc-100 dark:hover:bg-white/5"
                            >
                              <p className="text-xs font-bold text-zinc-900 dark:text-white">{linkedUserName}</p>
                              <p className="text-[11px] text-zinc-500">{linkedUser.email}</p>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-zinc-200 dark:border-white/10 bg-white/70 dark:bg-white/[0.03] p-4 text-xs text-zinc-500">
                No establishments match your search.
              </div>
            )}
          </div>
          <SafeUserManagementTable 
            users={users} 
            canModifyUsers={canModifyUsers}
            onView={handleViewUser}
            onEdit={handleEditUser}
            onDelete={handleDeleteUser}
            onRefresh={fetchUsers}
            onAdd={handleAddUser}
          />
        </div>
      )}

      <SafeUserDialog 
        isOpen={isDialogOpen} 
        onClose={() => setIsDialogOpen(false)} 
        onSave={handleSaveUser}
        user={selectedUser}
      />

      <SafeUserDetails 
        isOpen={isDetailsOpen} 
        onClose={() => setIsDetailsOpen(false)} 
        user={selectedUser}
      />
    </DashboardLayout>
  );
}

export { Users };
export default Users;
