import { useNavigate, useLocation } from "react-router-dom";
import { HugeiconsIcon } from "@hugeicons/react";
import { 
  DashboardCircleIcon, 
  UserGroupIcon, 
  Settings02Icon, 
  Logout01Icon,
  CpuIcon,
  AnalyticsUpIcon,
  Note01Icon,
  Alert01Icon,
  Files01Icon,
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

const data = {
  navMain: [
    { title: "Dashboard", url: "/dashboard", icon: DashboardCircleIcon },
    { title: "Users", url: "/users", icon: UserGroupIcon },
    { title: "IoT Devices", url: "/devices", icon: CpuIcon },
    { title: "Waste Analytics", url: "/analytics", icon: AnalyticsUpIcon },
  ],
  navSecondary: [
    { title: "Waste Entry", url: "/waste-entries", icon: Note01Icon },
    { title: "Alerts", url: "/alerts", icon: Alert01Icon },
    { title: "Reports", url: "/reports", icon: Files01Icon },
  ],
  navSystem: [
    { title: "Settings", url: "/settings", icon: Settings02Icon },
  ]
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      navigate("/login");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <Sidebar variant="sidebar" collapsible="icon" className="border-none" {...props}>
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
              {data.navMain.map((item) => {
                const isActive = location.pathname === item.url;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton 
                      isActive={isActive}
                      onClick={() => navigate(item.url)}
                      tooltip={item.title}
                      className={cn(
                        "transition-all duration-300 rounded-xl px-3 h-11",
                        isActive 
                          ? "bg-cemo-primary text-white font-bold shadow-[0_0_20px_rgba(57,255,20,0.3)] hover:bg-cemo-primary hover:text-white" 
                          : "text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/5"
                      )}
                    >
                      <HugeiconsIcon 
                        icon={item.icon} 

                        className={cn("size-5 shrink-0 transition-transform duration-300", isActive ? "text-white scale-105" : "group-hover:scale-110")} 
                      />
                      <span className="text-sm font-bold tracking-tight">{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
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
              {data.navSecondary.map((item) => {
                const isActive = location.pathname === item.url;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton 
                      isActive={isActive}
                      onClick={() => navigate(item.url)}
                      tooltip={item.title}
                      className={cn(
                        "transition-all duration-300 rounded-xl px-3 h-11",
                        isActive 
                          ? "bg-cemo-primary text-white font-bold shadow-[0_0_20px_rgba(57,255,20,0.3)] hover:bg-cemo-primary hover:text-white" 
                          : "text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/5"
                      )}
                    >
                      <HugeiconsIcon 
                        icon={item.icon} 
                        className={cn("size-5 shrink-0 transition-transform duration-300", isActive ? "text-white scale-105" : "group-hover:scale-110")} 
                      />
                      <span className="text-sm font-bold tracking-tight">{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* System Settings */}
        <SidebarGroup className="mt-auto">
          <SidebarGroupContent>
            <SidebarMenu>
              {data.navSystem.map((item) => {
                const isActive = location.pathname === item.url;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton 
                      isActive={isActive}
                      onClick={() => navigate(item.url)}
                      tooltip={item.title}
                      className={cn(
                        "transition-all duration-300 rounded-xl px-3 h-11",
                        isActive 
                          ? "bg-cemo-primary text-white font-bold shadow-[0_0_20px_rgba(57,255,20,0.3)] hover:bg-cemo-primary hover:text-white" 
                          : "text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/5"
                      )}
                    >
                      <HugeiconsIcon 
                        icon={item.icon} 
                        className={cn("size-5 shrink-0 transition-transform duration-300", isActive ? "text-white scale-105" : "group-hover:scale-110")} 
                      />
                      <span className="text-sm font-bold tracking-tight">{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
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
                  className="text-red-500 hover:bg-red-500/10 hover:text-red-500 transition-all rounded-xl px-3 h-11 group"
                  tooltip="Sign Out"
                >
                  <HugeiconsIcon icon={Logout01Icon} className="size-5 shrink-0 group-hover:rotate-12 transition-transform duration-300" />
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
