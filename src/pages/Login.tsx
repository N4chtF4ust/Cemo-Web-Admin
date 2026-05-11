import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "~/components/ui/button";
import { LeafCursor } from "~/components/effects/LeafCursor";

import { HugeiconsIcon } from "@hugeicons/react";
import { 
  Mail01Icon, 
  LockIcon, 
  ArrowRight01Icon, 
  ViewIcon, 
  ViewOffSlashIcon, 
  Cancel01Icon 
} from "@hugeicons/core-free-icons";

import appIconSrc from "~/assets/icon.png";

export function Login() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isHoveringForm, setIsHoveringForm] = useState(false);

  const getAuthErrorMessage = (error: unknown) => {
    const errorCode =
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      typeof (error as { code?: unknown }).code === "string"
        ? (error as { code: string }).code
        : undefined;

    switch (errorCode) {
      case "auth/invalid-email":
        return "Please enter a valid email address.";
      case "auth/missing-password":
        return "Please enter your access key.";
      case "auth/weak-password":
        return "Access key must be at least 6 characters.";
      case "auth/email-already-in-use":
      case "auth/invalid-credential":
      case "auth/wrong-password":
      case "auth/user-not-found":
        return "Invalid credentials. Check your registry ID and access key.";
      default:
        return "Unable to initialize session. Please try again.";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || !password) {
      setErrorMessage("Registry ID and access key are required.");
      return;
    }

    setIsSubmitting(true);

    try {
      const [
        { signInWithEmailAndPassword, signOut },
        { auth },
        { getUserProfile, UserRole },
      ] = await Promise.all([
        import("firebase/auth"),
        import("~/lib/firebase"),
        import("~/lib/firestore/users"),
      ]);

      const credential = await signInWithEmailAndPassword(auth, normalizedEmail, password);

      const existingProfile = await getUserProfile(credential.user.uid);
      if (!existingProfile) {
        await signOut(auth);
        throw new Error("User profile not found. Please contact an administrator.");
      }

      if (existingProfile.role !== UserRole.ADMIN) {
        await signOut(auth);
        throw new Error("Unauthorized access. Only administrators can login.");
      }

      navigate("/");
    } catch (error) {
      if (error instanceof Error && (
        error.message === "User profile not found. Please contact an administrator." ||
        error.message === "Unauthorized access. Only administrators can login."
      )) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage(getAuthErrorMessage(error));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-black relative overflow-hidden flex items-center justify-center p-4 font-sans selection:bg-cemo-primary/30 transition-colors duration-500 cursor-default">
      {/* Reusable Leaf Cursor Effect */}
      <LeafCursor active={!isHoveringForm} />

      {/* Mesh Gradient Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-cemo-primary/10 dark:bg-cemo-primary/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-cemo-primary/20 dark:bg-cemo-primary/40 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] bg-cemo-primary/10 dark:bg-cemo-primary/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Glassmorphism Card */}
      <div 
        className="relative w-full max-md:max-w-md w-full max-w-md z-10"
        onMouseEnter={() => setIsHoveringForm(true)}
        onMouseLeave={() => setIsHoveringForm(false)}
      >
        <div className="absolute inset-0 bg-black/[0.01] dark:bg-white/[0.01] rounded-2xl blur-sm" />
        <div className="relative bg-white/70 dark:bg-[#09090b]/60 backdrop-blur-2xl border border-zinc-200 dark:border-white/[0.08] rounded-2xl p-8 shadow-xl dark:shadow-2xl transition-all">
          {/* Logo / Header */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-20 h-20 bg-white/50 dark:bg-white/[0.03] backdrop-blur-xl rounded-3xl flex items-center justify-center border border-zinc-200/50 dark:border-white/[0.08] mb-6 shadow-[0_10px_30px_rgba(57,255,20,0.1)] transition-all duration-500 hover:shadow-[0_15px_40px_rgba(57,255,20,0.2)] hover:scale-105 group/logo relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-tr from-cemo-primary/10 to-transparent opacity-0 group-hover/logo:opacity-100 transition-opacity duration-500" />
              <img 
                src={appIconSrc}
                alt="CEMO Logo" 
                className="w-14 h-14 object-contain relative z-10 drop-shadow-[0_0_10px_rgba(57,255,20,0.2)]" 
              />
            </div>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-white tracking-tight">CEMO</h1>
            <p className="text-zinc-500 dark:text-zinc-500 text-sm mt-1">Welcome back</p>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Email Field */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider ml-1">
                Registry ID
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <HugeiconsIcon icon={Mail01Icon} className="size-4 text-zinc-400 dark:text-zinc-600 group-focus-within:text-cemo-primary dark:group-focus-within:text-cemo-primary transition-colors" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@cemo.tech"
                  className="w-full bg-zinc-50 dark:bg-white/[0.03] border border-zinc-200 dark:border-white/[0.1] rounded-xl py-3 pl-10 pr-10 text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-600 outline-none focus:border-cemo-primary/50 focus:ring-1 focus:ring-cemo-primary/50 transition-all"
                />
                {email && (
                  <button 
                    type="button"
                    onClick={() => setEmail("")}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-400 hover:text-zinc-600 dark:text-zinc-600 dark:hover:text-zinc-400 transition-colors"
                  >
                    <HugeiconsIcon icon={Cancel01Icon} className="size-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <div className="flex justify-between items-center ml-1">
                <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                  Access Key
                </label>
                <button type="button" className="text-[10px] text-cemo-primary hover:opacity-80 transition-colors uppercase tracking-widest font-bold">
                  Recover
                </button>
              </div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <HugeiconsIcon icon={LockIcon} className="size-4 text-zinc-400 dark:text-zinc-600 group-focus-within:text-cemo-primary dark:group-focus-within:text-cemo-primary transition-colors" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-zinc-50 dark:bg-white/[0.03] border border-zinc-200 dark:border-white/[0.1] rounded-xl py-3 pl-10 pr-20 text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-600 outline-none focus:border-cemo-primary/50 focus:ring-1 focus:ring-cemo-primary/50 transition-all"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center gap-2">
                  {password && (
                    <button 
                      type="button"
                      onClick={() => setPassword("")}
                      className="text-zinc-400 hover:text-zinc-600 dark:text-zinc-600 dark:hover:text-zinc-400 transition-colors"
                    >
                      <HugeiconsIcon icon={Cancel01Icon} className="size-4" />
                    </button>
                  )}
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-zinc-400 hover:text-zinc-600 dark:text-zinc-600 dark:hover:text-zinc-400 transition-colors"
                  >
                    <HugeiconsIcon icon={showPassword ? ViewOffSlashIcon : ViewIcon} className="size-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <Button 
              type="submit"
              disabled={isSubmitting}
              className="w-full h-12 bg-cemo-primary text-black hover:bg-cemo-primary/90 border-none font-bold rounded-xl shadow-[0_0_20px_rgba(57,255,20,0.2)] hover:shadow-[0_0_25px_rgba(57,255,20,0.4)] transition-all duration-300 group"
            >
              {isSubmitting ? "Initializing..." : "Initialize Session"}
              <HugeiconsIcon icon={ArrowRight01Icon} className="size-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
            {errorMessage && (
              <p className="text-xs text-red-500 text-center">{errorMessage}</p>
            )}
          </form>

          {/* Footer */}
          <div className="mt-8 text-center">
            <p className="text-zinc-400 dark:text-zinc-600 text-[10px] uppercase tracking-[0.2em]">
              Authorized personnel only
            </p>
          </div>
        </div>
      </div>

      {/* Decorative Elements */}
      <div className="absolute bottom-4 left-4 flex items-center gap-2 opacity-40 dark:opacity-20">
        <div className="size-1.5 bg-cemo-primary rounded-full animate-pulse" />
        <span className="text-[10px] text-zinc-600 dark:text-white uppercase tracking-tighter">System Online</span>
      </div>
    </div>
  );
}
