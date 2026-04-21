import {
  LayoutDashboard,
  CalendarCheck,
  Users,
  CreditCard,
  BarChart3,
  Leaf,
  Pill,
  ShieldCheck,
  FlaskConical,
  Stethoscope,
  UserRound,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  useSidebar,
} from "@/components/ui/sidebar";

const allNav = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard, roles: ["admin", "doctor", "nurse", "patient", "pharmacist", "lab_staff"] },
  { title: "User Management", url: "/dashboard/user-management", icon: ShieldCheck, roles: ["admin"] },
  { title: "Doctors", url: "/dashboard/doctors", icon: Stethoscope, roles: ["admin", "patient", "nurse"] },
  { title: "Patients", url: "/dashboard/patients", icon: Users, roles: ["admin", "doctor", "nurse"] },
  { title: "Appointment", url: "/dashboard/appointments", icon: CalendarCheck, roles: ["admin", "doctor", "nurse", "patient"] },
  { title: "Pharmacy", url: "/dashboard/pharmacy", icon: Pill, roles: ["admin", "pharmacist"] },
  { title: "Laboratory", url: "/dashboard/laboratory", icon: FlaskConical, roles: ["admin", "doctor", "lab_staff", "LAB_TECHNICIAN"] },
  { title: "Payments", url: "/dashboard/payments", icon: CreditCard, roles: ["admin"] },
  { title: "Statistic", url: "/dashboard/statistic", icon: BarChart3, roles: ["admin", "doctor"] },
  { title: "Profile", url: "/dashboard/profile", icon: UserRound, roles: ["admin", "doctor", "nurse", "patient", "pharmacist", "lab_staff"] },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const { role } = useAuth();

  const filterByRole = (items: typeof allNav) =>
    items.filter((item) => !role || item.roles.includes(role));

  const renderItems = (items: typeof allNav) =>
    filterByRole(items).map((item) => {
      const active = location.pathname === item.url;
      return (
        <SidebarMenuItem key={item.title}>
          <SidebarMenuButton asChild isActive={active} tooltip={item.title}>
            <NavLink
              to={item.url}
              end={item.url === "/dashboard"}
              className={`group flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all duration-300 ${
                active
                  ? "nav-glow text-white font-semibold scale-[1.02]"
                  : "text-white/55 hover:bg-gradient-to-r hover:from-white/[0.08] hover:to-white/[0.03] hover:text-white hover:scale-[1.01] hover:shadow-[0_0_12px_-4px_rgba(20,184,166,0.2)]"
              }`}
              activeClassName=""
            >
              <div className={`flex items-center justify-center h-8 w-8 rounded-lg shrink-0 transition-all duration-300 ${
                active
                  ? "bg-white/20 shadow-[0_0_10px_rgba(255,255,255,0.1)]"
                  : "bg-white/[0.06] group-hover:bg-white/[0.12]"
              }`}>
                <item.icon className="h-[16px] w-[16px]" />
              </div>
              {!collapsed && <span className="text-[13px] tracking-wide">{item.title}</span>}
            </NavLink>
          </SidebarMenuButton>
        </SidebarMenuItem>
      );
    });

  return (
    <Sidebar collapsible="icon" className="border-none">
      <div className="glass-sidebar h-full flex flex-col">
        <SidebarHeader className="p-5 pb-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/15">
              <Leaf className="h-5 w-5 text-white" />
            </div>
            {!collapsed && (
              <span className="text-xl font-extrabold text-white tracking-tight">
                Medicare
              </span>
            )}
          </div>
        </SidebarHeader>
        <SidebarContent className="px-3">
          <SidebarGroup>
            <SidebarGroupLabel className="text-white/35 text-[10px] uppercase tracking-[0.2em] font-bold mb-2 px-3">
              Menu
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="space-y-0.5">{renderItems(allNav)}</SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </div>
    </Sidebar>
  );
}
