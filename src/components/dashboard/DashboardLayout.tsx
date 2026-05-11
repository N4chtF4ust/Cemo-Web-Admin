import { SidebarProvider, SidebarInset } from "~/components/ui/sidebar";
import { TooltipProvider } from "~/components/ui/tooltip";
import { AppSidebar } from "./AppSidebar";
import { Navbar } from "./Navbar";

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <TooltipProvider>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset className="bg-zinc-50 dark:bg-black transition-colors duration-500 flex flex-col min-h-screen">
          <Navbar />
          <main className="flex-1 p-8 overflow-y-auto">
            <div className="max-w-[1600px] mx-auto space-y-8 relative z-10">
              {children}
            </div>
          </main>
          
          {/* Background Mesh Glows - contained within the main content area */}
          <div className="fixed top-0 right-0 w-[50%] h-[50%] bg-cemo-primary/5 dark:bg-cemo-primary/10 rounded-full blur-[120px] pointer-events-none -z-0" />
          <div className="fixed bottom-0 left-0 w-[40%] h-[40%] bg-cemo-primary/10 dark:bg-cemo-primary/20 rounded-full blur-[120px] pointer-events-none -z-0" />
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  );
}
