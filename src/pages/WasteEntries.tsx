import { useState, useEffect, useMemo } from "react";
import { DashboardLayout } from "~/components/dashboard/DashboardLayout";
import { getWasteEntries, getAllWasteEntries, type WasteEntry } from "~/lib/firestore/wasteEntries";
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
  ArrowRight01Icon,
  ThermometerIcon,
  DropletIcon,
  Building03Icon,
  UserGroupIcon
} from "@hugeicons/core-free-icons";
import { format } from "date-fns";
import { cn } from "~/lib/utils";

const ITEMS_PER_PAGE = 5;

type ViewMode = "individual" | "establishment";

interface EstablishmentSummary {
  key: string;
  name: string;
  address: string;
  uids: string[];
}

export function WasteEntries() {
  const [viewMode, setViewMode] = useState<ViewMode>("individual");
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [selectedEstKey, setSelectedEstKey] = useState<string>("");
  const [search, setSearch] = useState("");
  const [entries, setEntries] = useState<WasteEntry[]>([]);
  const [allEntries, setAllEntries] = useState<WasteEntry[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingEntries, setLoadingEntries] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pagination states
  const [sidebarPage, setSidebarPage] = useState(1);
  const [entryPage, setEntryPage] = useState(1);

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const data = await getUsers();
      setUsers(data);
      if (data.length > 0 && !selectedUserId) {
        const firstIndiv = data.find(u => u.isIndividual);
        if (firstIndiv) setSelectedUserId(firstIndiv.uid);
      }
    } catch (err: any) {
      console.error("WasteEntries: Error fetching users:", err);
      setError("Failed to load users.");
    } finally {
      setLoadingUsers(false);
    }
  };

  const fetchAllEntries = async () => {
    setLoadingEntries(true);
    try {
      const data = await getAllWasteEntries(1000);
      setAllEntries(data);
    } catch (err: any) {
      console.error("WasteEntries: Error fetching all entries:", err);
    } finally {
      setLoadingEntries(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchAllEntries();
  }, []);

  const fetchEntries = async () => {
    if (!selectedUserId) return;
    setLoadingEntries(true);
    setError(null);
    try {
      const data = await getWasteEntries(selectedUserId);
      setEntries(data);
      setEntryPage(1); 
    } catch (err: any) {
      console.error(`WasteEntries: Error fetching entries for ${selectedUserId}:`, err);
      setError(err.message || "Failed to load waste entries.");
    } finally {
      setLoadingEntries(false);
    }
  };

  useEffect(() => {
    if (viewMode === "individual") {
      fetchEntries();
    }
  }, [selectedUserId, viewMode]);

  const individualUsers = useMemo(() => {
    return users.filter(u => u.isIndividual);
  }, [users]);

  const establishments = useMemo(() => {
    const map = new Map<string, EstablishmentSummary>();
    users.filter(u => !u.isIndividual).forEach(user => {
      const name = user.establishmentName || "Unnamed Establishment";
      const address = user.establishmentAddress || "No Address";
      const key = `${name}::${address}`;
      const existing = map.get(key);
      if (existing) {
        existing.uids.push(user.uid);
      } else {
        map.set(key, { key, name, address, uids: [user.uid] });
      }
    });
    const result = Array.from(map.values());
    if (result.length > 0 && !selectedEstKey) {
        setSelectedEstKey(result[0].key);
    }
    return result;
  }, [users, selectedEstKey]);

  const filteredItems = useMemo(() => {
    const query = search.toLowerCase().trim();
    if (viewMode === "individual") {
        return individualUsers.filter(user => 
            (user.displayName?.toLowerCase() || "").includes(query) ||
            (user.email?.toLowerCase() || "").includes(query) ||
            (user.firstName?.toLowerCase() || "").includes(query) ||
            (user.lastName?.toLowerCase() || "").includes(query)
          );
    } else {
        return establishments.filter(est => 
            est.name.toLowerCase().includes(query) ||
            est.address.toLowerCase().includes(query)
        );
    }
  }, [individualUsers, establishments, search, viewMode]);

  const currentEst = establishments.find(e => e.key === selectedEstKey);

  const establishmentEntries = useMemo(() => {
    if (!currentEst) return [];
    return allEntries.filter(entry => entry.userId && currentEst.uids.includes(entry.userId))
      .map(entry => {
        const user = users.find(u => u.uid === entry.userId);
        return {
            ...entry,
            recordedBy: user?.displayName || user?.email || "Unknown User"
        };
      });
  }, [allEntries, currentEst, users]);

  // Reset page on search or mode change
  useEffect(() => {
    setSidebarPage(1);
    setEntryPage(1);
  }, [search, viewMode]);

  // Sidebar Pagination
  const totalSidebarPages = Math.ceil(filteredItems.length / ITEMS_PER_PAGE) || 1;
  const pagedSidebarItems = useMemo(() => {
    const start = (sidebarPage - 1) * ITEMS_PER_PAGE;
    return filteredItems.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredItems, sidebarPage]);

  // Entry Pagination
  const activeEntries = viewMode === "individual" ? entries : establishmentEntries;
  const totalEntryPages = Math.ceil(activeEntries.length / ITEMS_PER_PAGE) || 1;
  const pagedEntries = useMemo(() => {
    const start = (entryPage - 1) * ITEMS_PER_PAGE;
    return activeEntries.slice(start, start + ITEMS_PER_PAGE);
  }, [activeEntries, entryPage]);

  const selectedUser = users.find(u => u.uid === selectedUserId);

  return (
    <DashboardLayout>
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-3xl font-bold text-zinc-900 dark:text-white tracking-tight">Waste Entries</h2>
          <p className="text-zinc-500 text-sm">Monitor and manage waste disposal logs across the system</p>
        </div>
        <div className="flex items-center gap-3">
            <div className="flex bg-zinc-100 dark:bg-white/5 p-1 rounded-xl border border-zinc-200 dark:border-white/10">
                <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setViewMode("individual")}
                    className={cn(
                        "rounded-lg text-xs font-bold gap-2 px-4 transition-all",
                        viewMode === "individual" ? "bg-white dark:bg-white/10 shadow-sm text-cemo-primary" : "text-zinc-500"
                    )}
                >
                    <HugeiconsIcon icon={UserCircleIcon} className="size-3.5" />
                    Individual
                </Button>
                <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setViewMode("establishment")}
                    className={cn(
                        "rounded-lg text-xs font-bold gap-2 px-4 transition-all",
                        viewMode === "establishment" ? "bg-white dark:bg-white/10 shadow-sm text-cemo-primary" : "text-zinc-500"
                    )}
                >
                    <HugeiconsIcon icon={Building03Icon} className="size-3.5" />
                    Establishment
                </Button>
            </div>
            <Button 
            variant="outline" 
            size="sm" 
            onClick={() => { fetchUsers(); fetchEntries(); fetchAllEntries(); }}
            className="rounded-xl border-zinc-200 dark:border-white/10 gap-2 w-fit"
            >
            <HugeiconsIcon icon={Refresh01Icon} className="size-4" />
            Refresh
            </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Sidebar Selector */}
        <Card className="lg:col-span-4 border-zinc-200 dark:border-white/10 bg-white/50 dark:bg-white/[0.02] backdrop-blur-xl flex flex-col h-full">
          <CardHeader className="pb-4">
            <CardTitle className="text-sm font-bold flex items-center justify-between">
              <span className="flex items-center gap-2">
                <HugeiconsIcon icon={viewMode === "individual" ? UserCircleIcon : Building03Icon} className="size-4 text-cemo-primary" />
                Select {viewMode === "individual" ? "User" : "Establishment"}
              </span>
              <Badge variant="outline" className="text-[10px] py-0">{filteredItems.length} total</Badge>
            </CardTitle>
            <div className="relative mt-2">
              <HugeiconsIcon icon={Search01Icon} className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-zinc-400" />
              <Input
                placeholder={`Search ${viewMode === "individual" ? "users" : "establishments"}...`}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
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
              ) : pagedSidebarItems.length > 0 ? (
                pagedSidebarItems.map((item: any) => {
                  if (viewMode === "individual") {
                    const user = item as UserProfile;
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
                  } else {
                    const est = item as EstablishmentSummary;
                    const isActive = selectedEstKey === est.key;
                    return (
                        <button
                          key={est.key}
                          onClick={() => setSelectedEstKey(est.key)}
                          className={cn(
                            "w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left group",
                            isActive 
                              ? "bg-cemo-primary text-white shadow-lg shadow-cemo-primary/20"
                              : "hover:bg-zinc-100 dark:hover:bg-white/5 text-zinc-600 dark:text-zinc-400"
                          )}
                        >
                          <div className={cn("size-10 rounded-full flex items-center justify-center border-2 shrink-0", isActive ? "border-white/20 bg-white/10" : "border-zinc-200 dark:border-white/10 bg-zinc-100 dark:bg-white/5")}>
                            <HugeiconsIcon icon={Building03Icon} className={cn("size-5", isActive ? "text-white" : "text-zinc-400")} />
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className={cn("text-sm font-bold truncate", isActive ? "text-black" : "text-zinc-900 dark:text-white")}>
                              {est.name}
                            </span>
                            <span className={cn("text-[11px] truncate",isActive ? "text-black" : "text-zinc-900 dark:text-white")}>
                              {est.address}
                            </span>
                          </div>
                        </button>
                    );
                  }
                })
              ) : (
                <div className="py-8 text-center px-4">
                  <p className="text-sm text-zinc-500 font-medium">No results match search.</p>
                </div>
              )}
            </div>

            {/* Sidebar Pagination Controls */}
            {totalSidebarPages > 1 && (
              <div className="flex items-center justify-between px-2 pt-4 border-t border-zinc-200 dark:border-white/10 mt-auto">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                  Page {sidebarPage} of {totalSidebarPages}
                </span>
                <div className="flex gap-1">
                  <Button
                    variant="outline"
                    size="icon"
                    className="size-8 rounded-lg"
                    disabled={sidebarPage === 1}
                    onClick={() => setSidebarPage(p => Math.max(1, p - 1))}
                  >
                    <HugeiconsIcon icon={ArrowLeft01Icon} className="size-3.5" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="size-8 rounded-lg"
                    disabled={sidebarPage === totalSidebarPages}
                    onClick={() => setSidebarPage(p => Math.min(totalSidebarPages, p + 1))}
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
              Logs for {viewMode === "individual" 
                ? (selectedUser?.displayName || selectedUser?.email || "Selected User")
                : (currentEst?.name || "Selected Establishment")
              }
            </CardTitle>
            <Badge variant="outline" className="rounded-lg border-cemo-primary/20 text-cemo-primary">
              {activeEntries.length} Entries
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
              ) : error && viewMode === "individual" ? (
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
              ) : activeEntries.length === 0 ? (
                <div className="p-12 text-center flex flex-col items-center gap-6">
                  <div className="p-6 bg-zinc-100 dark:bg-white/5 rounded-3xl">
                    <HugeiconsIcon icon={Note01Icon} className="size-12 text-zinc-400" />
                  </div>
                  <div className="space-y-2">
                    <p className="text-xl font-bold text-zinc-900 dark:text-white">No entries detected</p>
                    <p className="text-sm text-zinc-500 max-w-xs mx-auto">
                      {viewMode === "individual" 
                        ? `UID: ${selectedUserId} has no disposal logs`
                        : `${currentEst?.name} has no collective disposal logs`
                      }
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
                        <TableHead className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">Environment</TableHead>
                        <TableHead className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">Metrics (CH4/CO2)</TableHead>
                        {viewMode === "establishment" && (
                            <TableHead className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">Recorded By</TableHead>
                        )}
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
                                <div className="flex items-center gap-1">
                                  <HugeiconsIcon icon={ThermometerIcon} className="size-2.5 text-zinc-400" />
                                  <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-tighter">Temp</span>
                                </div>
                                <span className="text-[11px] text-zinc-900 dark:text-white font-medium">{entry.temperature.toFixed(1)}°C</span>
                              </div>
                              <div className="flex flex-col">
                                <div className="flex items-center gap-1">
                                  <HugeiconsIcon icon={DropletIcon} className="size-2.5 text-zinc-400" />
                                  <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-tighter">Humid</span>
                                </div>
                                <span className="text-[11px] text-zinc-900 dark:text-white font-medium">{entry.humidity.toFixed(1)}%</span>
                              </div>
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
                          {viewMode === "establishment" && (
                            <TableCell>
                                <div className="flex items-center gap-2">
                                    <div className="p-1.5 bg-zinc-100 dark:bg-white/5 rounded-lg text-zinc-500">
                                        <HugeiconsIcon icon={UserGroupIcon} className="size-3.5" />
                                    </div>
                                    <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                                        {(entry as any).recordedBy}
                                    </span>
                                </div>
                            </TableCell>
                          )}
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
                  Showing logs {(entryPage - 1) * ITEMS_PER_PAGE + 1} to {Math.min(entryPage * ITEMS_PER_PAGE, activeEntries.length)} of {activeEntries.length}
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
