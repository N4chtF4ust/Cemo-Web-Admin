import { useRouteError, useNavigate } from "react-router-dom";
import { Button } from "~/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import { 
  AlertCircleIcon, 
  ArrowLeft01Icon, 
  Home01Icon 
} from "@hugeicons/core-free-icons";

interface ErrorPageProps {
  errorCode?: number | string;
  customMessage?: string;
}

function ErrorPage({ errorCode: forcedCode, customMessage }: ErrorPageProps) {
  const routeError = useRouteError() as any;
  const navigate = useNavigate();

  // Use forced props if provided, otherwise fallback to route error
  const status = forcedCode || routeError?.status;
  const messageFromError = routeError?.statusText || routeError?.message;

  const getErrorDetails = () => {
    if (status === 401) {
      return {
        title: "401 - Unauthorized",
        message: customMessage || "Authentication is required to access this sector of the matrix. Please log in.",
        code: "401"
      };
    }
    if (status === 403) {
      return {
        title: "403 - Forbidden",
        message: customMessage || "You do not have the required clearance (Admin) to perform this operation.",
        code: "403"
      };
    }
    if (status === 404 || !status) {
      return {
        title: "404 - Page Not Found",
        message: customMessage || "The coordinates you provided do not exist in the current sector of the matrix.",
        code: "404"
      };
    }
    return {
      title: "Unexpected Error",
      message: customMessage || messageFromError || "An unexpected anomaly has occurred in the matrix.",
      code: status?.toString() || "500"
    };
  };

  const { title, message, code } = getErrorDetails();

  return (
    <div className="min-h-screen bg-white dark:bg-black relative overflow-hidden flex items-center justify-center p-4 font-sans selection:bg-cemo-primary/30 transition-colors duration-500">
      {/* Mesh Gradient Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-red-600/10 dark:bg-red-600/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-orange-200/20 dark:bg-orange-950/40 rounded-full blur-[120px] pointer-events-none" />
      
      {/* Glassmorphism Card */}
      <div className="relative w-full max-w-md">
        <div className="absolute inset-0 bg-black/1 dark:bg-white/1 rounded-2xl blur-sm" />
        <div className="relative bg-white/70 dark:bg-[#09090b]/60 backdrop-blur-2xl border border-zinc-200 dark:border-white/8 rounded-2xl p-8 shadow-xl dark:shadow-2xl transition-all text-center">
          {/* Error Icon */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center border border-red-500/20 mb-6 shadow-[0_0_20px_rgba(239,68,68,0.1)] animate-pulse">
              <HugeiconsIcon icon={AlertCircleIcon} className="text-red-600 dark:text-red-400 size-8" />
            </div>
            <h1 className="text-3xl font-bold text-zinc-900 dark:text-white tracking-tight mb-2">{title}</h1>
            <p className="text-zinc-500 dark:text-zinc-400 text-sm">
              {message}
            </p>
          </div>

          <div className="space-y-4">
            {code === "401" ? (
               <Button 
                onClick={() => navigate("/login")}
                className="w-full h-12 bg-cemo-primary text-black hover:bg-cemo-primary/90 border-none font-bold rounded-xl shadow-[0_0_20px_rgba(57,255,20,0.2)] transition-all duration-300"
              >
                Go to Login
              </Button>
            ) : (
              <Button 
                onClick={() => navigate(-1)}
                variant="outline"
                className="w-full h-12 border-zinc-200 dark:border-white/8 dark:bg-white/3 dark:hover:bg-white/8 font-semibold rounded-xl transition-all"
              >
                <HugeiconsIcon icon={ArrowLeft01Icon} className="size-4 mr-2" />
                Retrace Steps
              </Button>
            )}
            
            <Button 
              onClick={() => navigate("/")}
              className="w-full h-12 bg-zinc-100 dark:bg-white/5 text-zinc-900 dark:text-white hover:bg-zinc-200 dark:hover:bg-white/10 border-none font-bold rounded-xl transition-all duration-300"
            >
              <HugeiconsIcon icon={Home01Icon} className="size-4 mr-2" />
              Return to Core
            </Button>
          </div>

          {/* Footer */}
          <div className="mt-8">
            <p className="text-zinc-400 dark:text-zinc-600 text-[10px] uppercase tracking-[0.2em]">
              Status Code: {code}
            </p>
          </div>
        </div>
      </div>

      {/* Decorative Elements */}
      <div className="absolute bottom-4 left-4 flex items-center gap-2 opacity-40 dark:opacity-20">
        <div className="size-1.5 bg-red-500 rounded-full animate-ping" />
        <span className="text-[10px] text-zinc-600 dark:text-white uppercase tracking-tighter">Emergency Protocol Active</span>
      </div>
    </div>
  );
}

export { ErrorPage };
export default ErrorPage;
