import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Users, CalendarCheck, AlertTriangle, TrendingUp,
  Stethoscope, Pill, CheckCircle, Clock, FlaskConical,
  Activity,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell,
} from "recharts";
import { format, subDays, isToday, isFuture, isThisWeek, isThisMonth, parseISO } from "date-fns";
import { normalizeAppointmentStatus } from "@/lib/utils";
import axiosInstance from "@/api/axiosInstance";

const PIE_COLORS = ["hsl(168,76%,42%)", "hsl(210,60%,50%)", "hsl(40,90%,55%)", "hsl(0,70%,55%)", "hsl(280,60%,55%)"];

export default function Analytics() {
  const { user, role } = useAuth();
  const [loading, setLoading] = useState(true);

  const [appointments, setAppointments] = useState<any[]>([]);
  const [medicines, setMedicines] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [records, setRecords] = useState<any[]>([]);
  const [labReports, setLabReports] = useState<any[]>([]);
  const [prescriptions, setPrescriptions] = useState<any[]>([]);

  const [dateRange, setDateRange] = useState("30");

  const isDoctor = role === "doctor";
  const isAdmin = role === "admin";

  useEffect(() => {
    if (!user) return;
    fetchAllData();
  }, [user, role]);

  const fetchAllData = async () => {
    if (!user) return;
    setLoading(true);

    if (isAdmin) {
      // Admin: fetch all data
      try {
        const r = await axiosInstance.get("/appointments/all");
        setAppointments(r.data || []);
      } catch { setAppointments([]); }

      try {
        const r = await axiosInstance.get("/admin/users");
        setUsers(r.data || []);
      } catch { setUsers([]); }

      try {
        const r = await axiosInstance.get("/medicines");
        setMedicines(r.data || []);
      } catch { setMedicines([]); }

      try {
        const r = await axiosInstance.get("/lab/reports/all");
        setLabReports(r.data || []);
      } catch { setLabReports([]); }

    } else if (isDoctor) {
      // Doctor: fetch own data
      try {
        const r = await axiosInstance.get(`/appointments/doctor/${user.id}`);
        setAppointments(r.data || []);
      } catch { setAppointments([]); }

      try {
        const r = await axiosInstance.get(`/medical-records/doctor/${user.id}`);
        setRecords(r.data || []);
      } catch { setRecords([]); }

      try {
        const r = await axiosInstance.get(`/lab/reports/doctor/${user.id}`);
        setLabReports(r.data || []);
      } catch { setLabReports([]); }

      try {
        const r = await axiosInstance.get("/prescriptions/doctor");
        setPrescriptions(r.data || []);
      } catch { setPrescriptions([]); }
    }

    setLoading(false);
  };

  const cutoffDate = useMemo(() => subDays(new Date(), parseInt(dateRange)), [dateRange]);

  const filteredAppointments = useMemo(() => {
    return appointments.filter((a) => {
      const d = a.createdAt || a.created_at || a.appointmentDate || a.appointment_date;
      if (!d) return true;
      try { return new Date(d) >= cutoffDate; } catch { return true; }
    });
  }, [appointments, cutoffDate]);

  // ── Doctor stats ──────────────────────────────────────────────
  const todayAppts = appointments.filter((a) => {
    try { return isToday(parseISO(a.appointmentDate || a.appointment_date)); } catch { return false; }
  });
  const thisWeekAppts = appointments.filter((a) => {
    try { return isThisWeek(parseISO(a.appointmentDate || a.appointment_date)); } catch { return false; }
  });
  const thisMonthAppts = appointments.filter((a) => {
    try { return isThisMonth(parseISO(a.appointmentDate || a.appointment_date)); } catch { return false; }
  });
  const upcomingAppts = appointments.filter((a) => {
    try {
      const s = normalizeAppointmentStatus(a.status);
      return isFuture(parseISO(a.appointmentDate || a.appointment_date)) && (s === "upcoming" || s === "rescheduled");
    } catch { return false; }
  });
  const completedAppts = appointments.filter((a) => normalizeAppointmentStatus(a.status) === "completed");
  const cancelledAppts = appointments.filter((a) => normalizeAppointmentStatus(a.status) === "cancelled");
  const uniquePatients = new Set(appointments.map((a) => a.patientId || a.patient_id)).size;
  const completionRate = appointments.length > 0 ? Math.round((completedAppts.length / appointments.length) * 100) : 0;
  const pendingLabs = labReports.filter((l) => l.status === "pending" || l.status === "requested").length;

  // ── Admin stats ───────────────────────────────────────────────
  const totalPatients = users.filter((u) => u.role === "patient").length;
  const totalDoctors = users.filter((u) => u.role === "doctor").length;
  const lowStockMeds = medicines.filter((m) => (m.stock ?? m.stockQuantity ?? m.stock_quantity ?? 999) < 10);

  // Appointment status distribution
  const apptStatusChart = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredAppointments.forEach((a) => {
      const s = normalizeAppointmentStatus(a.status);
      counts[s] = (counts[s] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [filteredAppointments]);

  // Monthly appointment trend
  const monthlyApptChart = useMemo(() => {
    const months: Record<string, { month: string; total: number; completed: number }> = {};
    appointments.forEach((a) => {
      const raw = a.appointmentDate || a.appointment_date;
      if (!raw) return;
      try {
        const m = format(parseISO(raw), "MMM yy");
        if (!months[m]) months[m] = { month: m, total: 0, completed: 0 };
        months[m].total++;
        if (normalizeAppointmentStatus(a.status) === "completed") months[m].completed++;
      } catch { /* skip */ }
    });
    return Object.values(months);
  }, [appointments]);

  // Diagnosis distribution (doctor)
  const diagnosisChart = useMemo(() => {
    const counts: Record<string, number> = {};
    records.forEach((r) => {
      const diag = r.diagnosis || "Other";
      counts[diag] = (counts[diag] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [records]);

  // Doctor performance (admin)
  const doctorPerformance = useMemo(() => {
    const perf: Record<string, { name: string; appointments: number; completed: number }> = {};
    filteredAppointments.forEach((a) => {
      const did = String(a.doctorId || a.doctor_id || "");
      const dname = a.doctorName || a.doctor_name || "Unknown";
      if (!perf[did]) perf[did] = { name: dname, appointments: 0, completed: 0 };
      perf[did].appointments++;
      if (normalizeAppointmentStatus(a.status) === "completed") perf[did].completed++;
    });
    return Object.values(perf).sort((a, b) => b.appointments - a.appointments);
  }, [filteredAppointments]);

  if (!isAdmin && !isDoctor) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        You don't have permission to view this page.
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-5">
        <div className="h-7 w-52 rounded-lg skeleton-shimmer" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => <div key={i} className="h-28 rounded-2xl skeleton-shimmer" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="h-72 rounded-2xl skeleton-shimmer" />
          <div className="h-72 rounded-2xl skeleton-shimmer" />
        </div>
      </div>
    );
  }

  // ===================== DOCTOR VIEW =====================
  if (isDoctor) {
    return (
      <div className="space-y-4 md:space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fade-in-up">
          <div>
            <h1 className="text-xl md:text-2xl font-extrabold text-foreground tracking-tight">My Statistics</h1>
            <p className="text-sm text-muted-foreground mt-1">Your performance overview & insights</p>
          </div>
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-36 h-9 rounded-xl text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
              <SelectItem value="365">Last year</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          {[
            { label: "Total Patients", value: uniquePatients, icon: Users, color: "bg-primary/10 text-primary", sub: `${thisMonthAppts.length} this month` },
            { label: "Total Appointments", value: appointments.length, icon: CalendarCheck, color: "bg-secondary/10 text-secondary", sub: `${todayAppts.length} today · ${thisWeekAppts.length} this week` },
            { label: "Completed", value: completedAppts.length, icon: CheckCircle, color: "bg-accent text-accent-foreground", sub: `${completionRate}% completion rate` },
            { label: "Upcoming", value: upcomingAppts.length, icon: Clock, color: "bg-blue-500/10 text-blue-600", sub: `${cancelledAppts.length} cancelled` },
          ].map((kpi, i) => (
            <div key={kpi.label} className="dashboard-card p-4 md:p-5 hover-lift animate-fade-in-up" style={{ animationDelay: `${(i + 1) * 80}ms` }}>
              <div className="flex items-center gap-3 mb-3">
                <div className={`flex h-10 w-10 md:h-12 md:w-12 items-center justify-center rounded-xl md:rounded-2xl ${kpi.color}`}>
                  <kpi.icon className="h-5 w-5" />
                </div>
                <span className="text-sm md:text-base font-semibold text-foreground leading-tight">{kpi.label}</span>
              </div>
              <p className="text-2xl md:text-3xl font-extrabold text-foreground tracking-tight">{kpi.value}</p>
              <p className="text-xs md:text-sm text-muted-foreground mt-1">{kpi.sub}</p>
            </div>
          ))}
        </div>

        {/* Secondary Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4">
          {[
            { label: "Medical Records", value: records.length, icon: Stethoscope, color: "text-primary" },
            { label: "Lab Reports", value: labReports.length, icon: FlaskConical, color: "text-amber-600", sub: `${pendingLabs} pending` },
            { label: "Prescriptions", value: prescriptions.length, icon: Pill, color: "text-secondary" },
            { label: "Completion Rate", value: `${completionRate}%`, icon: Activity, color: "text-blue-600" },
          ].map((s, i) => (
            <div key={s.label} className="dashboard-card p-4 md:p-5 animate-fade-in-up" style={{ animationDelay: `${(i + 5) * 80}ms` }}>
              <div className="flex items-center gap-2 mb-2">
                <s.icon className={`h-4 w-4 ${s.color}`} />
                <span className="text-xs md:text-sm font-medium text-muted-foreground">{s.label}</span>
              </div>
              <p className={`text-xl md:text-2xl font-extrabold ${s.color}`}>{s.value}</p>
              {s.sub && <p className="text-xs text-muted-foreground mt-0.5">{s.sub}</p>}
            </div>
          ))}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-4">
          {/* Monthly Trend */}
          <div className="dashboard-card p-5 md:p-6 animate-fade-in-up" style={{ animationDelay: "700ms" }}>
            <h2 className="text-sm md:text-base font-bold text-foreground mb-4 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-secondary" /> Monthly Appointment Trend
            </h2>
            {monthlyApptChart.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground text-sm">No data available</div>
            ) : (
              <div className="h-[220px] md:h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyApptChart}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(214,16%,92%)" vertical={false} />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#94A3B8" }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#94A3B8" }} />
                    <Tooltip contentStyle={{ borderRadius: "12px", fontSize: "12px", border: "none", boxShadow: "0 8px 32px -6px rgba(0,0,0,0.1)" }} />
                    <Bar dataKey="total" fill="hsl(210,60%,50%)" radius={[6, 6, 0, 0]} name="Total" />
                    <Bar dataKey="completed" fill="hsl(168,76%,42%)" radius={[6, 6, 0, 0]} name="Completed" />
                    <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: "12px", paddingTop: "12px" }} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Appointment Status Pie */}
          <div className="dashboard-card p-5 md:p-6 animate-fade-in-up" style={{ animationDelay: "780ms" }}>
            <h2 className="text-sm md:text-base font-bold text-foreground mb-4 flex items-center gap-2">
              <CalendarCheck className="h-4 w-4 text-secondary" /> Appointment Distribution
            </h2>
            {apptStatusChart.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground text-sm">No appointment data</div>
            ) : (
              <>
                <div className="h-[180px] md:h-[220px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={apptStatusChart} cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={4} dataKey="value">
                        {apptStatusChart.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                      </Pie>
                      <Tooltip contentStyle={{ borderRadius: "12px", fontSize: "12px" }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex flex-wrap gap-2 justify-center mt-2">
                  {apptStatusChart.map((s, i) => (
                    <span key={s.name} className="text-xs flex items-center gap-1.5 capitalize">
                      <span className="h-2.5 w-2.5 rounded-full inline-block" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                      {s.name} ({s.value})
                    </span>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Top Diagnoses */}
        {diagnosisChart.length > 0 && (
          <div className="dashboard-card p-5 md:p-6 animate-fade-in-up" style={{ animationDelay: "860ms" }}>
            <h2 className="text-sm md:text-base font-bold text-foreground mb-4 flex items-center gap-2">
              <Stethoscope className="h-4 w-4 text-primary" /> Top Diagnoses
            </h2>
            <div className="space-y-3">
              {diagnosisChart.map((d, i) => (
                <div key={d.name} className="flex items-center gap-3">
                  <div className="flex h-8 w-8 md:h-9 md:w-9 items-center justify-center rounded-xl bg-primary/10 shrink-0">
                    <span className="text-sm font-bold text-primary">{i + 1}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-foreground truncate">{d.name}</p>
                      <Badge variant="outline" className="text-xs ml-2 shrink-0">{d.value} case{d.value !== 1 ? 's' : ''}</Badge>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden mt-1.5">
                      <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${(d.value / (diagnosisChart[0]?.value || 1)) * 100}%` }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ===================== ADMIN VIEW =====================
  return (
    <div className="space-y-4 md:space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fade-in-up">
        <div>
          <h1 className="text-xl md:text-2xl font-extrabold text-foreground tracking-tight">Analytics & Reports</h1>
          <p className="text-sm text-muted-foreground mt-1">Comprehensive insights into your hospital</p>
        </div>
        <Select value={dateRange} onValueChange={setDateRange}>
          <SelectTrigger className="w-32 md:w-36 h-9 rounded-xl text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="90">Last 90 days</SelectItem>
            <SelectItem value="365">Last year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 md:gap-4 animate-fade-in-up" style={{ animationDelay: "80ms" }}>
        {[
          { label: "Total Patients", value: totalPatients, icon: Users, color: "text-secondary" },
          { label: "Total Doctors", value: totalDoctors, icon: Stethoscope, color: "text-blue-500" },
          { label: "All Appointments", value: appointments.length, icon: CalendarCheck, color: "text-secondary" },
          { label: "Completed", value: completedAppts.length, icon: CheckCircle, color: "text-emerald-600" },
          { label: "Low Stock Meds", value: lowStockMeds.length, icon: AlertTriangle, color: lowStockMeds.length > 0 ? "text-destructive" : "text-secondary" },
        ].map((kpi) => (
          <div key={kpi.label} className="dashboard-card p-4 md:p-5 hover-lift">
            <div className="flex items-center gap-3 mb-2">
              <div className="flex h-10 w-10 md:h-11 md:w-11 items-center justify-center rounded-xl md:rounded-2xl bg-accent">
                <kpi.icon className={`h-5 w-5 ${kpi.color}`} />
              </div>
            </div>
            <p className={`text-xl md:text-2xl font-extrabold ${kpi.color}`}>{kpi.value}</p>
            <p className="text-xs md:text-sm text-muted-foreground font-medium mt-0.5">{kpi.label}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-4">
        {/* Monthly Trend */}
        <div className="dashboard-card p-5 md:p-6 animate-fade-in-up" style={{ animationDelay: "160ms" }}>
          <h2 className="text-sm md:text-base font-bold text-foreground mb-4 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-secondary" /> Appointment Volume
          </h2>
          {monthlyApptChart.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground text-sm">No appointment data in this period</div>
          ) : (
            <div className="h-[220px] md:h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyApptChart}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(214,16%,92%)" vertical={false} />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#94A3B8" }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#94A3B8" }} />
                  <Tooltip contentStyle={{ borderRadius: "12px", fontSize: "12px", border: "none", boxShadow: "0 8px 32px -6px rgba(0,0,0,0.1)" }} />
                  <Bar dataKey="total" fill="hsl(210,60%,50%)" radius={[6, 6, 0, 0]} name="Total" />
                  <Bar dataKey="completed" fill="hsl(168,76%,42%)" radius={[6, 6, 0, 0]} name="Completed" />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: "12px", paddingTop: "12px" }} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Appointment Status Pie */}
        <div className="dashboard-card p-5 md:p-6 animate-fade-in-up" style={{ animationDelay: "240ms" }}>
          <h2 className="text-sm md:text-base font-bold text-foreground mb-4 flex items-center gap-2">
            <CalendarCheck className="h-4 w-4 text-secondary" /> Appointment Status
          </h2>
          {apptStatusChart.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground text-sm">No appointment data</div>
          ) : (
            <>
              <div className="h-[180px] md:h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={apptStatusChart} cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={4} dataKey="value">
                      {apptStatusChart.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: "12px", fontSize: "12px" }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-wrap gap-2 justify-center mt-2">
                {apptStatusChart.map((s, i) => (
                  <span key={s.name} className="text-xs flex items-center gap-1.5 capitalize">
                    <span className="h-2.5 w-2.5 rounded-full inline-block" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                    {s.name}
                  </span>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Doctor Performance */}
      {doctorPerformance.length > 0 && (
        <div className="dashboard-card p-5 md:p-6 animate-fade-in-up" style={{ animationDelay: "400ms" }}>
          <h2 className="text-sm md:text-base font-bold text-foreground mb-4 flex items-center gap-2">
            <Stethoscope className="h-4 w-4 text-secondary" /> Doctor Performance
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {doctorPerformance.slice(0, 6).map((doc, i) => {
              const rate = doc.appointments > 0 ? Math.round((doc.completed / doc.appointments) * 100) : 0;
              return (
                <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-muted/20 border border-border/30">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary/10 shrink-0">
                    <Stethoscope className="h-4 w-4 text-secondary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-foreground truncate">Dr. {doc.name}</p>
                      <Badge variant="outline" className="text-xs ml-2 shrink-0">{doc.appointments}</Badge>
                    </div>
                    <div className="flex items-center gap-2 mt-1.5">
                      <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                        <div className="h-full rounded-full bg-secondary transition-all" style={{ width: `${rate}%` }} />
                      </div>
                      <span className="text-xs text-muted-foreground font-medium">{rate}%</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Low Stock Alerts */}
      {lowStockMeds.length > 0 && (
        <div className="dashboard-card p-5 md:p-6 animate-fade-in-up" style={{ animationDelay: "480ms" }}>
          <h2 className="text-sm md:text-base font-bold text-foreground mb-4 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-destructive" /> Low Stock Alerts
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {lowStockMeds.map((med: any) => (
              <div key={med.id} className="p-3 rounded-xl border border-destructive/20 bg-destructive/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Pill className="h-4 w-4 text-destructive shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-foreground">{med.name}</p>
                    <p className="text-xs text-muted-foreground">{med.category || "General"}</p>
                  </div>
                </div>
                <Badge variant="outline" className="text-xs text-destructive border-destructive/30 font-bold">
                  {med.stock ?? med.stockQuantity ?? med.stock_quantity} left
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
