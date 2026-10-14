import { useNavigate, useLocation } from "react-router-dom";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  DashboardCircleIcon,
  UserGroupIcon,
  Logout01Icon,
  Note01Icon,
  Files01Icon,
  Settings02Icon,
} from "@hugeicons/core-free-icons";
import { 
  Sidebar, 
  SidebarContent, 
  SidebarFooter, 
  SidebarHeader, 
  SidebarMenu, 
  SidebarMenuButton, 
  SidebarMenuItem,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
} from "~/components/ui/sidebar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "~/components/ui/alert-dialog";
import { cn } from "~/lib/utils";
import appIconSrc from "~/assets/icon.png";
import { auth } from "~/lib/firebase";
import { signOut } from "firebase/auth";
import { useCurrentAdmin } from "~/hooks/useCurrentAdmin";
import { UserRole } from "~/lib/firestore/users";

interface NavEntry {
  title: string;
  url: string;
  icon: typeof DashboardCircleIcon;
  adminOnly?: boolean;
}

const data: { navMain: NavEntry[]; navSecondary: NavEntry[] } = {
  navMain: [
    { title: "Dashboard", url: "/dashboard", icon: DashboardCircleIcon },
    { title: "Users", url: "/users", icon: UserGroupIcon, adminOnly: true },
  ],
  navSecondary: [
    { title: "Waste Entry", url: "/waste-entries", icon: Note01Icon },
    { title: "Reports", url: "/reports", icon: Files01Icon, adminOnly: true },
    { title: "Settings", url: "/settings", icon: Settings02Icon },
  ],
};

/**
 * Every nav row renders through here so the two groups cannot drift apart.
 *
 * Idle and hover states use the sidebar tokens (--sidebar-accent) rather than
 * fixed zinc values, which kept them tied to the panel surface instead of the
 * page background. Active rows are black-on-primary, matching the primary
 * buttons elsewhere in the console; white on #39ff14 is barely legible.
 */
function NavItem({
  item,
  isActive,
  onSelect,
}: {
  item: NavEntry;
  isActive: boolean;
  onSelect: () => void;
}) {
  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        isActive={isActive}
        onClick={onSelect}
        tooltip={item.title}
        className={cn(
          // Named group so the hover effect is scoped to this row, not the
          // whole sidebar (the bare `group` class belongs to the sidebar root).
          "group/nav h-11 rounded-xl px-3 transition-colors duration-200",
          isActive
            ? // Marked important: the base button ships data-active:bg-sidebar-accent,
              // which is emitted later in the stylesheet at equal specificity and
              // would otherwise repaint the active row in the accent grey.
              "bg-cemo-primary! text-black! font-bold! shadow-[0_0_20px_rgba(57,255,20,0.25)]"
            : "text-zinc-500 dark:text-zinc-400 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
        )}
      >
        {/* No colour of its own: the icon inherits the row's text colour, so it
            can never end up dark-on-dark if the row styling changes. */}
        <HugeiconsIcon
          icon={item.icon}
          className={cn(
            "size-5 shrink-0 transition-transform duration-200",
            !isActive && "group-hover/nav:scale-110",
          )}
        />
        <span className="text-sm font-bold tracking-tight">{item.title}</span>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const navigate = useNavigate();
  const location = useLocation();
  const { profile } = useCurrentAdmin();
  const isAdmin = profile?.role === UserRole.ADMIN;

  const visibleNavMain = data.navMain.filter((item) => !item.adminOnly || isAdmin);
  const visibleNavSecondary = data.navSecondary.filter((item) => !item.adminOnly || isAdmin);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      navigate("/login");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <Sidebar
      variant="sidebar"
      collapsible="icon"
      className="border-r border-zinc-200 dark:border-white/[0.08]"
      {...props}
    >
      <SidebarHeader className="h-20 flex justify-center">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" className="hover:bg-transparent cursor-default group-data-[collapsible=icon]:p-0">
              <div className="flex size-9 items-center justify-center rounded-xl bg-cemo-primary/10 border border-cemo-primary/20 shadow-[0_0_15px_rgba(57,255,20,0.1)] shrink-0 group-data-[collapsible=icon]:size-8">
                <img src={appIconSrc} alt="Logo" className="size-5 object-contain group-data-[collapsible=icon]:size-4" />
              </div>
              <div className="flex flex-col gap-0.5 leading-none group-data-[collapsible=icon]:hidden">
                <span className="font-bold text-xl text-zinc-900 dark:text-white tracking-tight uppercase">CEMO</span>
                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.2em]">Eco-Tech</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      
      <SidebarContent>
        {/* Main Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel className="px-4 text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400 mb-2">
            Control Center
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {visibleNavMain.map((item) => (
                <NavItem
                  key={item.title}
                  item={item}
                  isActive={location.pathname === item.url}
                  onSelect={() => navigate(item.url)}
                />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Operations */}
        <SidebarGroup>
          <SidebarGroupLabel className="px-4 text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400 mb-2">
            Operations
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {visibleNavSecondary.map((item) => (
                <NavItem
                  key={item.title}
                  item={item}
                  isActive={location.pathname === item.url}
                  onSelect={() => navigate(item.url)}
                />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

      </SidebarContent>
      
      <SidebarFooter className="border-none">
        <SidebarMenu>
          <SidebarMenuItem>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <SidebarMenuButton
                  className="group/nav h-11 rounded-xl px-3 text-red-500 transition-colors duration-200 hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400"
                  tooltip="Sign Out"
                >
                  <HugeiconsIcon
                    icon={Logout01Icon}
                    className="size-5 shrink-0 transition-transform duration-200 group-hover/nav:rotate-12"
                  />
                  <span className="text-sm font-bold tracking-tight">Sign Out</span>
                </SidebarMenuButton>
              </AlertDialogTrigger>
              <AlertDialogContent className="bg-white/90 dark:bg-zinc-950/90 backdrop-blur-xl border border-zinc-200 dark:border-white/10 rounded-2xl">
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-zinc-900 dark:text-white font-bold">End Session?</AlertDialogTitle>
                  <AlertDialogDescription className="text-zinc-500 dark:text-zinc-400">
                    Are you sure you want to sign out? You will need to re-authenticate to access the CEMO Admin Panel.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="rounded-xl border-zinc-200 dark:border-white/10 bg-transparent hover:bg-zinc-100 dark:hover:bg-white/5 text-zinc-600 dark:text-zinc-400 font-bold">
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={handleSignOut}
                    className="rounded-xl bg-red-500 hover:bg-red-600 text-white border-none font-bold shadow-lg shadow-red-500/20"
                  >
                    Sign Out
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
