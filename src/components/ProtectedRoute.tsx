import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "~/lib/firebase";
import { getUserProfile, UserRole } from "~/lib/firestore/users";
import { ErrorPage } from "~/pages/ErrorPage";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

/**
 * A wrapper component that restricts access to Admin users only.
 * If the user is unauthenticated or does not have the ADMIN role, 
 * it renders the ErrorPage with the appropriate HTTP status code.
 */
export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const [loading, setLoading] = useState(true);
  const [authState, setAuthState] = useState<{
    isLoggedIn: boolean;
    isAdmin: boolean;
  }>({
    isLoggedIn: false,
    isAdmin: false,
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setAuthState({ isLoggedIn: false, isAdmin: false });
        setLoading(false);
        return;
      }

      try {
        const profile = await getUserProfile(user.uid);
        if (profile?.role === UserRole.ADMIN) {
          setAuthState({ isLoggedIn: true, isAdmin: true });
        } else {
          setAuthState({ isLoggedIn: true, isAdmin: false });
        }
      } catch (error) {
        console.error("Auth verification failed:", error);
        setAuthState({ isLoggedIn: true, isAdmin: false });
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="size-12 border-4 border-cemo-primary/20 border-t-cemo-primary rounded-full animate-spin" />
          <p className="text-zinc-500 font-bold text-xs uppercase tracking-[0.2em]">Verifying Access</p>
        </div>
      </div>
    );
  }

  // 1. Not Logged In -> 401 Unauthorized
  if (!authState.isLoggedIn) {
    return <ErrorPage errorCode={401} />;
  }

  // 2. Logged In but Not Admin -> 403 Forbidden
  if (!authState.isAdmin) {
    return <ErrorPage errorCode={403} />;
  }

  // 3. Authorized Admin
  return <>{children}</>;
}
