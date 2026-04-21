import { createContext, useContext, useEffect, useState, ReactNode } from "react";

export type AppRole = "admin" | "doctor" | "patient" | "pharmacist" | "nurse" | "lab_staff";

interface User {
  name: string;
  phone: string;
  address: string;
  emergencyContact: string;
  insurance: string;
  id: string;
  email: string;
  role: AppRole;
}

interface AuthContextType {
  user: User | null;
  role: AppRole | null;
  isLoading: boolean; // Property name matched with RoleRouter
  signOut: () => void;
  checkAuth: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const normalizeRole = (rawRole?: string | null): AppRole | null => {
    if (!rawRole) return null;
    const role = rawRole.toLowerCase();
    if (role === "admin" || role === "role_admin") return "admin";
    if (role === "doctor" || role === "role_doctor") return "doctor";
    if (role === "nurse" || role === "role_nurse") return "nurse";
    if (role === "patient" || role === "role_patient") return "patient";
    if (role === "pharmacist" || role === "role_pharmacist") return "pharmacist";
    if (
      role === "lab_staff" ||
      role === "lab-staff" ||
      role === "lab technician" ||
      role === "lab_technician" ||
      role === "lab-technician" ||
      role === "role_lab_technician" ||
      role === "role_lab_staff"
    ) {
      return "lab_staff";
    }
    return null;
  };

  const checkAuth = async () => {
    const TOKEN_KEY = "authToken";
    const ROLE_KEY = "userRole";
    const USER_KEY = "user";
    const token = localStorage.getItem(TOKEN_KEY);
    
    if (!token) {
      setUser(null);
      setRole(null);
      setIsLoading(false);
      return false;
    }

    try {
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api";
      const response = await fetch(`${API_BASE_URL}/users/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        const serverRole = normalizeRole(data.role);
        setUser(data);
        setRole(serverRole);
        if (serverRole) {
          localStorage.setItem(ROLE_KEY, serverRole);
          localStorage.setItem(USER_KEY, JSON.stringify(data));
        } else {
          localStorage.removeItem(ROLE_KEY);
        }
        setIsLoading(false);
        return true;
      }

      if (response.status === 401) {
        // Token is genuinely invalid or expired — clear the session
        console.warn("[Auth] Token rejected by server (401) — clearing session");
        setUser(null);
        setRole(null);
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(ROLE_KEY);
        localStorage.removeItem(USER_KEY);
        setIsLoading(false);
        return false;
      }

      // Non-401/non-ok (e.g. 503 backend down) — use localStorage fallback
      // so we don't log the user out on a transient backend error
      console.warn("[Auth] Unexpected /users/me response:", response.status, "— using localStorage fallback");
      const savedRole = localStorage.getItem(ROLE_KEY) as AppRole;
      const savedUser = localStorage.getItem(USER_KEY);
      if (savedRole) {
        setRole(savedRole);
        if (savedUser) setUser(JSON.parse(savedUser));
      }
      setIsLoading(false);
      return savedRole ? true : false;
    } catch (error) {
      // Network error (backend down) — use localStorage fallback, don't logout
      console.warn("[Auth] checkAuth failed (network/error), using localStorage fallback:", error);
      const savedRole = localStorage.getItem(ROLE_KEY) as AppRole;
      const savedUser = localStorage.getItem(USER_KEY);
      if (savedRole) {
        setRole(savedRole);
        if (savedUser) setUser(JSON.parse(savedUser));
      }
      setIsLoading(false);
      return savedRole ? true : false;
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const signOut = () => {
    const TOKEN_KEY = "authToken";
    const ROLE_KEY = "userRole";
    const USER_KEY = "user";
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(ROLE_KEY);
    localStorage.removeItem(USER_KEY);
    setUser(null);
    setRole(null);
    window.location.href = "/auth";
  };

  return (
    <AuthContext.Provider value={{ user, role, isLoading, signOut, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};