import { HugeiconsIcon } from "@hugeicons/react";
import { 
  Search01Icon, 
  Notification01Icon, 
  Sun01Icon, 
  Moon01Icon,
  Calendar03Icon
} from "@hugeicons/core-free-icons";
import { useState, useEffect } from "react";
import { SidebarTrigger } from "~/components/ui/sidebar";

export function Navbar() {
  const [isDark, setIsDark] = useState(document.documentElement.classList.contains("dark"));
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const toggleTheme = () => {
    const isDarkNow = document.documentElement.classList.toggle("dark");
    setIsDark(isDarkNow);
  };

  return (
    <header className="h-20 bg-white/50 dark:bg-black/40 backdrop-blur-xl border-b border-zinc-200 dark:border-white/[0.08] sticky top-0 z-40 px-8 flex items-center justify-between gap-4">
      <div className="flex items-center gap-4 flex-1">
        <SidebarTrigger />
        
        {/* Search */}
        <div className="relative w-full max-w-md group">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <HugeiconsIcon icon={Search01Icon} className="size-4 text-zinc-400 group-focus-within:text-cemo-primary transition-colors" />
          </div>
          <input
            type="text"
            placeholder="Search devices, logs, users..."
            className="w-full bg-zinc-100/50 dark:bg-white/[0.03] border border-zinc-200/50 dark:border-white/[0.08] rounded-xl py-2 pl-10 pr-4 text-sm outline-none focus:border-cemo-primary/50 focus:ring-1 focus:ring-cemo-primary/50 transition-all"
          />
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-6 shrink-0">
        {/* Date/Time */}
        <div className="hidden lg:flex items-center gap-2 text-zinc-500 text-xs font-medium uppercase tracking-wider">
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
          
          <button className="p-2.5 bg-white/50 dark:bg-white/[0.03] border border-zinc-200/50 dark:border-white/[0.08] rounded-xl hover:border-cemo-primary/30 transition-all text-zinc-600 dark:text-zinc-400 relative">
            <HugeiconsIcon icon={Notification01Icon} className="size-5" />
            <div className="absolute top-2.5 right-2.5 size-2 bg-cemo-primary rounded-full shadow-[0_0_8px_rgba(57,255,20,0.6)]" />
          </button>

          <div className="h-10 w-px bg-zinc-200 dark:bg-white/[0.08] mx-1" />

          <button className="flex items-center gap-3 pl-1 group">
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-sm font-bold text-zinc-900 dark:text-white group-hover:text-cemo-primary transition-colors">Admin Root</span>
              <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-medium">System Manager</span>
            </div>
            <div className="size-10 rounded-xl bg-gradient-to-br from-cemo-primary/20 to-cemo-primary/5 p-px border border-cemo-primary/20 group-hover:scale-105 transition-transform">
              <img 
                src="https://api.dicebear.com/7.x/avataaars/svg?seed=Admin" 
                alt="Avatar" 
                className="size-full rounded-[10px] object-cover" 
              />
            </div>
          </button>
        </div>
      </div>
    </header>
  );
}
