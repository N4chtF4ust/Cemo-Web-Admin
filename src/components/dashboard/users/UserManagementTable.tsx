import { useState, useMemo } from "react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "~/components/ui/table";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "~/components/ui/dropdown-menu";
import { 
  Pagination, 
  PaginationContent, 
  PaginationEllipsis, 
  PaginationItem, 
  PaginationLink, 
  PaginationNext, 
  PaginationPrevious 
} from "~/components/ui/pagination";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "~/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Badge } from "~/components/ui/badge";
import { HugeiconsIcon } from "@hugeicons/react";
import { 
  MoreHorizontalIcon, 
  ViewIcon, 
  Edit01Icon, 
  Delete01Icon,
  Search01Icon,
  FilterIcon,
  Copy01Icon,
  Mail01Icon,
  Sorting05Icon,
  Download01Icon,
  Refresh01Icon,
  UserAdd01Icon
} from "@hugeicons/core-free-icons";
import { UserRole } from "~/lib/firestore/users";
import type { UserProfile } from "~/lib/firestore/users";
import { cn } from "~/lib/utils";

interface UserManagementTableProps {
  users: UserProfile[];
  onView: (user: UserProfile) => void;
  onEdit: (user: UserProfile) => void;
  onDelete: (uid: string) => void;
  onRefresh: () => void;
  onAdd: () => void;
}

const PAGE_SIZE = 5;

