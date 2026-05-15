import { useState, useEffect, useMemo } from "react";
import { DashboardLayout } from "~/components/dashboard/DashboardLayout";
import { getWasteEntries, type WasteEntry } from "~/lib/firestore/wasteEntries";
import { getUsers, type UserProfile } from "~/lib/firestore/users";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Skeleton } from "~/components/ui/skeleton";
import { Input } from "~/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { HugeiconsIcon } from "@hugeicons/react";
import { 
  Note01Icon, 
  Calendar03Icon, 
  Files01Icon, 
  UserCircleIcon,
  AlertCircleIcon,
  Refresh01Icon,
  Search01Icon,
  ArrowLeft01Icon,
  ArrowRight01Icon
} from "@hugeicons/core-free-icons";
import { format } from "date-fns";
import { cn } from "~/lib/utils";

const ITEMS_PER_PAGE = 5;

export function WasteEntries() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [userSearch, setUserSearch] = useState("");
  const [entries, setEntries] = useState<WasteEntry[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingEntries, setLoadingEntries] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pagination states
  const [userPage, setUserPage] = useState(1);
  const [entryPage, setEntryPage] = useState(1);

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const data = await getUsers();
      setUsers(data);
      if (data.length > 0 && !selectedUserId) {
        setSelectedUserId(data[0].uid);
      }
    } catch (err: any) {
      console.error("WasteEntries: Error fetching users:", err);
      setError("Failed to load users.");
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchEntries = async () => {
    if (!selectedUserId) return;
    setLoadingEntries(true);
    setError(null);
    try {
      const data = await getWasteEntries(selectedUserId);
      setEntries(data);
      setEntryPage(1); // Reset entries page when user logs change
    } catch (err: any) {
      console.error(`WasteEntries: Error fetching entries for ${selectedUserId}:`, err);
      setError(err.message || "Failed to load waste entries.");
    } finally {
      setLoadingEntries(false);
    }
  };

  useEffect(() => {
    fetchEntries();
  }, [selectedUserId]);

  const filteredUsers = useMemo(() => {
    const query = userSearch.toLowerCase().trim();
    return users.filter(user => 
      (user.displayName?.toLowerCase() || "").includes(query) ||
      (user.email?.toLowerCase() || "").includes(query) ||
      (user.firstName?.toLowerCase() || "").includes(query) ||
      (user.lastName?.toLowerCase() || "").includes(query)
    );
  }, [users, userSearch]);

  // Reset user page when search changes
  useEffect(() => {
    setUserPage(1);
  }, [userSearch]);

  // User Pagination
  const totalUserPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE) || 1;
  const pagedUsers = useMemo(() => {
    const start = (userPage - 1) * ITEMS_PER_PAGE;
    return filteredUsers.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredUsers, userPage]);

  // Entry Pagination
  const totalEntryPages = Math.ceil(entries.length / ITEMS_PER_PAGE) || 1;
  const pagedEntries = useMemo(() => {
    const start = (entryPage - 1) * ITEMS_PER_PAGE;
    return entries.slice(start, start + ITEMS_PER_PAGE);
  }, [entries, entryPage]);

  const selectedUser = users.find(u => u.uid === selectedUserId);

  return (
    <DashboardLayout>
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-3xl font-bold text-zinc-900 dark:text-white tracking-tight">Waste Entries</h2>
          <p className="text-zinc-500 text-sm">Monitor and manage waste disposal logs per user</p>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => { fetchUsers(); fetchEntries(); }}
          className="rounded-xl border-zinc-200 dark:border-white/10 gap-2 w-fit"
        >
          <HugeiconsIcon icon={Refresh01Icon} className="size-4" />
          Refresh Data
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* User Selector Sidebar */}
        <Card className="lg:col-span-4 border-zinc-200 dark:border-white/10 bg-white/50 dark:bg-white/[0.02] backdrop-blur-xl flex flex-col h-full">
          <CardHeader className="pb-4">
            <CardTitle className="text-sm font-bold flex items-center justify-between">
              <span className="flex items-center gap-2">
                <HugeiconsIcon icon={UserCircleIcon} className="size-4 text-cemo-primary" />
                Select User
              </span>
              <Badge variant="outline" className="text-[10px] py-0">{filteredUsers.length} total</Badge>
            </CardTitle>
            <div className="relative mt-2">
              <HugeiconsIcon icon={Search01Icon} className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-zinc-400" />
              <Input
                placeholder="Search users..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="pl-9 rounded-xl border-zinc-200 dark:border-white/10 bg-white/50 dark:bg-zinc-950/50"
              />
            </div>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col space-y-1 px-2 pb-4">
            <div className="flex-1">
              {loadingUsers ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 p-3">
                    <Skeleton className="size-10 rounded-full" />
                    <div className="space-y-1.5 flex-1">
                      <Skeleton className="h-4 w-2/3" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                ))
              ) : pagedUsers.length > 0 ? (
                pagedUsers.map((user) => {
                  const isActive = selectedUserId === user.uid;
                  const name = user.displayName || `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.email;
                  return (
                    <button
                      key={user.uid}
                      onClick={() => setSelectedUserId(user.uid)}
                      className={cn(
                        "w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left group",
                        isActive 
                          ? "bg-cemo-primary text-white shadow-lg shadow-cemo-primary/20"
                          : "hover:bg-zinc-100 dark:hover:bg-white/5 text-zinc-600 dark:text-zinc-400"
                      )}
                    >
                      <Avatar className={cn("size-10 border-2", isActive ? "border-white/20" : "border-zinc-200 dark:border-white/10")}>
                        <AvatarImage src={user.photoUrl || ""} />
                        <AvatarFallback className={cn(isActive ? "bg-white/10 text-white" : "bg-zinc-100 dark:bg-white/5")}>
                          {name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col min-w-0">
                          <span className={cn("text-sm font-bold truncate", isActive ? "text-black" : "text-zinc-900 dark:text-white")}>
                          {name}
                        </span>
                        <span className={cn("text-[11px] truncate",isActive ? "text-black" : "text-zinc-900 dark:text-white")}>
                          {user.email}
                        </span>
                      </div>
                    </button>
                  );
                })
              ) : (
                <div className="py-8 text-center px-4">
                  <p className="text-sm text-zinc-500 font-medium">No users match search.</p>
                </div>
              )}
            </div>

            {/* User Pagination Controls */}
            {totalUserPages > 1 && (
              <div className="flex items-center justify-between px-2 pt-4 border-t border-zinc-200 dark:border-white/10 mt-auto">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                  Page {userPage} of {totalUserPages}
                </span>
                <div className="flex gap-1">
                  <Button
                    variant="outline"
                    size="icon"
                    className="size-8 rounded-lg"
                    disabled={userPage === 1}
                    onClick={() => setUserPage(p => Math.max(1, p - 1))}
                  >
                    <HugeiconsIcon icon={ArrowLeft01Icon} className="size-3.5" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="size-8 rounded-lg"
                    disabled={userPage === totalUserPages}
                    onClick={() => setUserPage(p => Math.min(totalUserPages, p + 1))}
                  >
                    <HugeiconsIcon icon={ArrowRight01Icon} className="size-3.5" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Logs Area */}
        <Card className="lg:col-span-8 border-zinc-200 dark:border-white/10 bg-white/50 dark:bg-white/[0.02] backdrop-blur-xl flex flex-col h-full min-h-[580px]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 border-b border-zinc-200 dark:border-white/10 mb-6">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <HugeiconsIcon icon={Files01Icon} className="size-4 text-cemo-primary" />
              Logs for {selectedUser?.displayName || selectedUser?.email || "Selected User"}
            </CardTitle>
            <Badge variant="outline" className="rounded-lg border-cemo-primary/20 text-cemo-primary">
              {entries.length} Entries
            </Badge>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col">
            <div className="flex-1">
              {loadingEntries ? (
                <div className="space-y-4">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Skeleton key={i} className="h-16 w-full rounded-2xl" />
                  ))}
                </div>
              ) : error ? (
                <div className="p-12 text-center flex flex-col items-center gap-4">
                  <div className="p-4 bg-red-500/10 rounded-2xl text-red-500">
                    <HugeiconsIcon icon={AlertCircleIcon} className="size-8" />
                  </div>
                  <div className="space-y-1">
                    <p className="font-bold text-zinc-900 dark:text-white">Access Anomaly</p>
                    <p className="text-xs text-zinc-500 max-w-xs mx-auto">{error}</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={fetchEntries} className="rounded-xl">Retry Protocol</Button>
                </div>
              ) : entries.length === 0 ? (
                <div className="p-12 text-center flex flex-col items-center gap-6">
                  <div className="p-6 bg-zinc-100 dark:bg-white/5 rounded-3xl">
                    <HugeiconsIcon icon={Note01Icon} className="size-12 text-zinc-400" />
                  </div>
                  <div className="space-y-2">
                    <p className="text-xl font-bold text-zinc-900 dark:text-white">No entries detected</p>
                    <p className="text-sm text-zinc-500 max-w-xs mx-auto">
                      UID: <span className="font-mono bg-zinc-100 dark:bg-white/5 px-1.5 py-0.5 rounded text-[10px]">{selectedUserId}</span> has no disposal logs in <span className="font-mono bg-zinc-100 dark:bg-white/5 px-1.5 py-0.5 rounded text-[10px]">/waste_entries</span>
                    </p>
                  </div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent border-zinc-200 dark:border-white/10">
                        <TableHead className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">Timestamp</TableHead>
                        <TableHead className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">Category</TableHead>
                        <TableHead className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">Weight (kg)</TableHead>
                        <TableHead className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">Metrics (CH4/CO2)</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pagedEntries.map((entry) => (
                        <TableRow key={entry.id} className="group border-zinc-200 dark:border-white/10 hover:bg-zinc-50 dark:hover:bg-white/[0.02] transition-colors">
                          <TableCell className="py-5">
                            <div className="flex items-center gap-3">
                              <div className="p-2.5 bg-blue-500/10 rounded-xl text-blue-500 group-hover:scale-110 transition-transform">
                                <HugeiconsIcon icon={Calendar03Icon} className="size-4" />
                              </div>
                              <div className="flex flex-col">
                                <span className="text-xs font-bold text-zinc-900 dark:text-white">
                                  {format(entry.timestamp, "MMM dd, yyyy")}
                                </span>
                                <span className="text-[10px] text-zinc-500">
                                  {format(entry.timestamp, "HH:mm:ss")}
                                </span>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="bg-zinc-100 dark:bg-white/5 text-zinc-600 dark:text-zinc-400 border-none rounded-lg text-[10px] font-bold uppercase tracking-tight px-2 py-1">
                              {entry.category}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1.5">
                              <span className="text-sm font-bold text-zinc-900 dark:text-white">{entry.weightAdded.toFixed(2)}</span>
                              <span className="text-[10px] text-zinc-500 font-medium uppercase">kg</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="grid grid-cols-2 gap-x-4 gap-y-1 w-fit">
                              <div className="flex flex-col">
                                <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-tighter">CH4</span>
                                <span className="text-[11px] text-zinc-900 dark:text-white font-medium">{entry.methanePotential.toFixed(3)}</span>
                              </div>
                              <div className="flex flex-col">
                                <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-tighter">CO2</span>
                                <span className="text-[11px] text-zinc-900 dark:text-white font-medium">{entry.co2Potential.toFixed(3)}</span>
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>

            {/* Entries Pagination Controls */}
            {totalEntryPages > 1 && (
              <div className="flex items-center justify-between px-2 pt-6 border-t border-zinc-200 dark:border-white/10 mt-auto">
                <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest">
                  Showing logs {(entryPage - 1) * ITEMS_PER_PAGE + 1} to {Math.min(entryPage * ITEMS_PER_PAGE, entries.length)} of {entries.length}
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="rounded-xl border-zinc-200 dark:border-white/10 gap-2 h-9 text-xs font-bold"
                    disabled={entryPage === 1}
                    onClick={() => setEntryPage(p => Math.max(1, p - 1))}
                  >
                    <HugeiconsIcon icon={ArrowLeft01Icon} className="size-4" />
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    className="rounded-xl border-zinc-200 dark:border-white/10 gap-2 h-9 text-xs font-bold"
                    disabled={entryPage === totalEntryPages}
                    onClick={() => setEntryPage(p => Math.min(totalEntryPages, p + 1))}
                  >
                    Next
                    <HugeiconsIcon icon={ArrowRight01Icon} className="size-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

export default WasteEntries;
