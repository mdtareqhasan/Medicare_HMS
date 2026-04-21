import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { appointmentService } from "@/api/appointmentService";
import { medicalRecordService } from "@/api/medicalRecordService";
import { prescriptionService, PrescriptionRecord } from "@/api/prescriptionService";
import { labReportService, LabReportItem } from "@/api/labReportService";
import {
  Stethoscope, FileText, CalendarCheck, Users, Clock, ClipboardList,
  FlaskConical, CheckCircle, ArrowRight, Plus, Activity, Pill, Trash2,
  PlayCircle, Eye,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { format, parseISO, isToday, isFuture, isThisWeek, isThisMonth, isValid } from "date-fns";

const safeParse = (val: any): Date | null => {
  if (!val) return null;
  if (val instanceof Date) return val;
  if (typeof val === "string") return parseISO(val);
  if (typeof val === "object" && val.toString) return parseISO(val.toString());
  return null;
};

const safeFormat = (val: any, fmt: string): string => {
  if (!val) return "N/A";
  const d = new Date(val);
  return isValid(d) ? format(d, fmt) : "N/A";
};
import { normalizeAppointmentStatus } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

// ── Types ────────────────────────────────────────────────────────
interface Appointment {
  id: string;
  patient_id: string;
  doctor_id: string;
  appointment_date: string;
  status: string;
  notes: string | null;
  patient_name?: string;
}

interface MedicalRecord {
  id: string;
  patient_id: string;
  diagnosis: string;
  prescription: string | null;
  notes: string | null;
  record_date: string;
  patient_name?: string;
}

interface MedicineRow {
  name: string;
  dosage: string;
  duration: string;
  instructions: string;
}

const COMMON_LAB_TESTS = [
  "CBC", "Blood Sugar (Fasting)", "Blood Sugar (PP)", "HbA1c", "Lipid Profile",
  "Liver Function Test", "Kidney Function Test", "Thyroid Profile", "Urine R/E",
  "ECG", "X-Ray Chest", "USG Abdomen", "Serum Creatinine", "Vitamin D", "Vitamin B12",
];

// ── Stat Card ────────────────────────────────────────────────────
function StatCard({ icon: Icon, title, value, subtitle, color, delay }: {
  icon: any; title: string; value: string | number; subtitle: string; color: string; delay: number;
}) {
  return (
    <div className="bg-card border rounded-2xl p-5 shadow-sm hover:shadow-md transition-all animate-in fade-in slide-in-from-bottom-2" style={{ animationDelay: `${delay}ms` }}>
      <div className="flex items-center gap-3 mb-3">
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${color}`}>
          <Icon className="h-5 w-5" />
        </div>
        <span className="text-sm font-semibold text-foreground">{title}</span>
      </div>
      <p className="text-2xl font-extrabold text-foreground">{value}</p>
      <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
    </div>
  );
}

// ── Main ─────────────────────────────────────────────────────────
export default function DoctorDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [prescriptions, setPrescriptions] = useState<PrescriptionRecord[]>([]);
  const [labReports, setLabReports] = useState<LabReportItem[]>([]);

  // Complete Appointment Dialog
  const [completeTarget, setCompleteTarget] = useState<Appointment | null>(null);
  const [diagnosis, setDiagnosis] = useState("");
  const [medicines, setMedicines] = useState<MedicineRow[]>([{ name: "", dosage: "", duration: "", instructions: "" }]);
  const [selectedLabTests, setSelectedLabTests] = useState<string[]>([]);
  const [rxNotes, setRxNotes] = useState("");
  const [completing, setCompleting] = useState(false);

  // ── Fetch ──────────────────────────────────────────────────
  useEffect(() => {
    if (user) fetchAll();
  }, [user]);

  const fetchAll = async () => {
    setLoading(true);
    try {
      // Doctor appointments — individual try/catch so a failure here doesn't logout
      if (user?.id) {
        try {
          const appts = await appointmentService.getDoctorSchedule(Number(user.id));
          setAppointments(
            appts.map((a: any) => ({
              id: a.id.toString(),
              patient_id: (a.patient as any)?.id?.toString() || a.patient_id || a.patientId?.toString() || "",
              doctor_id: (a.doctor as any)?.id?.toString() || a.doctor_id || a.doctorId?.toString() || "",
              appointment_date: a.appointmentDate || a.appointment_date,
              status: normalizeAppointmentStatus(a.status),
              notes: a.notes || null,
              patient_name: (a.patient as any)?.username || a.patient_name || a.patientName || "Unknown",
            }))
          );
        } catch (e) { console.warn("Appointments fetch failed", e); }
      }

      // Medical records
      if (user?.id) {
        try {
          const recordResp = await medicalRecordService.getDoctorRecords(Number(user.id));
          setRecords(recordResp.map((r: any) => ({
            id: r.id.toString(),
            diagnosis: r.diagnosis,
            prescription: r.prescription,
            notes: r.notes,
            record_date: r.recordDate,
            doctor_id: r.doctorId?.toString(),
            patient_id: r.patientId?.toString(),
            patient_name: r.patientName,
          })));
        } catch (e) { console.warn("Medical records fetch failed", e); setRecords([]); }
      }

      // Doctor prescriptions
      try {
        const rxData = await prescriptionService.getDoctorPrescriptions();
        setPrescriptions(rxData);
      } catch (e) { console.warn("Prescriptions fetch failed", e); setPrescriptions([]); }

      // Doctor lab reports
      if (user?.id) {
        try {
          const labData = await labReportService.getDoctorReports(Number(user.id));
          setLabReports(Array.isArray(labData) ? labData : []);
        } catch (e) {
          console.warn("Lab reports unavailable:", e);
          setLabReports([]);
        }
      }

    } catch (error) {
      console.error("Doctor dashboard fetch failed", error);
    } finally {
      setLoading(false);
    }
  };

  // ── Complete Appointment ───────────────────────────────────
  const openCompleteDialog = (appt: Appointment) => {
    setCompleteTarget(appt);
    setDiagnosis("");
    setMedicines([{ name: "", dosage: "", duration: "", instructions: "" }]);
    setSelectedLabTests([]);
    setRxNotes("");
  };

  const addMedicineRow = () => {
    setMedicines([...medicines, { name: "", dosage: "", duration: "", instructions: "" }]);
  };

  const removeMedicineRow = (idx: number) => {
    setMedicines(medicines.filter((_, i) => i !== idx));
  };

  const updateMedicine = (idx: number, field: keyof MedicineRow, value: string) => {
    const updated = [...medicines];
    updated[idx] = { ...updated[idx], [field]: value };
    setMedicines(updated);
  };

  const toggleLabTest = (test: string) => {
    setSelectedLabTests((prev) =>
      prev.includes(test) ? prev.filter((t) => t !== test) : [...prev, test]
    );
  };

  const handleComplete = async () => {
    if (!completeTarget || !diagnosis.trim()) {
      toast.error("Diagnosis is required");
      return;
    }
    setCompleting(true);
    try {
      const medList = medicines
        .filter((m) => m.name.trim())
        .map((m) => ({ name: m.name, dosage: m.dosage, duration: m.duration, instructions: m.instructions }));

      await prescriptionService.create({
        patientId: Number(completeTarget.patient_id),
        diagnosis,
        medicines: medList,
        labTests: selectedLabTests,
        notes: rxNotes,
        appointmentId: Number(completeTarget.id),
      });

      toast.success("Appointment completed — prescription, medical record, and lab tests created!");
      setCompleteTarget(null);
      fetchAll();
    } catch (e: any) {
      toast.error("Failed: " + (e?.response?.data?.error || e.message));
    } finally {
      setCompleting(false);
    }
  };

  // ── Computed ───────────────────────────────────────────────
  const todayAppts = appointments.filter((a) => {
    const d = safeParse(a.appointment_date);
    return d && isToday(d);
  });
  const upcomingAppts = appointments.filter((a) => {
    const d = safeParse(a.appointment_date);
    return d && isFuture(d) && (a.status === "upcoming" || a.status === "rescheduled");
  });
  const completedAppts = appointments.filter((a) => a.status === "completed");
  const uniquePatients = new Set(appointments.map((a) => a.patient_id)).size;

  const statusColors: Record<string, string> = {
    upcoming: "bg-blue-100 text-blue-700",
    completed: "bg-emerald-100 text-emerald-700",
    cancelled: "bg-red-100 text-red-700",
    rescheduled: "bg-amber-100 text-amber-700",
    pending: "bg-amber-100 text-amber-700",
    in_progress: "bg-purple-100 text-purple-700",
  };

  // Helper  
  const parseMeds = (raw: string | any[]): { name: string; dosage?: string }[] => {
    if (Array.isArray(raw)) return raw;
    try { const p = JSON.parse(raw as string); if (Array.isArray(p)) return p; } catch {}
    return typeof raw === "string" && raw.trim() ? [{ name: raw }] : [];
  };

  if (loading) {
    return (
      <div className="space-y-5 p-4 md:p-6">
        <div className="h-28 rounded-2xl bg-muted/30 animate-pulse" />
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => <div key={i} className="bg-card border rounded-2xl p-5 h-28 animate-pulse" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-5">
      {/* Header */}
      <div className="bg-card border rounded-2xl p-5 flex flex-col sm:flex-row items-start gap-4">
        <Avatar className="h-14 w-14 ring-4 ring-primary/10">
          <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white text-xl font-bold">DR</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-extrabold tracking-tight">{user?.email || "Doctor"} 👋</h1>
          <p className="text-xs text-muted-foreground mt-1">
            You have <span className="font-semibold text-blue-600">{todayAppts.length} appointments</span> today
          </p>
        </div>
        <Button onClick={() => navigate("/dashboard/appointments")} className="rounded-xl gap-2">
          <Plus className="h-4 w-4" /> New Appointment
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        <StatCard icon={CalendarCheck} title="Today" value={todayAppts.length} subtitle={`${upcomingAppts.length} upcoming`} color="bg-blue-500/10 text-blue-600" delay={0} />
        <StatCard icon={Users} title="My Patients" value={uniquePatients} subtitle="Unique patients" color="bg-emerald-500/10 text-emerald-600" delay={80} />
        <StatCard icon={CheckCircle} title="Completed" value={completedAppts.length} subtitle="Total completed" color="bg-purple-500/10 text-purple-600" delay={160} />
        <StatCard icon={FlaskConical} title="Lab Reports" value={labReports.length} subtitle={`${labReports.filter(l => l.status?.toUpperCase() === "PENDING").length} pending`} color="bg-amber-500/10 text-amber-600" delay={240} />
      </div>

      {/* Today's Appointments + Recent Records */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Today's Appointments */}
        <div className="bg-card border rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-600" /> Today's Schedule
            </h2>
            <Button variant="ghost" size="sm" className="text-xs text-blue-600 gap-1" onClick={() => navigate("/dashboard/appointments")}>
              View All <ArrowRight className="h-3 w-3" />
            </Button>
          </div>

          {todayAppts.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <CalendarCheck className="h-10 w-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm font-medium">No appointments today</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
              {todayAppts.map((appt) => (
                <div key={appt.id} className={`p-3 rounded-xl border-l-[3px] transition-all ${
                  appt.status === "completed" ? "bg-emerald-50 border-emerald-400" :
                  appt.status === "cancelled" ? "bg-red-50 border-red-400 opacity-60" :
                  "bg-blue-50 border-blue-400"
                }`}>
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate">{appt.patient_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {safeFormat(appt.appointment_date, "hh:mm a")}
                        {appt.notes && ` · ${appt.notes}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <Badge className={`text-[10px] border-0 ${statusColors[appt.status] || ""}`}>{appt.status}</Badge>
                      {(appt.status === "upcoming" || appt.status === "rescheduled") && (
                        <Button size="sm" variant="outline" className="h-7 text-[10px] rounded-lg gap-1"
                          onClick={() => openCompleteDialog(appt)}>
                          <PlayCircle className="h-3 w-3" /> Complete
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Medical Records */}
        <div className="bg-card border rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold flex items-center gap-2">
              <ClipboardList className="h-4 w-4 text-emerald-600" /> Recent Medical Records
            </h2>
          </div>
          {records.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="h-10 w-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm font-medium">No records yet</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
              {records.slice(0, 10).map((rec) => (
                <div key={rec.id} className="p-3 rounded-xl bg-muted/30 border border-border/40">
                  <p className="text-sm font-semibold truncate">{rec.diagnosis}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {rec.patient_name} · {safeFormat(rec.record_date, "dd MMM yyyy")}
                  </p>
                  {rec.prescription && <p className="text-xs text-muted-foreground mt-1 line-clamp-1">💊 {rec.prescription}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Prescriptions + Lab Reports */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent Prescriptions */}
        <div className="bg-card border rounded-2xl p-5 shadow-sm">
          <h2 className="text-sm font-bold flex items-center gap-2 mb-4">
            <Pill className="h-4 w-4 text-emerald-600" /> Recent Prescriptions
            <Badge variant="outline" className="ml-auto text-[10px]">{prescriptions.length} total</Badge>
          </h2>
          {prescriptions.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <Pill className="h-8 w-8 mx-auto mb-2 opacity-30" />
              <p className="text-xs">No prescriptions yet</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
              {prescriptions.slice(0, 8).map((rx) => {
                const meds = parseMeds(rx.medicines);
                return (
                  <div key={rx.id} className="p-3 rounded-xl bg-muted/20 border border-border/30">
                    <div className="flex justify-between items-start">
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">Patient #{rx.patientId}</p>
                        <p className="text-xs text-muted-foreground">{meds.length} medicine(s) · {safeFormat(rx.createdAt, "dd MMM")}</p>
                      </div>
                      <Badge className={`text-[10px] border-0 ${rx.status === "PENDING" ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"}`}>
                        {rx.status}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Lab Reports Ordered */}
        <div className="bg-card border rounded-2xl p-5 shadow-sm">
          <h2 className="text-sm font-bold flex items-center gap-2 mb-4">
            <FlaskConical className="h-4 w-4 text-purple-600" /> Lab Reports Ordered
            <Badge variant="outline" className="ml-auto text-[10px]">{labReports.length} total</Badge>
          </h2>
          {labReports.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <FlaskConical className="h-8 w-8 mx-auto mb-2 opacity-30" />
              <p className="text-xs">No lab reports yet</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
              {labReports.slice(0, 8).map((lr) => (
                <div key={lr.id} className="p-3 rounded-xl bg-muted/20 border border-border/30">
                  <div className="flex justify-between items-start">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{lr.labTest?.testName || "Test"}</p>
                      <p className="text-xs text-muted-foreground">
                        Patient: {lr.patient?.username || "—"} · {safeFormat(lr.createdAt, "dd MMM")}
                      </p>
                      {lr.result && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">📋 {lr.result}</p>}
                    </div>
                    <Badge className={`text-[10px] border-0 ${
                      lr.status?.toUpperCase() === "COMPLETED" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                    }`}>
                      {lr.status || "pending"}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ═══════ COMPLETE APPOINTMENT DIALOG ═══════ */}
      <Dialog open={!!completeTarget} onOpenChange={() => setCompleteTarget(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <Stethoscope className="h-5 w-5 text-emerald-600" />
              Complete Appointment — {completeTarget?.patient_name}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-5">
            {/* Diagnosis */}
            <div>
              <Label className="font-semibold">Diagnosis *</Label>
              <Input value={diagnosis} onChange={(e) => setDiagnosis(e.target.value)}
                placeholder="e.g. Acute bronchitis, Viral fever..." className="mt-1" />
            </div>

            {/* Medicines Table */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="font-semibold">Medicines</Label>
                <Button size="sm" variant="outline" className="h-7 text-xs gap-1 rounded-lg" onClick={addMedicineRow}>
                  <Plus className="h-3 w-3" /> Add Medicine
                </Button>
              </div>
              <div className="space-y-2">
                {medicines.map((med, idx) => (
                  <div key={idx} className="flex gap-2 items-start bg-muted/20 rounded-xl p-2.5">
                    <div className="flex-1 grid grid-cols-2 lg:grid-cols-4 gap-2">
                      <Input placeholder="Medicine name" value={med.name}
                        onChange={(e) => updateMedicine(idx, "name", e.target.value)} className="text-xs h-8" />
                      <Input placeholder="Dosage (1+0+1)" value={med.dosage}
                        onChange={(e) => updateMedicine(idx, "dosage", e.target.value)} className="text-xs h-8" />
                      <Input placeholder="Duration (7 days)" value={med.duration}
                        onChange={(e) => updateMedicine(idx, "duration", e.target.value)} className="text-xs h-8" />
                      <Input placeholder="Instructions" value={med.instructions}
                        onChange={(e) => updateMedicine(idx, "instructions", e.target.value)} className="text-xs h-8" />
                    </div>
                    {medicines.length > 1 && (
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-500 shrink-0"
                        onClick={() => removeMedicineRow(idx)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Lab Tests */}
            <div>
              <Label className="font-semibold mb-2 block">Lab Tests</Label>
              <div className="flex flex-wrap gap-2">
                {COMMON_LAB_TESTS.map((test) => (
                  <Badge key={test} variant="outline"
                    className={`cursor-pointer text-xs px-3 py-1.5 transition-all ${
                      selectedLabTests.includes(test)
                        ? "bg-purple-100 text-purple-700 border-purple-300"
                        : "hover:bg-muted/50"
                    }`}
                    onClick={() => toggleLabTest(test)}>
                    {selectedLabTests.includes(test) && <CheckCircle className="h-3 w-3 mr-1" />}
                    {test}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div>
              <Label className="font-semibold">Notes (optional)</Label>
              <Textarea value={rxNotes} onChange={(e) => setRxNotes(e.target.value)}
                placeholder="Additional instructions or observations..." rows={3} className="mt-1" />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCompleteTarget(null)}>Cancel</Button>
            <Button onClick={handleComplete} disabled={completing || !diagnosis.trim()}
              className="gap-1.5">
              <CheckCircle className="h-4 w-4" />
              {completing ? "Saving..." : "Complete & Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
