import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  CalendarCheck, Plus, Clock, Stethoscope, Pill, FileText,
  Settings, XCircle, RefreshCw, CheckCircle,
} from "lucide-react";
import { format, isSameDay, parseISO } from "date-fns";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { normalizeAppointmentStatus } from "@/lib/utils";
import { BookAppointmentDialog } from "@/components/appointments/BookAppointmentDialog";
import { DoctorAvailabilitySettings } from "@/components/appointments/DoctorAvailabilitySettings";
import { appointmentService } from "@/api/appointmentService";
import { prescriptionService } from "@/api/prescriptionService";

// FIXED: Interface now handles both string and number to prevent type mismatches
interface Appointment {
  diagnosis: string;
  prescription: string;
  id: string ; 
  patient_id?: string;
  doctor_id?: string;
  patientName?: string;
  doctorName?: string;
  appointmentDate?: string;
  appointment_date?: string;
  status: string;
  notes: string | null;
  consultation_type?: string;
  visit_type?: string;
  urgency?: string;
  symptoms?: string[];
  department?: string;
}

const statusColors: Record<string, string> = {
  scheduled: "bg-secondary/10 text-secondary border-secondary/20",
  upcoming: "bg-secondary/10 text-secondary border-secondary/20",
  completed: "bg-accent text-accent-foreground border-border",
  cancelled: "bg-destructive/10 text-destructive border-destructive/20",
  rescheduled: "bg-amber-500/10 text-amber-600 border-amber-500/20",
};

const statusIcons: Record<string, typeof CalendarCheck> = {
  scheduled: CalendarCheck,
  upcoming: CalendarCheck,
  completed: CheckCircle,
  cancelled: XCircle,
  rescheduled: RefreshCw,
};

