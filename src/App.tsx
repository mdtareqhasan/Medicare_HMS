import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { RoleRouter } from "@/components/RoleRouter";
import { DashboardLayout } from "@/components/DashboardLayout";
import LandingPage from "./pages/LandingPage";
import Auth from "./pages/Auth";
import UserManagement from "./pages/UserManagement";
import Doctors from "./pages/Doctors";
import Patients from "./pages/Patients";
import PatientDashboard from "./pages/PatientDashboard";
import Appointments from "./pages/Appointments";
import Pharmacy from "./pages/Pharmacy";
import Laboratory from "./pages/Laboratory";
import Billing from "./pages/Billing";
import Analytics from "./pages/Analytics";
import Chat from "./pages/Chat";
import Profile from "./pages/Profile";
import LoginSuccess from "./pages/LoginSuccess";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <ErrorBoundary>
              <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/login-success" element={<LoginSuccess />} />

                <Route path="/dashboard/*" element={
                  <ProtectedRoute>
                    <DashboardLayout>
                      <Routes>
                        <Route index element={<RoleRouter />} />
                        <Route path="user-management" element={<UserManagement />} />
                        <Route path="doctors" element={<Doctors />} />
                        <Route path="patients" element={<Patients />} />
                        <Route path="appointments" element={<Appointments />} />
                        <Route path="pharmacy" element={<Pharmacy />} />
                        <Route path="laboratory" element={<Laboratory />} />
                        <Route path="payments" element={<Billing />} />
                        <Route path="statistic" element={<Analytics />} />
                        <Route path="chat" element={<Chat />} />
                        <Route path="profile" element={<Profile />} />
                        <Route path="*" element={<NotFound />} />
                      </Routes>
                    </DashboardLayout>
                  </ProtectedRoute>
                }
                />
                <Route path="/admin-dashboard" element={<Navigate to="/dashboard" replace />} />
                <Route path="/patient-dashboard" element={<Navigate to="/dashboard" replace />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </ErrorBoundary>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;