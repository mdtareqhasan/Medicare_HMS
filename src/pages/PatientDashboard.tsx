import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { normalizeAppointmentStatus } from "@/lib/utils";
import { appointmentService } from "@/api/appointmentService";
import { medicalRecordService } from "@/api/medicalRecordService";
import { prescriptionService, PrescriptionRecord } from "@/api/prescriptionService";
import { labReportService, LabReportItem } from "@/api/labReportService";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  FileText, CalendarCheck, Stethoscope, Pill, FlaskConical, User,
  Phone, MapPin, Heart, Shield, Plus, ArrowRight, Clock, ClipboardList,
  Download, Search,
} from "lucide-react";
import { format, parseISO, isToday, isFuture } from "date-fns";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { generatePrescriptionPDF, PrescriptionPDFData } from "@/lib/pdfUtils";

// ── Types ────────────────────────────────────────────────────
interface Appointment {
  id: string;
  doctor_id: string;
  appointment_date: string;
  status: string;
  notes: string | null;
  doctor_name?: string;
}

interface MedicalRecord {
  id: string;
  diagnosis: string;
  prescription: string | null;
  notes: string | null;
  record_date: string;
  doctor_name?: string;
}

// ── Stat Card ────────────────────────────────────────────────
function StatCard({ icon: Icon, title, value, subtitle, color, delay }: any) {
  return (
    <div className="bg-card border p-5 rounded-2xl shadow-sm hover:shadow-md transition-all animate-in fade-in slide-in-from-bottom-2" style={{ animationDelay: `${delay}ms` }}>
      <div className="flex items-center gap-3 mb-2">
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${color}`}>
          <Icon className="h-5 w-5" />
        </div>
        <span className="text-sm font-semibold text-muted-foreground">{title}</span>
      </div>
      <p className="text-3xl font-bold">{value}</p>
      <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
    </div>
  );
}

// ── Main ─────────────────────────────────────────────────────
export default function PatientDashboard() {
  const { user, role } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [prescriptions, setPrescriptions] = useState<PrescriptionRecord[]>([]);
  const [labReports, setLabReports] = useState<LabReportItem[]>([]);
  const [records, setRecords] = useState<MedicalRecord[]>([]);

  // ── Fetch ──────────────────────────────────────────────────
  useEffect(() => {
    if (!user || !role) {
      console.log("[PatientDashboard] Waiting for user and role...");
      return;
    }
    if (role !== "patient") {
      console.warn("[PatientDashboard] User role is not patient:", role);
      return;
    }
    console.log("[PatientDashboard] Starting data fetch...");
    fetchAll();
  }, [user, role]);

  const fetchAll = async () => {
    setLoading(true);
    setError(null);
    try {
      // Appointments — individual try/catch to prevent logout on failure
      try {
        let apptsData: any[] = [];
        if (role === "admin") {
          apptsData = await appointmentService.getAllAppointments();
        } else if (role === "doctor" || role === "nurse") {
          apptsData = await appointmentService.getDoctorSchedule(Number(user?.id));
        } else if (role === "patient" && user?.id) {
          console.log("[PatientDashboard] Fetching patient appointments for ID:", user.id);
          apptsData = await appointmentService.getMyAppointments();
        }
        setAppointments(apptsData.map((a: any) => ({
          id: a.id?.toString() || "",
          doctor_id: a.doctorId?.toString() || a.doctor_id?.toString() || "",
          appointment_date: a.appointmentDate || a.appointment_date || "",
          status: normalizeAppointmentStatus(a.status),
          notes: a.notes || null,
          doctor_name: a.doctorName || a.doctor_name || "Unknown",
        })));
      } catch (e) { console.warn("Appointments fetch failed", e); setAppointments([]); }

      // Patient-specific data
      if (role === "patient" && user?.id) {
        const pid = Number(user.id);

        // Medical Records
        try {
          const mrData = await medicalRecordService.getPatientRecords(pid);
          setRecords(mrData.map((mr: any) => ({
            id: mr.id.toString(),
            diagnosis: mr.diagnosis,
            prescription: mr.prescription,
            notes: mr.notes,
            record_date: mr.recordDate,
            doctor_name: mr.doctorName,
          })));
        } catch (e) { console.warn("Medical records fetch failed", e); setRecords([]); }

        // Prescriptions
        try {
          const rxData = await prescriptionService.getPatientPrescriptions(pid);
          setPrescriptions(rxData);
        } catch (e) { console.warn("Prescriptions fetch failed", e); setPrescriptions([]); }

        // Lab Reports
        try {
          const labData = await labReportService.getPatientReports(pid);
          setLabReports(labData);
        } catch (e) { console.warn("Lab reports fetch failed", e); setLabReports([]); }
      }
    } catch (error: any) {
      console.error("Patient dashboard fetch failed", error);
    } finally {
      setLoading(false);
    }
  };

  // ── Computed ───────────────────────────────────────────────
  const todayAppts = appointments.filter((a) => { try { return isToday(parseISO(a.appointment_date)); } catch { return false; } });
  const upcomingAppts = appointments.filter((a) => { try { return isFuture(parseISO(a.appointment_date)) && (a.status === "upcoming" || a.status === "rescheduled"); } catch { return false; } });
  const pendingRx = prescriptions.filter((p) => p.status === "PENDING");
  const pendingLabs = labReports.filter((l) => l.status?.toUpperCase() !== "COMPLETED");

  // Extract lab tests from prescriptions for display
  const prescribedLabTests = prescriptions.flatMap((rx) => (rx as any).labTests || []) as string[];
  const pendingLabTestsFromRx = prescribedLabTests.filter((test) => 
    !labReports.some((lr) => lr.labTest?.testName?.toLowerCase() === test.toLowerCase())
  );

  const parseMeds = (raw: string | any[]): { name: string; dosage?: string }[] => {
    if (Array.isArray(raw)) return raw;
    try { const p = JSON.parse(raw as string); if (Array.isArray(p)) return p; } catch {}
    return typeof raw === "string" && raw.trim() ? [{ name: raw }] : [];
  };

  function fmtDate(d: string | null | undefined) {
    if (!d) return "—";
    try { return format(parseISO(d), "dd MMM yyyy"); } catch { return d; }
  }

  // ── PDF Download Handler ───────────────────────────────────────
  const handleDownloadPDF = (rx: PrescriptionRecord) => {
    const meds = parseMeds(rx.medicines);
    const pdfData: PrescriptionPDFData = {
      id: rx.id,
      patientName: user?.name || user?.email || "Patient",
      doctorName: rx.doctorName || rx.doctorId.toString(),
      diagnosis: rx.notes || "Consultation",
      medicines: meds as { name: string; dosage?: string; duration?: string }[],
      labTests: (rx as any).labTests,
      notes: rx.notes || undefined,
      createdAt: rx.createdAt,
      status: rx.status,
    };
    generatePrescriptionPDF(pdfData);
    toast.success("Prescription PDF downloaded");
  };

  // ── Navigate to appointments with booking modal ─────────────────
  const handleBookAppointment = () => {
    navigate("/dashboard/appointments?action=book");
  };

  if (loading) {
    return <div className="p-8 text-center font-medium">Loading Dashboard...</div>;
  }
  if (!user) {
    return <div className="p-8 text-center text-destructive">Please login to view dashboard.</div>;
  }

  return (
    <div className="p-4 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-primary/5 p-6 rounded-3xl border border-primary/10">
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16 border-4 border-background shadow-sm">
            <AvatarFallback className="bg-primary text-primary-foreground text-xl font-bold">
              {user?.email?.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight">{user?.name || user?.email || "Patient"}</h1>
            <p className="text-muted-foreground text-sm">
              You have {todayAppts.length} appointments today.{" "}
              <span className="text-amber-600 font-semibold">{pendingLabs.length + pendingLabTestsFromRx.length} pending tests</span>{" "}
              <span className="text-emerald-600 font-semibold">{pendingRx.length} pending prescriptions</span>
            </p>
          </div>
        </div>
        <Button onClick={handleBookAppointment} className="rounded-xl px-6">
          <Plus className="mr-2 h-4 w-4" /> Book New Appointment
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={CalendarCheck} title="Appointments" value={appointments.length}
          subtitle={`${upcomingAppts.length} upcoming`} color="bg-blue-500/10 text-blue-600" delay={0} />
        <StatCard icon={Stethoscope} title="Records" value={records.length}
          subtitle="Medical consultations" color="bg-emerald-500/10 text-emerald-600" delay={100} />
        <StatCard icon={Pill} title="Prescriptions" value={prescriptions.length}
          subtitle={`${pendingRx.length} pending`} color="bg-amber-500/10 text-amber-600" delay={200} />
        <StatCard icon={FlaskConical} title="Lab Tests" value={labReports.length + pendingLabTestsFromRx.length}
          subtitle={`${pendingLabs.length + pendingLabTestsFromRx.length} pending`} color="bg-purple-500/10 text-purple-600" delay={300} />
      </div>

      {/* Appointments + Prescriptions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Upcoming Appointments */}
        <div className="bg-card border rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold flex items-center gap-2"><CalendarCheck className="h-5 w-5 text-primary" /> Upcoming Appointments</h2>
            <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard/appointments")}>View All</Button>
          </div>
          <div className="space-y-3">
            {upcomingAppts.length > 0 ? upcomingAppts.slice(0, 5).map((appt) => (
              <div key={appt.id} className="flex items-center justify-between p-4 bg-muted/30 rounded-xl border border-border/50">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                    {appt.doctor_name?.charAt(0) || "D"}
                  </div>
                  <div>
                    <p className="text-sm font-bold">{appt.doctor_name}</p>
                    <p className="text-xs text-muted-foreground">{appt.notes || "General consultation"}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs font-semibold">{fmtDate(appt.appointment_date)}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {appt.appointment_date ? format(parseISO(appt.appointment_date), "hh:mm a") : ""}
                  </p>
                </div>
              </div>
            )) : (
              <p className="text-center py-10 text-muted-foreground text-sm">No upcoming appointments.</p>
            )}
          </div>
        </div>

        {/* My Prescriptions */}
        <div className="bg-card border rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold flex items-center gap-2"><Pill className="h-5 w-5 text-emerald-600" /> My Prescriptions</h2>
            <span className="text-xs font-semibold bg-muted/50 rounded-full px-3 py-1 text-emerald-700">{prescriptions.length} total</span>
          </div>
          <div className="space-y-3">
            {prescriptions.length > 0 ? prescriptions.slice(0, 5).map((rx) => {
              const meds = parseMeds(rx.medicines);
              const rxLabTests = (rx as any).labTests as string[] | undefined;
              return (
                <div key={rx.id} className="p-4 bg-muted/30 rounded-xl border border-border/50">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="text-sm font-semibold">Dr. {rx.doctorName || rx.doctorId}</p>
                      <p className="text-xs text-muted-foreground">
                        {meds.length} medicine(s) • {fmtDate(rx.createdAt)}
                      </p>
                      {rx.notes && <p className="text-xs mt-1">{rx.notes}</p>}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        onClick={() => handleDownloadPDF(rx)}
                        title="Download PDF"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Badge className={`text-[10px] border-0 ${rx.status === "PENDING" ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"}`}>
                        {rx.status === "PENDING" ? "Pending" : "Dispensed"}
                      </Badge>
                    </div>
                  </div>
                  {meds.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {meds.slice(0, 3).map((m, i) => (
                        <p key={i} className="text-xs bg-white/50 rounded-lg px-2 py-1">
                          💊 {m.name} {m.dosage ? `— ${m.dosage}` : ""}
                        </p>
                      ))}
                      {meds.length > 3 && <p className="text-xs text-muted-foreground">+{meds.length - 3} more</p>}
                    </div>
                  )}
                  {rxLabTests && rxLabTests.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-border/30">
                      <p className="text-xs text-muted-foreground mb-1">Lab Tests:</p>
                      <div className="flex flex-wrap gap-1">
                        {rxLabTests.map((test, i) => (
                          <Badge key={i} variant="outline" className="text-[10px] bg-purple-50 text-purple-700 border-purple-200">
                            {test}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            }) : (
              <p className="text-center py-10 text-muted-foreground text-sm">No prescriptions found.</p>
            )}
          </div>
        </div>
      </div>

      {/* Lab Results + Medical History + Profile */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Lab Results */}
        <div className="bg-card border rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold flex items-center gap-2">
              <FlaskConical className="h-5 w-5 text-purple-600" /> My Lab Results
            </h2>
            <span className="text-xs font-semibold bg-muted/50 rounded-full px-2 py-0.5 text-purple-700">
              {labReports.length + pendingLabTestsFromRx.length}
            </span>
          </div>
          
          {/* Pending Lab Tests from Prescriptions - Awaiting Result */}
          {pendingLabTestsFromRx.length > 0 && (
            <div className="mb-4">
              <p className="text-xs font-semibold text-muted-foreground mb-2">Awaiting Results</p>
              <div className="space-y-2">
                {pendingLabTestsFromRx.map((test, idx) => (
                  <div key={idx} className="p-3 bg-amber-50 rounded-xl border border-amber-200">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-medium">{test}</p>
                        <p className="text-xs text-amber-600">Prescribed - Awaiting result</p>
                      </div>
                      <Badge className="text-[10px] bg-amber-100 text-amber-700 border-0">
                        Pending
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Completed Lab Reports */}
          {labReports.length === 0 && pendingLabTestsFromRx.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-8">No lab tests found.</p>
          ) : labReports.length > 0 && (
            <div className="space-y-2 max-h-[280px] overflow-y-auto">
              {labReports.map((lr) => (
                <div key={lr.id} className="p-3 bg-muted/20 rounded-xl border border-border/40">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium">{lr.labTest?.testName || "Test"}</p>
                      <p className="text-xs text-muted-foreground">{lr.createdAt ? fmtDate(lr.createdAt) : "—"}</p>
                    </div>
                    <Badge className={`text-[10px] border-0 ${
                      lr.status?.toUpperCase() === "COMPLETED" ? "bg-emerald-100 text-emerald-700"
                      : lr.status?.toUpperCase() === "IN_PROGRESS" ? "bg-blue-100 text-blue-700"
                      : "bg-amber-100 text-amber-700"
                    }`}>
                      {lr.status?.toUpperCase() === "COMPLETED" ? "Completed"
                        : lr.status?.toUpperCase() === "IN_PROGRESS" ? "In Progress"
                        : "Awaiting results"}
                    </Badge>
                  </div>
                  {lr.result && <p className="text-xs mt-1 text-muted-foreground">📋 {lr.result}</p>}
                  {lr.resultUrl && (
                    <a href={lr.resultUrl} target="_blank" rel="noopener noreferrer"
                      className="text-xs text-blue-600 underline mt-1 block">Download Report</a>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Medical History */}
        <div className="bg-card border rounded-2xl p-6 shadow-sm">
          <h2 className="font-bold flex items-center gap-2 mb-4">
            <FileText className="h-5 w-5 text-emerald-600" /> Medical History
            <span className="ml-auto text-xs font-semibold bg-muted/50 rounded-full px-2 py-0.5 text-emerald-700">{records.length}</span>
          </h2>
          {records.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-8">No medical records found.</p>
          ) : (
            <div className="space-y-3 max-h-[320px] overflow-y-auto">
              {records.map((rec, idx) => (
                <div key={rec.id} className="relative pl-5 border-l-2 border-emerald-200">
                  <div className="absolute left-[-5px] top-1 h-2.5 w-2.5 rounded-full bg-emerald-500" />
                  <p className="text-xs text-muted-foreground">{fmtDate(rec.record_date)}</p>
                  <p className="text-sm font-semibold mt-0.5">{rec.diagnosis}</p>
                  <p className="text-xs text-muted-foreground">Dr. {rec.doctor_name || "Unknown"}</p>
                  {rec.prescription && <p className="text-xs mt-0.5">💊 {rec.prescription}</p>}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Profile */}
        <div className="bg-card border rounded-2xl p-6 shadow-sm">
          <h2 className="font-bold flex items-center gap-2 mb-4"><User className="h-5 w-5 text-primary" /> My Profile</h2>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs"><Phone className="h-4 w-4 text-muted-foreground" /> Phone: {user?.phone || "Not set"}</div>
            <div className="flex items-center gap-2 text-xs"><MapPin className="h-4 w-4 text-muted-foreground" /> Address: {user?.address || "Not set"}</div>
            <div className="flex items-center gap-2 text-xs"><Heart className="h-4 w-4 text-muted-foreground" /> Emergency: {user?.emergencyContact || "Not set"}</div>
            <div className="flex items-center gap-2 text-xs"><Shield className="h-4 w-4 text-muted-foreground" /> Insurance: {user?.insurance || "Not set"}</div>
          </div>
          <Button variant="outline" className="w-full mt-6 rounded-xl" onClick={() => navigate("/dashboard/profile")}>Edit Profile</Button>
        </div>
      </div>
    </div>
  );
}