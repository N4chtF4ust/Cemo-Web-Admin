import { HugeiconsIcon } from "@hugeicons/react";
import {
  Notification01Icon,
  Sun01Icon,
  Moon01Icon,
  Calendar03Icon
} from "@hugeicons/core-free-icons";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { SidebarTrigger } from "~/components/ui/sidebar";
import { GlobalSearch } from "./GlobalSearch";
import { useCurrentAdmin } from "~/hooks/useCurrentAdmin";
import { UserRole } from "~/lib/firestore/users";
import { setTheme } from "~/lib/theme";

export function Navbar() {
  const navigate = useNavigate();
  const { user, profile } = useCurrentAdmin();
  const [isDark, setIsDark] = useState(document.documentElement.classList.contains("dark"));
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Toggling here records an explicit preference, so the OS no longer overrides it.
  const toggleTheme = () => {
    const next = setTheme(isDark ? "light" : "dark");
    setIsDark(next === "dark");
  };

  const accountName =
    `${profile?.firstName || ""} ${profile?.lastName || ""}`.trim() ||
    profile?.displayName ||
    user?.displayName ||
    user?.email ||
    "Administrator";

  const avatarUrl = profile?.photoUrl || user?.photoURL;

  return (
    <header className="h-20 shrink-0 bg-white/50 dark:bg-black/40 backdrop-blur-xl border-b border-zinc-200 dark:border-white/[0.08] sticky top-0 z-40 px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-3 lg:gap-4">
      <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0">
        <SidebarTrigger />
        
        {/* Search */}
        <GlobalSearch />
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-3 lg:gap-6 shrink-0">
        {/* Date/Time — the sidebar leaves no room for this until well past `lg` */}
        <div className="hidden 2xl:flex items-center gap-2 text-zinc-500 text-xs font-medium uppercase tracking-wider">
          <HugeiconsIcon icon={Calendar03Icon} className="size-4" />
          <span>{currentTime.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
          <span className="opacity-30">|</span>
          <span>{currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={toggleTheme}
            className="p-2.5 bg-white/50 dark:bg-white/[0.03] border border-zinc-200/50 dark:border-white/[0.08] rounded-xl hover:border-cemo-primary/30 transition-all text-zinc-600 dark:text-zinc-400"
          >
            <HugeiconsIcon icon={isDark ? Sun01Icon : Moon01Icon} className="size-5" />
          </button>


          <div className="h-10 w-px bg-zinc-200 dark:bg-white/[0.08] mx-1" />

          <button
            onClick={() => navigate("/settings")}
            title="Account settings"
            className="flex items-center gap-3 pl-1 group"
          >
            <div className="hidden lg:flex flex-col items-end">
              <span className="text-sm font-bold text-zinc-900 dark:text-white group-hover:text-cemo-primary transition-colors max-w-[140px] xl:max-w-[180px] truncate">
                {accountName}
              </span>
              <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-medium">
                {profile?.role === UserRole.ADMIN ? "System Manager" : "Account"}
              </span>
            </div>
            <div className="size-10 rounded-xl bg-gradient-to-br from-cemo-primary/20 to-cemo-primary/5 p-px border border-cemo-primary/20 group-hover:scale-105 transition-transform">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={accountName}
                  className="size-full rounded-[10px] object-cover"
                />
              ) : (
                <div className="size-full rounded-[10px] flex items-center justify-center text-xs font-bold text-cemo-primary">
                  {accountName.slice(0, 2).toUpperCase()}
                </div>
              )}
            </div>
          </button>
        </div>
      </div>
    </header>
  );
}
