import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { auth, db } from "~/lib/firebase";
import { signOut } from "firebase/auth";
import { getUserProfile, UserRole } from "~/lib/firestore/users";
import { ErrorPage } from "~/pages/ErrorPage";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

const DEFAULT_ALLOWED_ROLES: UserRole[] = [UserRole.ADMIN, UserRole.STAFF];

/**
 * A wrapper component that enforces route-level authentication and role authorization.
 * If the user is unauthenticated -> 401 Unauthorized.
 * If the user role is not in allowedRoles -> 403 Forbidden.
 */
export function ProtectedRoute({ 
  children, 
  allowedRoles = DEFAULT_ALLOWED_ROLES
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
    let unsubscribeProfile: (() => void) | undefined;
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      unsubscribeProfile?.();
      unsubscribeProfile = undefined;

      if (!user) {
        setAuthState({ isLoggedIn: false, hasPermission: false });
        setLoading(false);
        return;
      }

      try {
        const profile = await getUserProfile(user.uid);
        if (!profile) {
          await signOut(auth);
          setAuthState({ isLoggedIn: false, hasPermission: false });
          return;
        }

        setAuthState({
          isLoggedIn: true,
          hasPermission: allowedRoles.includes(profile.role),
        });

        const profileRef = doc(db, "users", user.uid);
        unsubscribeProfile = onSnapshot(
          profileRef,
          async (snapshot) => {
            if (!snapshot.exists()) {
              await signOut(auth);
              setAuthState({ isLoggedIn: false, hasPermission: false });
              return;
            }

            const userRole = snapshot.data().role as UserRole | undefined;
            setAuthState({
              isLoggedIn: true,
              hasPermission: !!userRole && allowedRoles.includes(userRole),
            });
          },
          (error) => {
            console.error("Live auth verification failed:", error);
          },
        );

      } catch (error) {
        console.error("Auth verification failed:", error);
        setAuthState({ isLoggedIn: true, hasPermission: false });
      } finally {
        setLoading(false);
      }
    });

    return () => {
      unsubscribeProfile?.();
      unsubscribe();
    };
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