export default function Appointments() {
  const { user, role } = useAuth();
  const [searchParams] = useSearchParams();
  const [date, setDate] = useState<Date>(new Date());
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");

  const [showBooking, setShowBooking] = useState(false);
  const [showAvailability, setShowAvailability] = useState(false);
  const [showPrescription, setShowPrescription] = useState<Appointment | null>(null);
  const [rescheduleAppt, setRescheduleAppt] = useState<Appointment | null>(null);

  const [diagnosis, setDiagnosis] = useState("");
  const [prescription, setPrescription] = useState("");
  const [rxNotes, setRxNotes] = useState("");
  const [followUp, setFollowUp] = useState("");
  const [rxSaving, setRxSaving] = useState(false);

  // Handle action=book query parameter for patient dashboard navigation
  useEffect(() => {
    const action = searchParams.get("action");
    if (action === "book" && role === "patient") {
      setShowBooking(true);
    }
  }, [searchParams, role]);

  useEffect(() => {
    fetchData();
  }, [role, user]);

  const fetchData = async () => {
    if (!role) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      let appts = [] as any[];

      if (role === "admin") {
        appts = await appointmentService.getAllAppointments();
      } else if (role === "doctor" || role === "nurse") {
        if (!user?.id) throw new Error("Doctor/Nurse ID missing");
        appts = await appointmentService.getDoctorSchedule(Number(user.id));
      } else {
        appts = await appointmentService.getMyAppointments();
      }

      // FIXED: Enriched and Normalized data to handle String IDs for the UI components
      const enriched = appts.map((a) => {
        const rawDate = a.appointment_date || a.appointmentDate;
        const rawStatus = a.status || "";
        const status = normalizeAppointmentStatus(rawStatus);
        return {
          ...a,
          id: String(a.id), // Force string ID for React component compatibility
          patient_id: a.patientId ? String(a.patientId) : (a.patient_id ? String(a.patient_id) : undefined),
          doctor_id: a.doctorId ? String(a.doctorId) : (a.doctor_id ? String(a.doctor_id) : undefined),
          appointment_date: rawDate ?? "",
          appointmentDate: rawDate ?? "",
          status,
          patientName: a.patientName ?? a.patient_name ?? "Unknown",
          doctorName: a.doctorName ?? a.doctor_name ?? "Unknown",
        } as Appointment;
      });

      setAppointments(enriched);
    } catch (error: any) {
      toast.error("Failed to load appointments: " + (error?.message || "Unknown"));
    } finally {
      setLoading(false);
    }
  };

  const parseAppointmentDate = (appt: Appointment): Date | null => {
    const raw = appt.appointment_date || appt.appointmentDate;
    if (!raw) return null;
    try {
      const parsed = parseISO(raw);
      return Number.isNaN(parsed.getTime()) ? null : parsed;
    } catch {
      return null;
    }
  };

  const dayAppointments = useMemo(() => {
    let filtered = appointments
      .map((a) => ({ appointment: a, date: parseAppointmentDate(a) }))
      .filter((item) => item.date && isSameDay(item.date, date))
      .map((item) => item.appointment);

    if (statusFilter !== "all") {
      filtered = filtered.filter((a) => a.status === statusFilter);
    }

    return filtered.sort((a, b) => {
      const aDate = parseAppointmentDate(a)?.getTime() ?? 0;
      const bDate = parseAppointmentDate(b)?.getTime() ?? 0;
      return aDate - bDate;
    });
  }, [appointments, date, statusFilter]);

  const appointmentDates = useMemo(() => {
    return [...new Set(
      appointments
        .map((a) => parseAppointmentDate(a))
        .filter((d): d is Date => d !== null)
        .map((d) => format(d, "yyyy-MM-dd"))
    )];
  }, [appointments]);

  const dayCounts = useMemo(() => {
    const all = appointments
      .map((a) => ({ appointment: a, date: parseAppointmentDate(a) }))
      .filter((item) => item.date && isSameDay(item.date, date))
      .map((item) => item.appointment);

    return {
      total: all.length,
      upcoming: all.filter((a) => a.status === "upcoming" || a.status === "rescheduled").length,
      completed: all.filter((a) => a.status === "completed").length,
      cancelled: all.filter((a) => a.status === "cancelled").length,
    };
  }, [appointments, date]);

  const handleCancel = async (appt: Appointment) => {
    if (!confirm("Cancel this appointment?")) return;
    try {
      await appointmentService.cancelAppointment(Number(appt.id));
      toast.success("Appointment cancelled");
      fetchData();
    } catch (error: any) {
      toast.error("Failed to cancel: " + (error?.message || "Unknown"));
    }
  };

  const handlePrescription = async () => {
    if (!diagnosis || !showPrescription) {
      toast.error("Diagnosis is required");
      return;
    }
    setRxSaving(true);
    try {
      // prescriptionService.create() now also marks the appointment as COMPLETED
      // and creates the medical record — no need to call completeAppointment separately.
      await prescriptionService.create({
        patientId: Number(showPrescription.patient_id),
        diagnosis,
        medicines: prescription ? [{ name: prescription }] : [],
        labTests: [],
        notes: rxNotes,
        appointmentId: Number(showPrescription.id),
      });

      toast.success("Prescription saved & appointment completed!");
      setShowPrescription(null);
      setDiagnosis("");
      setPrescription("");
      setRxNotes("");
      setFollowUp("");
      fetchData();
    } catch (error: any) {
      toast.error("Failed to save prescription: " + (error?.message || "Unknown"));
    } finally {
      setRxSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between animate-fade-in-up">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground tracking-tight">Appointments</h1>
          <p className="text-sm text-muted-foreground mt-1">Schedule, manage, and track appointments</p>
        </div>
        <div className="flex items-center gap-2">
          {role === "doctor" && (
            <Button variant="outline" className="rounded-xl gap-2" onClick={() => setShowAvailability(true)}>
              <Settings className="h-4 w-4" /> My Availability
            </Button>
          )}
          <Button onClick={() => setShowBooking(true)} className="gradient-btn text-white rounded-xl gap-2 border-0">
            <Plus className="h-4 w-4" /> Book Appointment
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 animate-fade-in-up" style={{ animationDelay: "80ms" }}>
        {[
          { label: "Total", value: dayCounts.total, color: "text-foreground" },
          { label: "Upcoming", value: dayCounts.upcoming, color: "text-secondary" },
          { label: "Completed", value: dayCounts.completed, color: "text-accent-foreground" },
          { label: "Cancelled", value: dayCounts.cancelled, color: "text-destructive" },
        ].map((s) => (
          <div key={s.label} className="dashboard-card p-4 text-center hover-lift">
            <p className={`text-2xl font-extrabold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-muted-foreground font-medium mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="dashboard-card p-5 animate-fade-in-up flex flex-col items-center" style={{ animationDelay: "160ms" }}>
          <h2 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2 self-start">
            <CalendarCheck className="h-4 w-4 text-secondary" />
            Select Date
          </h2>
          <Calendar
            mode="single"
            selected={date}
            onSelect={(d) => d && setDate(d)}
            className="rounded-xl pointer-events-auto mx-auto"
            modifiers={{
              hasAppointment: (day) => appointmentDates.includes(format(day, "yyyy-MM-dd")),
            }}
            modifiersClassNames={{
              hasAppointment: "bg-secondary/20 font-bold text-secondary",
            }}
          />
        </div>

        <div className="lg:col-span-2 dashboard-card p-5 animate-fade-in-up" style={{ animationDelay: "240ms" }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
              <Clock className="h-4 w-4 text-secondary" />
              {format(date, "EEEE, dd MMMM yyyy")}
            </h2>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-8 w-32 rounded-lg text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="upcoming">Upcoming</SelectItem>
                <SelectItem value="rescheduled">Rescheduled</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => <div key={i} className="h-16 rounded-xl skeleton-shimmer" />)}
            </div>
          ) : dayAppointments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <CalendarCheck className="h-12 w-12 mb-3 opacity-30" />
              <p className="font-medium">No appointments for this day</p>
            </div>
          ) : (
            <div className="space-y-2">
              {dayAppointments.map((appt) => {
                const StatusIcon = statusIcons[appt.status] || CalendarCheck;
                const canManage = role === "admin" || (role === "patient" && String(appt.patient_id) === String(user?.id)) || (role === "doctor" && String(appt.doctor_id) === String(user?.id));
                const isActive = appt.status === "upcoming" || appt.status === "rescheduled";
                const apptDate = parseAppointmentDate(appt);

                return (
                  <div
                    key={appt.id}
                    className={`p-4 rounded-2xl border-l-[3px] transition-all ${
                      appt.status === "completed" ? "bg-accent/50 border-accent-foreground/30" : 
                      appt.status === "cancelled" ? "bg-destructive/5 border-destructive/50 opacity-60" : 
                      appt.status === "rescheduled" ? "bg-amber-500/5 border-amber-500" : "bg-secondary/5 border-secondary"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-card border border-border shrink-0 mt-0.5">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="font-semibold text-foreground text-sm">
                            {apptDate ? format(apptDate, "hh:mm a") : "Invalid date"}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Patient: {appt.patientName} • Dr. {appt.doctorName}
                          </p>
                          {appt.notes && <p className="text-xs text-muted-foreground mt-1 italic">{appt.notes}</p>}
                          {/* View button for appointment - opens prescription modal */}
                          {role === "doctor" && isActive && (
                            <Button size="sm" variant="outline" className="rounded-xl text-xs h-7 mt-2" onClick={() => setShowPrescription(appt)}>
                              View
                            </Button>
                          )}
                        </div>
                      </div>
                      <Badge variant="outline" className={`text-[10px] capitalize ${statusColors[appt.status] || ""}`}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {appt.status}
                      </Badge>
                    </div>

                    {canManage && isActive && (
                      <div className="flex items-center gap-2 mt-3 ml-[52px]">
                        {role === "doctor" && (
                          <Button size="sm" variant="outline" className="rounded-xl text-xs h-7" onClick={() => setShowPrescription(appt)}>
                            <FileText className="h-3 w-3 mr-1" /> Write Rx
                          </Button>
                        )}
                        <Button size="sm" variant="outline" className="rounded-xl text-xs h-7" onClick={() => { setRescheduleAppt(appt); setShowBooking(true); }}>
                          <RefreshCw className="h-3 w-3 mr-1" /> Reschedule
                        </Button>
                        <Button size="sm" variant="outline" className="rounded-xl text-xs h-7 text-destructive hover:bg-destructive/10" onClick={() => handleCancel(appt)}>
                          <XCircle className="h-3 w-3 mr-1" /> Cancel
                        </Button>
                        <Button size="sm" variant="outline" className="rounded-xl text-xs h-7 text-green-700 hover:bg-green-100" onClick={async () => {
                          await appointmentService.completeAppointment(Number(appt.id), {
                            diagnosis: appt.diagnosis || "",
                            prescription: appt.prescription || "",
                            notes: appt.notes || ""
                          });
                          toast.success('Appointment marked as completed!');
                          fetchData();
                        }}>
                          <CheckCircle className="h-3 w-3 mr-1" /> Complete
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <BookAppointmentDialog
        open={showBooking}
        onOpenChange={(v) => { setShowBooking(v); if (!v) setRescheduleAppt(null); }}
        onSuccess={fetchData}
        rescheduleAppt={rescheduleAppt}
      />

      <DoctorAvailabilitySettings open={showAvailability} onOpenChange={setShowAvailability} />

      <Dialog open={!!showPrescription} onOpenChange={() => setShowPrescription(null)}>
        <DialogContent className="rounded-3xl max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <Stethoscope className="h-5 w-5 text-secondary" /> Write Prescription
            </DialogTitle>
          </DialogHeader>
          {showPrescription && (
            <div className="space-y-4 pt-2">
              <div className="p-3 rounded-xl bg-accent text-sm">
                <p className="font-semibold text-foreground">Patient: {showPrescription.patientName}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Diagnosis *</Label>
                <Input value={diagnosis} onChange={(e) => setDiagnosis(e.target.value)} placeholder="Diagnosis..." className="rounded-xl mt-1.5" />
              </div>
              <div>
                <Label className="text-sm font-medium">Prescription</Label>
                <Textarea value={prescription} onChange={(e) => setPrescription(e.target.value)} placeholder="Medications..." className="rounded-xl mt-1.5 font-mono text-sm" rows={4} />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPrescription(null)}>Cancel</Button>
            <Button onClick={handlePrescription} disabled={rxSaving} className="gradient-btn text-white border-0">
              {rxSaving ? "Saving..." : "Save Prescription"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}