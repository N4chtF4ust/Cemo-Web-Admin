import { SidebarProvider, SidebarInset } from "~/components/ui/sidebar";
import { TooltipProvider } from "~/components/ui/tooltip";
import { AppSidebar } from "./AppSidebar";
import { Navbar } from "./Navbar";

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <TooltipProvider>
      <SidebarProvider>
        <AppSidebar />
        {/*
         * The shell is exactly one viewport tall and `main` is the only scroll
         * container. Previously the inset was `min-h-screen`, so `main` had no
         * bounded height, its `overflow-y-auto` never engaged and the document
         * itself scrolled — which dragged the navbar and sidebar out of view on
         * long pages (Users being the longest).
         */}
        <SidebarInset className="bg-zinc-100 dark:bg-black transition-colors duration-500 flex flex-col h-svh overflow-hidden">
          <Navbar />
          <main className="flex-1 min-h-0 p-4 sm:p-6 lg:p-8 overflow-x-hidden overflow-y-auto">
            {/*
             * Container, not viewport, drives the layout below: the sidebar eats
             * 256px (48px collapsed) of a `md:` viewport, so a 768px tablet only
             * has ~464px of content — narrower than the phone breakpoint above it.
             */}
            <div className="@container max-w-[1600px] mx-auto space-y-6 lg:space-y-8 relative z-10">
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
