import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { Navigate } from "react-router-dom";
import { auth } from "~/lib/firebase";
import { Login } from "~/pages/Login";

/**
 * RootRoute component:
 * - If user is NOT logged in: renders the Login page.
 * - If user IS logged in: redirects to /dashboard.
 */
export function RootRoute() {
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsLoggedIn(!!user);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="size-12 border-4 border-cemo-primary/20 border-t-cemo-primary rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (isLoggedIn) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Login />;
}
