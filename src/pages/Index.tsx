import { useState, useEffect } from "react";

import { useAuth } from "@/contexts/AuthContext";
import {
  CalendarCheck,
  Phone,
  Stethoscope,
  Users,
  TrendingUp,
  TrendingDown,
  MoreHorizontal,
  Plus,
  ExternalLink,
  AlertCircle,
  ArrowRight,
  FileText,
  Pill,
  FlaskConical,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { format } from "date-fns";
import { dashboardService } from "@/api/dashboardService";
import { appointmentService } from "@/api/appointmentService";

/* ─── Sparkline SVG ─── */
function Sparkline({ points, color }: { points: number[]; color: string }) {
  const h = 20;
  const w = 52;
  const max = Math.max(...points);
  const min = Math.min(...points);
  const range = max - min || 1;
  const coords = points
    .map((p, i) => `${(i / (points.length - 1)) * w},${h - ((p - min) / range) * h}`)
    .join(" ");
  return (
    <svg width={w} height={h} className="shrink-0">
      <polyline points={coords} fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ─── Skeletons ─── */
function CardSkeleton() {
  return (
    <div className="dashboard-card p-5 space-y-3">
      <div className="flex items-center gap-3">
        <div className="h-11 w-11 rounded-2xl skeleton-shimmer" />
        <div className="h-4 w-24 rounded skeleton-shimmer" />
      </div>
      <div className="h-8 w-20 rounded skeleton-shimmer" />
      <div className="h-3 w-32 rounded skeleton-shimmer" />
    </div>
  );
}

export default function Index() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [profileName, setProfileName] = useState("");
  const [stats, setStats] = useState({
    totalPatients: 0,
    totalDoctors: 0,
    totalAppointments: 0,
    upcomingAppointments: 0,
    totalPrescriptions: 0,
    totalLabReports: 0,
    totalBillingPaid: 0,
    totalBillingPending: 0,
  });
  const [monthlyData, setMonthlyData] = useState<{ month: string; appointments: number; patients: number }[]>([]);
  const [todayAppointments, setTodayAppointments] = useState<any[]>([]);
  const [recentAppointments, setRecentAppointments] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    setLoading(true);

    try {
      setProfileName(user?.email?.split("@")[0] || "Admin");

      const statsData = await dashboardService.getDashboardStats();

      setStats({
        totalPatients: statsData.totalPatients,
        totalDoctors: statsData.totalDoctors,
        totalAppointments: statsData.totalAppointments,
        upcomingAppointments: statsData.appointmentsToday,
        totalPrescriptions: 0,
        totalLabReports: 0,
        totalBillingPaid: Math.round(statsData.totalRevenue),
        totalBillingPending: 0,
      });

      const appnts = await appointmentService.getAllAppointments();

      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date(todayStart);
      todayEnd.setDate(todayStart.getDate() + 1);

      const todayList = appnts.filter((a) => {
        const dt = new Date(a.appointmentDate);
        return dt >= todayStart && dt < todayEnd;
      });

      setTodayAppointments(todayList);

      const recentList = appnts
        .slice()
        .sort((a, b) => new Date(b.appointmentDate).getTime() - new Date(a.appointmentDate).getTime())
        .slice(0, 10);

      setRecentAppointments(recentList);

      const monthNames = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
      const monthMap: Record<string, { appointments: number; patients: Set<number> }> = {};
      monthNames.forEach((m) => {
        monthMap[m] = { appointments: 0, patients: new Set() };
      });

      appnts.forEach((a) => {
        const d = new Date(a.appointmentDate);
        const m = monthNames[d.getMonth()];
        monthMap[m].appointments += 1;
        if (a.patient?.id) {
          monthMap[m].patients.add(a.patient.id);
        }
      });

      setMonthlyData(monthNames.map((m) => ({
        month: m,
        appointments: monthMap[m].appointments,
        patients: monthMap[m].patients.size,
      })));
    } catch (error) {
      console.error("Failed to load dashboard data", error);
    } finally {
      setLoading(false);
    }
  };

  const today = new Date();
  const formattedDate = format(today, "EEEE, do MMMM");

  const safeNumber = (value: number | undefined | null) => Number(value || 0);

  const statCards = [
    {
      title: "Total Patients",
      value: safeNumber(stats.totalPatients).toLocaleString(),
      icon: Users,
      highlight: true,
      spark: [2, 3, 5, 4, 6, 7, safeNumber(stats.totalPatients) > 0 ? 8 : 1],
    },
    {
      title: "Total Doctors",
      value: safeNumber(stats.totalDoctors).toLocaleString(),
      icon: Stethoscope,
      spark: [3, 4, 3, 5, 6, 5, safeNumber(stats.totalDoctors) > 0 ? 7 : 1],
    },
    {
      title: "Appointments",
      value: safeNumber(stats.totalAppointments).toLocaleString(),
      icon: CalendarCheck,
      spark: [1, 3, 2, 5, 4, 6, safeNumber(stats.totalAppointments) > 0 ? 7 : 1],
    },
    {
      title: "Upcoming",
      value: safeNumber(stats.upcomingAppointments).toLocaleString(),
      icon: Phone,
      spark: [2, 4, 3, 5, 4, 6, safeNumber(stats.upcomingAppointments) > 0 ? 5 : 1],
    },
  ];

  if (loading) {
    return (
      <div className="space-y-5">
        <div className="space-y-2">
          <div className="h-7 w-52 rounded-lg skeleton-shimmer" />
          <div className="h-4 w-80 rounded skeleton-shimmer" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => <CardSkeleton key={i} />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 dashboard-card p-6">
            <div className="h-5 w-36 rounded skeleton-shimmer mb-6" />
            <div className="h-[280px] rounded-2xl skeleton-shimmer" />
          </div>
          <div className="dashboard-card p-5 space-y-4">
            <div className="h-5 w-36 rounded skeleton-shimmer" />
            <div className="flex gap-2">{[1,2,3,4,5,6].map(i=><div key={i} className="h-14 flex-1 rounded-xl skeleton-shimmer"/>)}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 animate-fade-in-up">
        <div>
          <h1 className="text-xl md:text-2xl font-extrabold text-foreground tracking-tight">Hello, {profileName} 👋</h1>
          <p className="text-xs md:text-sm text-muted-foreground mt-1">
            Here's your hospital overview for today
          </p>
        </div>
        <div className="hidden md:flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-foreground shadow-sm hover-lift cursor-pointer">
          <CalendarCheck className="h-4 w-4 text-secondary" />
          {formattedDate}
        </div>
      </div>

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-2 xl:grid-cols-4 gap-3 md:gap-4">
        {statCards.map((stat, idx) => (
          <div
            key={stat.title}
            className={`dashboard-card p-5 hover-lift animate-fade-in-up ${
              stat.highlight ? "ring-1 ring-secondary/20" : ""
            }`}
            style={{ animationDelay: `${(idx + 1) * 80}ms` }}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${
                  stat.highlight ? "bg-secondary/10" : "bg-accent"
                }`}>
                  <stat.icon className={`h-5 w-5 ${stat.highlight ? "text-secondary" : "text-accent-foreground"}`} />
                </div>
                <span className="text-sm font-bold text-foreground">{stat.title}</span>
              </div>
            </div>
            <div className="flex items-end justify-between">
              <div>
                <p className="text-xl md:text-[28px] font-extrabold text-foreground leading-none tracking-tight">{stat.value}</p>
              </div>
              <Sparkline
                points={stat.spark}
                color="#14B8A6"
              />
            </div>
          </div>
        ))}
      </div>

      {/* ── Chart + Today's Appointments ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 md:gap-4">
        <div className="lg:col-span-2 dashboard-card p-6 animate-fade-in-up" style={{ animationDelay: "400ms" }}>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-bold text-foreground">Patient & Appointment Statistics</h2>
          </div>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyData}>
                <defs>
                  <linearGradient id="gradAppts" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#14B8A6" stopOpacity={0.35} />
                    <stop offset="40%" stopColor="#1A7D6A" stopOpacity={0.15} />
                    <stop offset="100%" stopColor="#1A7D6A" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradPatients" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0B4D3C" stopOpacity={0.1} />
                    <stop offset="50%" stopColor="#0B4D3C" stopOpacity={0.03} />
                    <stop offset="100%" stopColor="#0B4D3C" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(214,16%,92%)" vertical={false} />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#94A3B8" }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#94A3B8" }} />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "14px",
                    fontSize: "12px",
                    boxShadow: "0 8px 32px -6px rgba(0,0,0,0.15)",
                    padding: "10px 14px",
                  }}
                  labelStyle={{ fontWeight: 700, marginBottom: "4px" }}
                />
                <Area type="monotone" dataKey="patients" stroke="#0B4D3C" strokeWidth={2.5} fill="url(#gradPatients)" name="Unique Patients" dot={false} activeDot={{ r: 6, strokeWidth: 3, fill: "hsl(var(--card))", stroke: "#0B4D3C" }} />
                <Area type="monotone" dataKey="appointments" stroke="#14B8A6" strokeWidth={2.5} fill="url(#gradAppts)" name="Appointments" dot={false} activeDot={{ r: 6, strokeWidth: 3, fill: "hsl(var(--card))", stroke: "#14B8A6" }} />
                <Legend verticalAlign="bottom" iconType="circle" iconSize={8} wrapperStyle={{ fontSize: "12px", paddingTop: "16px" }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Today's Appointments */}
        <div className="dashboard-card p-5 flex flex-col animate-fade-in-up" style={{ animationDelay: "500ms" }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
              <CalendarCheck className="h-4 w-4 text-secondary" />
              Today's Appointments
            </h2>
            <span className="text-xs font-bold text-secondary bg-secondary/10 px-2 py-1 rounded-lg">
              {todayAppointments.length}
            </span>
          </div>
          <div className="flex-1 space-y-2.5 overflow-y-auto">
            {recentAppointments.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <CalendarCheck className="h-10 w-10 mb-2 opacity-30" />
                <p className="text-xs font-medium">No recent appointments</p>
              </div>
            ) : (
              recentAppointments.map((appt) => (
                <div
                  key={appt.id}
                  className="p-3 rounded-xl bg-muted/30 border border-border/30 hover-lift cursor-pointer transition-all"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-foreground truncate">{appt.patientName || appt.patient?.email || appt.patient?.username || "Unknown"}</p>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      appt.status === "SCHEDULED" ? "bg-secondary/10 text-secondary" :
                      appt.status === "COMPLETED" ? "bg-emerald-100 text-emerald-700" :
                      appt.status === "CANCELLED" ? "bg-rose-100 text-rose-700" :
                      "bg-muted text-muted-foreground"
                    }`}>
                      {appt.status}
                    </span>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    Dr. {appt.doctorName || appt.doctor?.email || appt.doctor?.username || "Unknown"} • {format(new Date(appt.appointmentDate || appt.appointment_date), "hh:mm a")}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* ── Bottom Row ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
        {/* Billing Summary */}
        <div className="dashboard-card p-6 animate-fade-in-up" style={{ animationDelay: "600ms" }}>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-bold text-foreground">Billing Summary</h2>
          </div>
          <div className="flex items-center gap-5">
            <div className="relative h-[88px] w-[88px] shrink-0">
              {(() => {
                const total = stats.totalBillingPaid + stats.totalBillingPending;
                const pct = total > 0 ? Math.round((stats.totalBillingPaid / total) * 100) : 0;
                const dashArray = `${pct} ${100 - pct}`;
                return (
                  <>
                    <svg viewBox="0 0 36 36" className="h-[88px] w-[88px] -rotate-90">
                      <defs>
                        <linearGradient id="donutGrad" x1="0" y1="0" x2="1" y2="1">
                          <stop offset="0%" stopColor="#14B8A6" />
                          <stop offset="100%" stopColor="#0B4D3C" />
                        </linearGradient>
                      </defs>
                      <circle cx="18" cy="18" r="14" fill="none" stroke="hsl(var(--muted))" strokeWidth="3.5" />
                      <circle cx="18" cy="18" r="14" fill="none" stroke="url(#donutGrad)" strokeWidth="3.5" strokeDasharray={dashArray} strokeLinecap="round" />
                    </svg>
                    <span className="absolute inset-0 flex items-center justify-center text-sm font-extrabold text-foreground">{pct}%</span>
                  </>
                );
              })()}
            </div>
            <div className="space-y-3 text-sm flex-1">
              <div>
                <p className="text-[11px] text-muted-foreground">Total Paid</p>
                <p className="font-bold text-foreground">৳{stats.totalBillingPaid.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground">Pending</p>
                <p className="font-bold text-foreground">৳{stats.totalBillingPending.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="dashboard-card p-6 animate-fade-in-up" style={{ animationDelay: "700ms" }}>
          <h2 className="text-base font-bold text-foreground mb-4">Quick Overview</h2>
          <div className="space-y-4">
            {[
              { label: "Prescriptions", count: stats.totalPrescriptions, icon: Pill, color: "text-secondary" },
              { label: "Lab Reports", count: stats.totalLabReports, icon: FlaskConical, color: "text-primary" },
              { label: "Upcoming Appointments", count: stats.upcomingAppointments, icon: CalendarCheck, color: "text-amber-500" },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between group hover-lift cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent group-hover:bg-secondary/10 transition-colors duration-300">
                    <item.icon className={`h-5 w-5 ${item.color}`} />
                  </div>
                  <span className="text-sm font-medium text-foreground">{item.label}</span>
                </div>
                <span className="text-base font-bold text-foreground">{item.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="dashboard-card p-6 animate-fade-in-up" style={{ animationDelay: "800ms" }}>
          <h2 className="text-base font-bold text-foreground mb-4">System Summary</h2>
          <div className="space-y-4">
            {[
              { label: "Total Patients", value: safeNumber(stats.totalPatients), icon: Users },
              { label: "Total Doctors", value: safeNumber(stats.totalDoctors), icon: Stethoscope },
              { label: "Total Appointments", value: safeNumber(stats.totalAppointments), icon: CalendarCheck },
              { label: "Prescriptions", value: safeNumber(stats.totalPrescriptions), icon: FileText },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <item.icon className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">{item.label}</span>
                </div>
                <span className="text-sm font-bold text-foreground">{safeNumber(item.value).toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
