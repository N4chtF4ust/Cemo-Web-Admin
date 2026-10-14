import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "~/lib/firebase";
import { getUserProfile, UserRole } from "~/lib/firestore/users";
import { ErrorPage } from "~/pages/ErrorPage";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

/**
 * A wrapper component that enforces route-level authentication and role authorization.
 * If the user is unauthenticated -> 401 Unauthorized.
 * If the user role is not in allowedRoles -> 403 Forbidden.
 */
export function ProtectedRoute({ 
  children, 
  allowedRoles = [UserRole.ADMIN, UserRole.STAFF] 
}: ProtectedRouteProps) {
  const [loading, setLoading] = useState(true);
  const [authState, setAuthState] = useState<{
    isLoggedIn: boolean;
    hasPermission: boolean;
  }>({
    isLoggedIn: false,
    hasPermission: false,
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setAuthState({ isLoggedIn: false, hasPermission: false });
        setLoading(false);
        return;
      }

      try {
        const profile = await getUserProfile(user.uid);
        const userRole = profile?.role;
        const permitted = !!userRole && allowedRoles.includes(userRole);
        setAuthState({ isLoggedIn: true, hasPermission: permitted });
      } catch (error) {
        console.error("Auth verification failed:", error);
        setAuthState({ isLoggedIn: true, hasPermission: false });
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [allowedRoles]);

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

  // 2. Logged In but Role Not Permitted -> 403 Forbidden
  if (!authState.hasPermission) {
    return <ErrorPage errorCode={403} />;
  }

  // 3. Authorized
  return <>{children}</>;
}
