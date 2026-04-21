import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export default function LoginSuccess() {
  const navigate = useNavigate();
  const { checkAuth } = useAuth();

  useEffect(() => {
    const doLoginSuccess = async () => {
      const params = new URLSearchParams(window.location.search);
      const token = params.get("token");

      if (!token) {
        navigate("/auth", { replace: true });
        return;
      }

      // Consistently use authToken key
      localStorage.setItem("authToken", token);

      // Give auth context a moment to detect the new token
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const success = await checkAuth();
      if (success) {
        window.history.replaceState({}, document.title, "/dashboard");
        navigate("/dashboard", { replace: true });
      } else {
        // If checkAuth fails, still navigate to dashboard - ProtectedRoute will handle
        navigate("/dashboard", { replace: true });
      }
    };

    doLoginSuccess();
  }, [navigate, checkAuth]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="animate-spin h-10 w-10 border-2 border-primary border-t-transparent rounded-full" />
    </div>
  );
}

