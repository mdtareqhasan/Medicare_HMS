import { useEffect, useRef } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isLoading, user, checkAuth } = useAuth();
  const token = localStorage.getItem("authToken");
  const hasCheckedRef = useRef(false);

  useEffect(() => {
    if (!token) {
      console.warn("[ProtectedRoute] No token in localStorage");
      return;
    }
    if (isLoading || user || hasCheckedRef.current) {
      if (user) console.log("[ProtectedRoute] User already loaded:", user.email);
      return;
    }

    hasCheckedRef.current = true;
    // Only check auth once on mount if needed
    if (!user) {
      console.log("[ProtectedRoute] Checking auth status...");
      checkAuth().catch((err) => {
        // Don't logout on transient errors - user might just be loading
        console.warn("[ProtectedRoute] Auth check failed, but continuing:", err?.message);
      });
    }
  }, []); // Empty dependency array - only run once on mount

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!token) {
    return <Navigate to="/auth" replace />;
  }

  // If not loading but no user, show loading (don't redirect yet)
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return <>{children}</>;
}
