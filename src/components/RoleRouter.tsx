import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import Index from "@/pages/Index";
import DoctorDashboard from "@/pages/DoctorDashboard";
import PatientDashboard from "@/pages/PatientDashboard";
import Pharmacy from "@/pages/Pharmacy";
import Laboratory from "@/pages/Laboratory";

export function RoleRouter() {
  const { role, isLoading, checkAuth } = useAuth();
  const navigate = useNavigate();
  const [retryCount, setRetryCount] = useState(0);
  const MAX_RETRIES = 2;

  useEffect(() => {
    // If user has no valid role after loading, try to check auth again
    // This handles cases where auth state might be delayed
    if (!isLoading && !role) {
      if (retryCount < MAX_RETRIES) {
        console.log(`[RoleRouter] No role found, retrying auth check (${retryCount + 1}/${MAX_RETRIES})`);
        setTimeout(() => {
          checkAuth();
          setRetryCount(prev => prev + 1);
        }, 500);
      } else {
        // After retries, redirect to auth only if still no role
        const savedRole = localStorage.getItem("userRole");
        if (!savedRole) {
          console.warn("[RoleRouter] No valid role after retries, redirecting to auth");
          navigate("/auth", { replace: true });
        } else {
          console.log("[RoleRouter] Using saved role from localStorage:", savedRole);
        }
      }
    }
  }, [role, isLoading, navigate, retryCount, checkAuth]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  // If no role, try to use saved role from localStorage
  if (!role) {
    const savedRole = localStorage.getItem("userRole") as any;
    if (!savedRole) {
      return <div className="text-center py-10 text-red-500">Invalid user role. Redirecting to login...</div>;
    }
    // Fall through to render with saved role
    return renderDashboard(savedRole);
  }

  return renderDashboard(role);
}

function renderDashboard(normalizedRole: string | null) {
  if (!normalizedRole) return <div className="text-center py-10 text-red-500">Invalid user role.</div>;
  
  const role = normalizedRole?.toLowerCase();
  switch (role) {
    case "admin":
      return <Index />;
    case "doctor":
    case "nurse":
      return <DoctorDashboard />;
    case "patient":
      return <PatientDashboard />;
    case "pharmacist":
      return <Pharmacy />;
    case "lab_staff":
    case "lab_technician":
      return <Laboratory />;
    default:
      return <div className="text-center py-10 text-red-500">Unknown role: {role}. Please log in again.</div>;
  }
}