export function UserManagementTable({ 
  users, 
  onView, 
  onEdit, 
  onDelete, 
  onRefresh,
  onAdd
}: UserManagementTableProps) {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("ALL");
  const [sortBy, setSortBy] = useState<string>("newest");
  const [currentPage, setCurrentPage] = useState(1);

  const filteredAndSortedUsers = useMemo(() => {
    return users
      .filter(user => {
        const searchLower = search.toLowerCase();
        const matchesSearch = 
          user.email.toLowerCase().includes(searchLower) ||
          (user.firstName || "").toLowerCase().includes(searchLower) ||
          (user.lastName || "").toLowerCase().includes(searchLower) ||
          (user.displayName || "").toLowerCase().includes(searchLower);
        
        const matchesRole = roleFilter === "ALL" || user.role === roleFilter;
        
        return matchesSearch && matchesRole;
      })
      .sort((a, b) => {
        if (sortBy === "newest") return b.createdAt.getTime() - a.createdAt.getTime();
        if (sortBy === "oldest") return a.createdAt.getTime() - b.createdAt.getTime();
        if (sortBy === "name") return (a.firstName || "").localeCompare(b.firstName || "");
        return 0;
      });
  }, [users, search, roleFilter, sortBy]);

  const totalPages = Math.ceil(filteredAndSortedUsers.length / PAGE_SIZE);
  
  const currentUsers = useMemo(() => {
    const startIndex = (currentPage - 1) * PAGE_SIZE;
    return filteredAndSortedUsers.slice(startIndex, startIndex + PAGE_SIZE);
  }, [filteredAndSortedUsers, currentPage]);

  const handleSearchChange = (val: string) => {
    setSearch(val);
    setCurrentPage(1);
  };

  const handleRoleChange = (val: string) => {
    setRoleFilter(val);
    setCurrentPage(1);
  };

  const handleSortChange = (val: string) => {
    setSortBy(val);
    setCurrentPage(1);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-1 items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <HugeiconsIcon icon={Search01Icon} className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-zinc-400" />
            <Input 
              placeholder="Search by name or email..." 
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-10 rounded-xl border-zinc-200 dark:border-white/10 bg-white/50 dark:bg-white/[0.02] backdrop-blur-md focus:ring-cemo-primary/20"
            />
          </div>
          <Select value={roleFilter} onValueChange={handleRoleChange}>
            <SelectTrigger className="w-[150px] rounded-xl border-zinc-200 dark:border-white/10 bg-white/50 dark:bg-white/[0.02]">
              <div className="flex items-center gap-2">
                <HugeiconsIcon icon={FilterIcon} className="size-3.5 text-zinc-400" />
                <SelectValue placeholder="Role" />
              </div>
            </SelectTrigger>
            <SelectContent className="bg-white dark:bg-zinc-950 border-zinc-200 dark:border-white/10 rounded-xl">
              <SelectItem value="ALL">All Roles</SelectItem>
              <SelectItem value={UserRole.ADMIN}>Administrators</SelectItem>
              <SelectItem value={UserRole.USER}>Standard Users</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={handleSortChange}>
            <SelectTrigger className="w-[150px] rounded-xl border-zinc-200 dark:border-white/10 bg-white/50 dark:bg-white/[0.02]">
              <div className="flex items-center gap-2">
                <HugeiconsIcon icon={Sorting05Icon} className="size-3.5 text-zinc-400" />
                <SelectValue placeholder="Sort By" />
              </div>
            </SelectTrigger>
            <SelectContent className="bg-white dark:bg-zinc-950 border-zinc-200 dark:border-white/10 rounded-xl">
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="oldest">Oldest First</SelectItem>
              <SelectItem value="name">Alphabetical</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="icon" 
            onClick={onRefresh}
            className="rounded-xl border-zinc-200 dark:border-white/10 bg-white/50 dark:bg-white/[0.02] hover:bg-zinc-100 dark:hover:bg-white/5 transition-all"
          >
            <HugeiconsIcon icon={Refresh01Icon} className="size-4" />
          </Button>
          <Button 
            variant="outline" 
            className="rounded-xl border-zinc-200 dark:border-white/10 bg-white/50 dark:bg-white/[0.02] hover:bg-zinc-100 dark:hover:bg-white/5 transition-all font-bold gap-2 text-xs"
          >
            <HugeiconsIcon icon={Download01Icon} className="size-4" />
            Export
          </Button>
          <Button 
            onClick={onAdd}
            className="rounded-xl bg-cemo-primary text-black hover:bg-cemo-primary/90 transition-all font-bold gap-2 text-xs shadow-[0_0_15px_rgba(57,255,20,0.2)]"
          >
            <HugeiconsIcon icon={UserAdd01Icon} className="size-4" />
            Add User
          </Button>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white/70 dark:bg-white/[0.03] backdrop-blur-xl border border-zinc-200 dark:border-white/[0.08] rounded-2xl shadow-sm overflow-hidden flex flex-col min-h-[520px]">
        <div className="flex-1">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-b border-zinc-200 dark:border-white/[0.05]">
                <TableHead className="px-6 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">User</TableHead>
                <TableHead className="px-6 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">UID</TableHead>
                <TableHead className="px-6 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Role</TableHead>
                <TableHead className="px-6 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Joined</TableHead>
                <TableHead className="px-6 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentUsers.length > 0 ? (
                currentUsers.map((user) => {
                  const fullName = user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.displayName || user.email.split('@')[0];
                  const initials = (user.firstName?.[0] || "") + (user.lastName?.[0] || "") || user.displayName?.[0] || user.email[0];

                  return (
                    <TableRow key={user.uid} className="hover:bg-zinc-50/50 dark:hover:bg-white/[0.01] transition-colors border-b border-zinc-200 dark:border-white/[0.05] group">
                      <TableCell className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="size-9 border border-zinc-200/50 dark:border-white/10">
                            <AvatarImage src={user.photoUrl || ""} />
                            <AvatarFallback className="bg-zinc-100 dark:bg-white/5 text-zinc-500 font-bold text-[10px] uppercase">
                              {initials}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-zinc-900 dark:text-white leading-none mb-1">{fullName}</span>
                            <span className="text-xs text-zinc-500">{user.email}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="px-6 py-4">
                        <div className="flex items-center gap-2 group/uid">
                          <code className="text-[10px] font-mono text-zinc-400 bg-zinc-100 dark:bg-white/5 px-2 py-0.5 rounded-md">
                            {user.uid.substring(0, 8)}...
                          </code>
                          <button 
                            onClick={() => copyToClipboard(user.uid)}
                            className="opacity-0 group-hover/uid:opacity-100 p-1 hover:text-cemo-primary transition-all"
                          >
                            <HugeiconsIcon icon={Copy01Icon} className="size-3" />
                          </button>
                        </div>
                      </TableCell>
                      <TableCell className="px-6 py-4">
                        <Badge className={cn(
                          "text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 border",
                          user.role === UserRole.ADMIN 
                            ? "bg-cemo-primary/20 text-cemo-primary border-cemo-primary/30" 
                            : "bg-zinc-100 dark:bg-white/5 text-zinc-500 border-zinc-200/50 dark:border-white/10"
                        )}>
                          {user.role}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-6 py-4 text-xs text-zinc-500 font-medium">
                        {user.createdAt.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </TableCell>
                      <TableCell className="px-6 py-4 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="size-8 p-0 hover:bg-zinc-100 dark:hover:bg-white/5 rounded-lg text-zinc-400">
                              <HugeiconsIcon icon={MoreHorizontalIcon} className="size-5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-56 bg-white dark:bg-zinc-950 border-zinc-200 dark:border-white/10 rounded-2xl p-2 shadow-2xl">
                            <DropdownMenuLabel className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest px-2 py-1.5">User Actions</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => onView(user)} className="rounded-xl gap-2 focus:bg-zinc-100 dark:focus:bg-white/5 cursor-pointer py-2.5">
                              <HugeiconsIcon icon={ViewIcon} className="size-4" />
                              <span className="font-bold text-xs">View Profile</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onEdit(user)} className="rounded-xl gap-2 focus:bg-zinc-100 dark:focus:bg-white/5 cursor-pointer py-2.5">
                              <HugeiconsIcon icon={Edit01Icon} className="size-4" />
                              <span className="font-bold text-xs">Edit User</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => copyToClipboard(user.uid)} className="rounded-xl gap-2 focus:bg-zinc-100 dark:focus:bg-white/5 cursor-pointer py-2.5">
                              <HugeiconsIcon icon={Copy01Icon} className="size-4" />
                              <span className="font-bold text-xs">Copy UID</span>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-zinc-100 dark:bg-white/5" />
                            <DropdownMenuItem className="rounded-xl gap-2 focus:bg-zinc-100 dark:focus:bg-white/5 cursor-pointer py-2.5">
                              <HugeiconsIcon icon={Mail01Icon} className="size-4" />
                              <span className="font-bold text-xs">Reset Password</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onDelete(user.uid)} className="rounded-xl gap-2 focus:bg-red-500/10 focus:text-red-500 text-red-500 cursor-pointer py-2.5">
                              <HugeiconsIcon icon={Delete01Icon} className="size-4" />
                              <span className="font-bold text-xs">Delete Account</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-64 text-center">
                    <div className="flex flex-col items-center justify-center text-zinc-400 gap-4">
                      <HugeiconsIcon icon={Search01Icon} className="size-12 opacity-10" />
                      <p className="font-bold text-sm">No users found matching your criteria</p>
                      <Button variant="link" onClick={() => { handleSearchChange(""); handleRoleChange("ALL"); }} className="text-cemo-primary text-xs font-bold">Clear all filters</Button>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-zinc-200 dark:border-white/[0.05] bg-zinc-50/30 dark:bg-white/[0.01]">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious 
                    href="#" 
                    onClick={(e) => {
                      e.preventDefault();
                      if (currentPage > 1) setCurrentPage(currentPage - 1);
                    }}
                    className={cn(
                      "cursor-pointer",
                      currentPage === 1 && "pointer-events-none opacity-50"
                    )}
                  />
                </PaginationItem>
                
                {Array.from({ length: totalPages }).map((_, i) => {
                  const pageNum = i + 1;
                  // Basic pagination logic to show current, next, and previous pages
                  if (
                    pageNum === 1 || 
                    pageNum === totalPages || 
                    (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                  ) {
                    return (
                      <PaginationItem key={i}>
                        <PaginationLink 
                          href="#" 
                          onClick={(e) => {
                            e.preventDefault();
                            setCurrentPage(pageNum);
                          }}
                          isActive={currentPage === pageNum}
                          className="cursor-pointer"
                        >
                          {pageNum}
                        </PaginationLink>
                      </PaginationItem>
                    );
                  } else if (
                    pageNum === currentPage - 2 || 
                    pageNum === currentPage + 2
                  ) {
                    return (
                      <PaginationItem key={i}>
                        <PaginationEllipsis />
                      </PaginationItem>
                    );
                  }
                  return null;
                })}

                <PaginationItem>
                  <PaginationNext 
                    href="#" 
                    onClick={(e) => {
                      e.preventDefault();
                      if (currentPage < totalPages) setCurrentPage(currentPage + 1);
                    }}
                    className={cn(
                      "cursor-pointer",
                      currentPage === totalPages && "pointer-events-none opacity-50"
                    )}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </div>
    </div>
  );
}
