import { useState, useEffect, useMemo } from "react";

import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { userService } from "@/api/userService";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList,
} from "@/components/ui/command";
import {
  CalendarCheck, Clock, Stethoscope, GraduationCap, Briefcase, Phone,
  Video, Building2, AlertTriangle, Upload, X, FileText, Shield,
  ChevronRight, ChevronLeft, Check, ChevronsUpDown,
} from "lucide-react";
import { format, addMinutes, parse, isAfter, isBefore } from "date-fns";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { appointmentService } from "@/api/appointmentService";
import { doctorAvailabilityService } from "@/api/doctorAvailabilityService";

interface Doctor {
  user_id: string;
  full_name: string | null;
  specialization: string | null;
  degrees: string | null;
  experience_years: number | null;
  avatar_url: string | null;
  phone: string | null;
}

interface Patient {
  user_id: string;
  full_name: string | null;
  insurance_provider: string | null;
  insurance_policy_number: string | null;
}
interface AvailabilitySlot {
  id?: string;
  day_of_week?: number;
  start_time: string;
  end_time: string;
  break_start: string | null;
  break_end: string | null;
  slot_duration: number;
  is_available: boolean;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  rescheduleAppt?: {
  id: string
  patient_id?: string
  doctor_id?: string
  notes?: string | null
} | null
}

const DEPARTMENTS = [
  "General Medicine", "Cardiology", "Neurology", "Orthopedics", "Dermatology",
  "Pediatrics", "Gynecology", "Ophthalmology", "ENT", "Dental",
  "Psychiatry", "Urology", "Gastroenterology", "Pulmonology", "Oncology",
];

const COMMON_SYMPTOMS = [
  "Fever", "Headache", "Cough", "Cold", "Pain", "Fatigue",
  "Nausea", "Dizziness", "Breathing Issue", "Chest Pain",
  "Back Pain", "Joint Pain", "Skin Rash", "Allergy", "Other",
];

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

interface DoctorAvailSummary {
  days: number[];
  start_time: string;
  end_time: string;
}

export function BookAppointmentDialog({ open, onOpenChange, onSuccess, rescheduleAppt }: Props) {
  const { user, role } = useAuth();
  const [step, setStep] = useState(1);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState("");
  const [selectedPatient, setSelectedPatient] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedSlot, setSelectedSlot] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [patientDropdownOpen, setPatientDropdownOpen] = useState(false);

  // New fields
  const [department, setDepartment] = useState("");
  const [consultationType, setConsultationType] = useState<"in-person" | "video">("in-person");
  const [visitType, setVisitType] = useState<"new" | "follow-up">("new");
  const [urgency, setUrgency] = useState<"normal" | "urgent" | "emergency">("normal");
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const [availability, setAvailability] = useState<AvailabilitySlot | null>(null);
  const [existingAppts, setExistingAppts] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [doctorAvailMap, setDoctorAvailMap] = useState<Record<string, DoctorAvailSummary>>({});

  useEffect(() => {
    if (open) {
      fetchPeople();
      setStep(1);
      if (rescheduleAppt) {
        setSelectedDoctor(rescheduleAppt.doctor_id);
        setSelectedPatient(rescheduleAppt.patient_id);
        setNotes(rescheduleAppt.notes || "");
        setStep(2); // Skip to step 2 for reschedule
      } else {
        setSelectedDoctor("");
        setSelectedPatient("");
        setNotes("");
        setDepartment("");
        setConsultationType("in-person");
        setVisitType("new");
        setUrgency("normal");
        setSelectedSymptoms([]);
        setUploadedFile(null);
      }
      setSelectedDate(undefined);
      setSelectedSlot("");
    }
  }, [open, rescheduleAppt]);

  const fetchPeople = async () => {
    try {
      let doctorsList: Array<{ id: number; username: string }> = [];
      let patientsList: Array<{ id: number; username: string }> = [];

      if (role === "admin") {
        const users = await userService.getAllUsers();
        doctorsList = users.filter((u) => u.role?.toLowerCase() === "doctor").map((d) => ({ id: d.id, username: d.username }));
        patientsList = users.filter((u) => u.role?.toLowerCase() === "patient").map((p) => ({ id: p.id, username: p.username }));
      } else {
        doctorsList = (await userService.getDoctors()).map((d) => ({ id: d.id, username: d.username }));
        patientsList = (await userService.getPatients()).map((p) => ({ id: p.id, username: p.username }));
      }

      setDoctors(doctorsList.map((d) => ({
        user_id: d.id.toString(),
        full_name: d.username,
        specialization: null,
        degrees: null,
        experience_years: null,
        avatar_url: null,
        phone: null,
      })));

      setPatients(patientsList.map((p) => ({
        user_id: p.id.toString(),
        full_name: p.username,
        insurance_provider: null,
        insurance_policy_number: null,
      })));

      const availMap: Record<string, DoctorAvailSummary> = {};
      await Promise.all(doctorsList.map(async (doc) => {
        try {
          const avail = await doctorAvailabilityService.getAvailability(Number(doc.id));
          const days = avail.filter((a) => a.isAvailable).map((a) => a.dayOfWeek);
          if (avail.length > 0) {
            availMap[doc.id.toString()] = {
              days,
              start_time: avail[0].startTime,
              end_time: avail[0].endTime,
            };
          }
        } catch (e) {
          console.warn("Failed to load availability for doctor", doc.id, e);
        }
      }));

      setDoctorAvailMap(availMap);

      if (role === "patient" && user) {
        setSelectedPatient(user.id);
      }
      if (role === "doctor" && user) {
        setSelectedDoctor(user.id);
      }
    } catch (error: any) {
      toast.error("Failed to load users or availability: " + (error?.message || "Unknown"));
      setDoctors([]);
      setPatients([]);
      setDoctorAvailMap({});
    }
  };

  // Filter doctors by department
  const filteredDoctors = useMemo(() => {
    if (!department || department === "all") return doctors;
    return doctors.filter((d) =>
      d.specialization?.toLowerCase().includes(department.toLowerCase())
    );
  }, [doctors, department]);

  useEffect(() => {
    if (selectedDoctor && selectedDate) {
      fetchSlots();
    } else {
      setAvailability(null);
      setExistingAppts([]);
    }
  }, [selectedDoctor, selectedDate]);

  const fetchSlots = async () => {
    if (!selectedDate || !selectedDoctor) return;
    setLoadingSlots(true);
    try {
      const dayOfWeek = selectedDate.getDay();
      const availRecords = await doctorAvailabilityService.getAvailability(Number(selectedDoctor));
      const avail = availRecords.find((a) => a.dayOfWeek === dayOfWeek && a.isAvailable);
      setAvailability(avail ? {
        id: avail.id?.toString(),
        day_of_week: avail.dayOfWeek,
        start_time: avail.startTime,
        end_time: avail.endTime,
        break_start: avail.breakStart || "",
        break_end: avail.breakEnd || "",
        is_available: avail.isAvailable,
        slot_duration: avail.slotDuration || 30,
      } : null);

      const appts = await appointmentService.getDoctorSchedule(Number(selectedDoctor));
      const dayStart = new Date(selectedDate);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayStart.getDate() + 1);

      const existing = appts
        .filter((a) => {
          const dt = new Date(a.appointmentDate);
          return dt >= dayStart && dt < dayEnd && (a.status === "SCHEDULED" || a.status === "RESCHEDULED" as any);
        })
        .map((a) => format(new Date(a.appointmentDate), "HH:mm"));

      setExistingAppts(existing);
    } catch (error: any) {
      toast.error("Failed to load slots: " + (error?.message || "Unknown"));
    } finally {
      setLoadingSlots(false);
    }
  };

  const availableSlots = useMemo(() => {
    if (!availability || !availability.is_available || !selectedDate) return [];

    const slots: string[] = [];
    const duration = availability.slot_duration || 30;
    const baseDate = "2000-01-01T";

    // Fix: Format should match the time data from backend (HH:mm format)
    try {
      let current = parse(baseDate + availability.start_time, "yyyy-MM-dd'T'HH:mm", new Date());
      const end = parse(baseDate + availability.end_time, "yyyy-MM-dd'T'HH:mm", new Date());
      const breakStart = availability.break_start
        ? parse(baseDate + availability.break_start, "yyyy-MM-dd'T'HH:mm", new Date())
        : null;
      const breakEnd = availability.break_end
        ? parse(baseDate + availability.break_end, "yyyy-MM-dd'T'HH:mm", new Date())
        : null;

    while (isBefore(current, end)) {
      const timeStr = format(current, "HH:mm");
      const slotEnd = addMinutes(current, duration);

      const inBreak =
        breakStart && breakEnd &&
        !(isAfter(current, breakEnd) || isBefore(slotEnd, breakStart)) &&
        !(format(current, "HH:mm") === format(breakEnd, "HH:mm"));

      if (!inBreak) {
        slots.push(timeStr);
      }
      current = slotEnd;
    }
    } catch (error: any) {
      console.error("Error parsing availability times:", error);
      console.log("Availability data:", availability);
    }
    return slots;
  }, [availability, selectedDate]);

  const bookedSet = new Set(existingAppts);
  const selectedDoctorProfile = doctors.find((d) => d.user_id === selectedDoctor);
  const selectedPatientProfile = patients.find((p) => p.user_id === selectedPatient);

  const toggleSymptom = (s: string) => {
    setSelectedSymptoms((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    );
  };

  const handleFileUpload = async (): Promise<string | null> => {
    if (!uploadedFile || !user) return null;
    setUploading(true);
    // File upload via supabase storage is disabled in API-only mode.
    setTimeout(() => setUploading(false), 500);
    toast.info("File upload is not available in this mode. Upload skipped.");
    return null;
  };

  const handleBook = async () => {
    const patientId = role === "patient" ? user!.id : selectedPatient;
    const doctorId = role === "doctor" ? user!.id : selectedDoctor;

    if (!patientId || !doctorId || !selectedDate || !selectedSlot) {
      toast.error("Please fill all required fields");
      return;
    }

    setSaving(true);

    let fileUrl: string | null = null;
    if (uploadedFile) {
      fileUrl = await handleFileUpload();
    }

    const apptDate = `${format(selectedDate, "yyyy-MM-dd")}T${selectedSlot}:00`;

    const appointmentData: any = {
      appointment_date: apptDate,
      doctor_id: doctorId,
      notes: notes || null,
      consultation_type: consultationType,
      visit_type: visitType,
      urgency,
      symptoms: selectedSymptoms,
      department: department || null,
      attached_file_url: fileUrl,
    };

    if (rescheduleAppt) {
      try {
        await appointmentService.rescheduleAppointment(Number(rescheduleAppt.id), apptDate);
        toast.success("Appointment rescheduled!");
        onSuccess();
        onOpenChange(false);
      } catch (error: any) {
        toast.error("Failed to reschedule: " + (error?.message || "Unknown"));
      }
    } else {
      if (role !== "patient" && !selectedPatient) {
        toast.error("Please select a patient to book on their behalf.");
        setSaving(false);
        return;
      }

      try {
        const payload: any = {
          doctorId: Number(doctorId),
          appointmentDate: apptDate,
          notes: notes || undefined,
        };

        if (role !== 'patient') {
          payload.patientId = Number(selectedPatient);
        }

        await appointmentService.bookAppointment(payload);
        toast.success("Appointment booked successfully!");
        onSuccess();
        onOpenChange(false);
      } catch (error: any) {
        toast.error("Failed to book: " + (error?.message || "Unknown"));
      }
    }
    setSaving(false);
  };

  const effectiveDoctor = role === "doctor" ? user!.id : selectedDoctor;

  const urgencyColors: Record<string, string> = {
    normal: "border-secondary/30 bg-secondary/5 text-secondary",
    urgent: "border-amber-500/30 bg-amber-500/5 text-amber-600",
    emergency: "border-destructive/30 bg-destructive/5 text-destructive",
  };

  const totalSteps = 3;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-3xl max-w-2xl max-h-[90vh] overflow-y-auto p-0">
        {/* Header */}
        <div className="p-5 md:p-6 pb-0">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <CalendarCheck className="h-5 w-5 text-secondary" />
              {rescheduleAppt ? "Reschedule Appointment" : "Book Appointment"}
            </DialogTitle>
          </DialogHeader>

          {/* Step Indicator */}
          {!rescheduleAppt && (
            <div className="flex items-center gap-2 mt-4">
              {[
                { n: 1, label: "Details" },
                { n: 2, label: "Schedule" },
                { n: 3, label: "Review" },
              ].map((s, i) => (
                <div key={s.n} className="flex items-center gap-2 flex-1">
                  <button
                    onClick={() => s.n < step && setStep(s.n)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all w-full ${
                      step === s.n
                        ? "gradient-btn text-white shadow-sm"
                        : step > s.n
                        ? "bg-secondary/10 text-secondary"
                        : "bg-muted/40 text-muted-foreground"
                    }`}
                  >
                    {step > s.n ? <Check className="h-3 w-3" /> : <span className="h-4 w-4 rounded-full border border-current flex items-center justify-center text-[9px]">{s.n}</span>}
                    <span className="hidden sm:inline">{s.label}</span>
                  </button>
                  {i < 2 && <ChevronRight className="h-3 w-3 text-muted-foreground/40 shrink-0" />}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-5 md:p-6 pt-4 space-y-4">
          {/* ═══ STEP 1: Patient Info, Department, Consultation Type ═══ */}
          {step === 1 && (
            <>
              {/* Patient Selection (for admin/doctor) */}
              {role !== "patient" && (
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">Patient *</Label>
                  <Popover open={patientDropdownOpen} onOpenChange={setPatientDropdownOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" role="combobox" className="w-full justify-between rounded-xl h-10 text-sm font-normal">
                        {patients.find((p) => p.user_id === selectedPatient)?.full_name || "Search patient..."}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0 rounded-xl" align="start">
                      <Command>
                        <CommandInput placeholder="Search by name..." />
                        <CommandList>
                          <CommandEmpty>No patient found.</CommandEmpty>
                          <CommandGroup>
                            {patients.map((p) => (
                              <CommandItem
                                key={p.user_id}
                                value={p.full_name || ""}
                                onSelect={() => {
                                  setSelectedPatient(p.user_id);
                                  setPatientDropdownOpen(false);
                                }}
                              >
                                <Check className={cn("mr-2 h-4 w-4", selectedPatient === p.user_id ? "opacity-100" : "opacity-0")} />
                                {p.full_name || "Unnamed"}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
              )}

              {/* Department */}
              <div className="space-y-1.5">
                <Label className="text-sm font-medium flex items-center gap-1.5">
                  <Building2 className="h-3.5 w-3.5" /> Department
                </Label>
                <Select value={department} onValueChange={setDepartment}>
                  <SelectTrigger className="rounded-xl h-10">
                    <SelectValue placeholder="Select department (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Departments</SelectItem>
                    {DEPARTMENTS.map((d) => (
                      <SelectItem key={d} value={d}>{d}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Doctor Selection */}
              {role !== "doctor" && (
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">Select Doctor *</Label>
                  {filteredDoctors.length === 0 ? (
                    <div className="p-4 rounded-xl bg-muted/30 text-center">
                      <p className="text-sm text-muted-foreground">
                        {department && department !== "all"
                          ? `No doctors found in ${department}`
                          : "No doctors available"}
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-2 max-h-[200px] overflow-y-auto pr-1">
                      {filteredDoctors.map((d) => {
                        const isSelected = selectedDoctor === d.user_id;
                        const docInitials = d.full_name?.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) || "DR";
                        return (
                          <button
                            key={d.user_id}
                            onClick={() => setSelectedDoctor(d.user_id)}
                            className={`p-3 rounded-xl border text-left transition-all hover:scale-[1.01] ${
                              isSelected
                                ? "border-secondary bg-secondary/5 ring-1 ring-secondary/20"
                                : "border-border bg-card hover:border-secondary/40"
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <Avatar className="h-10 w-10 shrink-0 ring-2 ring-primary/10">
                                <AvatarImage src={d.avatar_url || ""} />
                                <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white text-xs font-bold">
                                  {docInitials}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-foreground truncate">{d.full_name?.startsWith("Dr.") ? d.full_name : `Dr. ${d.full_name}`}</p>
                                <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-0.5">
                                  {d.specialization && (
                                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                                      <Stethoscope className="h-3 w-3 text-secondary" />
                                      <span className="font-medium text-secondary">{d.specialization}</span>
                                    </span>
                                  )}
                                  {d.degrees && (
                                    <span className="text-[10px] text-muted-foreground hidden sm:inline">{d.degrees}</span>
                                  )}
                                </div>
                                {d.experience_years && (
                                  <p className="text-[10px] text-primary font-medium mt-0.5">{d.experience_years} Years of Experience</p>
                                )}
                                {/* Availability summary */}
                                {doctorAvailMap[d.user_id] && (
                                  <div className="mt-1.5 p-1.5 rounded-lg bg-muted/40 flex items-start gap-1.5">
                                    <Clock className="h-3 w-3 text-muted-foreground mt-0.5 shrink-0" />
                                    <div className="text-[10px] text-muted-foreground leading-relaxed">
                                      <span className="font-medium text-foreground">
                                        {doctorAvailMap[d.user_id].days.sort((a, b) => a - b).map(day => DAY_NAMES[day]).join(" ")}
                                      </span>
                                      {" "}
                                      {doctorAvailMap[d.user_id].start_time?.slice(0, 5)} – {doctorAvailMap[d.user_id].end_time?.slice(0, 5)}
                                    </div>
                                  </div>
                                )}
                              </div>
                              {isSelected && (
                                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-secondary text-white shrink-0">
                                  <Check className="h-3.5 w-3.5" />
                                </div>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Consultation Type */}
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Consultation Type</Label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: "in-person" as const, icon: Building2, label: "In-Person", desc: "Visit the hospital" },
                    { value: "video" as const, icon: Video, label: "Video Call", desc: "Online consultation" },
                  ].map((ct) => (
                    <button
                      key={ct.value}
                      onClick={() => setConsultationType(ct.value)}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        consultationType === ct.value
                          ? "border-secondary bg-secondary/5 ring-1 ring-secondary/20"
                          : "border-border bg-card hover:border-secondary/40"
                      }`}
                    >
                      <ct.icon className={`h-5 w-5 mb-1.5 ${consultationType === ct.value ? "text-secondary" : "text-muted-foreground"}`} />
                      <p className="text-sm font-semibold text-foreground">{ct.label}</p>
                      <p className="text-[10px] text-muted-foreground">{ct.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Visit Type */}
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Visit Type</Label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: "new" as const, label: "New Visit", desc: "First time consultation" },
                    { value: "follow-up" as const, label: "Follow-up", desc: "Previous visit follow-up" },
                  ].map((vt) => (
                    <button
                      key={vt.value}
                      onClick={() => setVisitType(vt.value)}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        visitType === vt.value
                          ? "border-secondary bg-secondary/5 ring-1 ring-secondary/20"
                          : "border-border bg-card hover:border-secondary/40"
                      }`}
                    >
                      <p className="text-sm font-semibold text-foreground">{vt.label}</p>
                      <p className="text-[10px] text-muted-foreground">{vt.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Urgency */}
              <div className="space-y-1.5">
                <Label className="text-sm font-medium flex items-center gap-1.5">
                  <AlertTriangle className="h-3.5 w-3.5" /> Urgency Level
                </Label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: "normal" as const, label: "Normal", icon: "🟢" },
                    { value: "urgent" as const, label: "Urgent", icon: "🟡" },
                    { value: "emergency" as const, label: "Emergency", icon: "🔴" },
                  ].map((u) => (
                    <button
                      key={u.value}
                      onClick={() => setUrgency(u.value)}
                      className={`p-2.5 rounded-xl border text-center transition-all ${
                        urgency === u.value
                          ? urgencyColors[u.value] + " ring-1"
                          : "border-border bg-card hover:border-muted-foreground/30"
                      }`}
                    >
                      <span className="text-base">{u.icon}</span>
                      <p className="text-xs font-medium mt-0.5">{u.label}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Symptoms */}
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Symptoms (select all that apply)</Label>
                <div className="flex flex-wrap gap-1.5">
                  {COMMON_SYMPTOMS.map((s) => (
                    <button
                      key={s}
                      onClick={() => toggleSymptom(s)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                        selectedSymptoms.includes(s)
                          ? "gradient-btn text-white shadow-sm"
                          : "bg-muted/40 text-muted-foreground hover:bg-muted/60 border border-border"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* ═══ STEP 2: Date, Time, Notes, File Upload ═══ */}
          {step === 2 && (
            <>
              {/* Selected Doctor Recap */}
              {selectedDoctorProfile && role !== "doctor" && (
                <div className="p-3 rounded-xl bg-gradient-to-br from-primary/5 to-secondary/5 border border-primary/10 flex items-center gap-3">
                  <Avatar className="h-10 w-10 shrink-0 ring-2 ring-primary/10">
                    <AvatarImage src={selectedDoctorProfile.avatar_url || ""} />
                    <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white text-xs font-bold">
                      {selectedDoctorProfile.full_name?.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) || "DR"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold text-sm text-foreground">{selectedDoctorProfile.full_name?.startsWith("Dr.") ? selectedDoctorProfile.full_name : `Dr. ${selectedDoctorProfile.full_name}`}</p>
                    <p className="text-[10px] text-muted-foreground">{selectedDoctorProfile.specialization || "General"} · {consultationType === "video" ? "📹 Video Call" : "🏥 In-Person"}</p>
                  </div>
                </div>
              )}

              {/* Date Picker */}
              {effectiveDoctor && (
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">Select Date *</Label>
                  <div className="flex justify-center">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={setSelectedDate}
                      disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                      className="rounded-xl"
                    />
                  </div>
                </div>
              )}

              {/* Time Slots */}
              {selectedDate && effectiveDoctor && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5" />
                    Available Slots — {format(selectedDate, "dd MMM yyyy")}
                    {availability && availability.is_available && (
                      <span className="text-[10px] text-muted-foreground font-normal ml-auto">
                        {availability.start_time?.slice(0,5)} - {availability.end_time?.slice(0,5)} ({availability.slot_duration} min slots)
                      </span>
                    )}
                  </Label>
                  {loadingSlots ? (
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                      {[1, 2, 3, 4, 5, 6].map((i) => <div key={i} className="h-9 rounded-lg skeleton-shimmer" />)}
                    </div>
                  ) : !availability || !availability.is_available ? (
                    <div className="p-4 rounded-xl bg-destructive/5 text-center">
                      <p className="text-sm text-destructive font-medium">Doctor is not available on this day</p>
                      <p className="text-xs text-muted-foreground mt-1">Please select another date</p>
                    </div>
                  ) : availableSlots.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-3">No slots configured</p>
                  ) : (
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                      {availableSlots.map((slot) => {
                        const booked = bookedSet.has(slot);
                        const selected = selectedSlot === slot;
                        const duration = availability?.slot_duration || 30;
                        const slotEnd = format(addMinutes(parse(`2000-01-01 ${slot}`, "yyyy-MM-dd HH:mm", new Date()), duration), "HH:mm");
                        return (
                          <button
                            key={slot}
                            disabled={booked}
                            onClick={() => setSelectedSlot(slot)}
                            className={`py-2 px-2 rounded-xl text-xs font-medium transition-all ${
                              booked
                                ? "bg-muted text-muted-foreground/50 cursor-not-allowed line-through"
                                : selected
                                ? "gradient-btn text-white shadow-md"
                                : "border border-border bg-card text-foreground hover:border-secondary hover:bg-secondary/5"
                            }`}
                          >
                            {slot} - {slotEnd}
                          </button>
                        );
                      })}
                    </div>
                  )}
                  {availableSlots.length > 0 && (
                    <div className="flex gap-3 text-[10px] text-muted-foreground">
                      <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-secondary inline-block" /> Available</span>
                      <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-muted inline-block" /> Booked</span>
                    </div>
                  )}
                </div>
              )}

              {/* Notes */}
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Notes / Reason for visit</Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Describe your symptoms or reason for visit..."
                  className="rounded-xl"
                  rows={2}
                />
              </div>

              {/* File Upload */}
              <div className="space-y-1.5">
                <Label className="text-sm font-medium flex items-center gap-1.5">
                  <Upload className="h-3.5 w-3.5" /> Upload Previous Records (optional)
                </Label>
                {uploadedFile ? (
                  <div className="flex items-center gap-3 p-3 rounded-xl border border-secondary/30 bg-secondary/5">
                    <FileText className="h-5 w-5 text-secondary shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{uploadedFile.name}</p>
                      <p className="text-[10px] text-muted-foreground">{(uploadedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive" onClick={() => setUploadedFile(null)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center gap-2 p-6 rounded-xl border-2 border-dashed border-border hover:border-secondary/40 cursor-pointer transition-all bg-muted/20 hover:bg-muted/40">
                    <Upload className="h-6 w-6 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">Click to upload PDF, Images</p>
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png,.webp"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          if (file.size > 10 * 1024 * 1024) {
                            toast.error("File must be less than 10MB");
                            return;
                          }
                          setUploadedFile(file);
                        }
                      }}
                    />
                  </label>
                )}
              </div>
            </>
          )}

          {/* ═══ STEP 3: Review & Confirm ═══ */}
          {step === 3 && (
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-foreground">Review Your Appointment</h3>

              {/* Doctor */}
              {selectedDoctorProfile && (
                <div className="p-3.5 rounded-xl bg-gradient-to-br from-primary/5 to-secondary/5 border border-primary/10 flex items-center gap-3">
                  <Avatar className="h-11 w-11 shrink-0 ring-2 ring-primary/10">
                    <AvatarImage src={selectedDoctorProfile.avatar_url || ""} />
                    <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white text-xs font-bold">
                      {selectedDoctorProfile.full_name?.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) || "DR"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-bold text-sm text-foreground">Dr. {selectedDoctorProfile.full_name}</p>
                    <p className="text-xs text-muted-foreground">{selectedDoctorProfile.specialization || "General Medicine"}</p>
                  </div>
                </div>
              )}

              {/* Summary Grid */}
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: "Date", value: selectedDate ? format(selectedDate, "dd MMM yyyy") : "—" },
                  { label: "Time", value: selectedSlot || "—" },
                  { label: "Type", value: consultationType === "video" ? "📹 Video Call" : "🏥 In-Person" },
                  { label: "Visit", value: visitType === "new" ? "New Visit" : "Follow-up" },
                  { label: "Urgency", value: urgency.charAt(0).toUpperCase() + urgency.slice(1) },
                  { label: "Department", value: department && department !== "all" ? department : "General" },
                ].map((item) => (
                  <div key={item.label} className="p-2.5 rounded-lg bg-muted/30 border border-border/40">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{item.label}</p>
                    <p className="text-sm font-semibold text-foreground mt-0.5">{item.value}</p>
                  </div>
                ))}
              </div>

              {/* Symptoms */}
              {selectedSymptoms.length > 0 && (
                <div className="p-3 rounded-xl bg-muted/20 border border-border/40">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1.5">Symptoms</p>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedSymptoms.map((s) => (
                      <Badge key={s} variant="outline" className="text-[10px]">{s}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Notes */}
              {notes && (
                <div className="p-3 rounded-xl bg-muted/20 border border-border/40">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">Notes</p>
                  <p className="text-sm text-foreground">{notes}</p>
                </div>
              )}

              {/* File */}
              {uploadedFile && (
                <div className="p-3 rounded-xl bg-secondary/5 border border-secondary/20 flex items-center gap-2">
                  <FileText className="h-4 w-4 text-secondary" />
                  <p className="text-sm font-medium text-foreground truncate">{uploadedFile.name}</p>
                </div>
              )}

              {/* Insurance */}
              {(role === "patient" || selectedPatientProfile?.insurance_provider) && (
                <div className="p-3 rounded-xl bg-muted/20 border border-border/40 flex items-center gap-2">
                  <Shield className="h-4 w-4 text-primary" />
                  <div>
                    <p className="text-[10px] text-muted-foreground">Insurance</p>
                    <p className="text-sm font-medium text-foreground">
                      {(role === "patient" ? "Loaded from profile" : selectedPatientProfile?.insurance_provider) || "No insurance on file"}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-5 md:p-6 pt-0 flex items-center justify-between gap-2">
          <div>
            {step > 1 && !rescheduleAppt && (
              <Button variant="outline" className="rounded-xl gap-1.5" onClick={() => setStep(step - 1)}>
                <ChevronLeft className="h-3.5 w-3.5" /> Back
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="rounded-xl" onClick={() => onOpenChange(false)}>Cancel</Button>
            {step < totalSteps && !rescheduleAppt ? (
              <Button
                className="rounded-xl gradient-btn text-white border-0 gap-1.5"
                onClick={() => setStep(step + 1)}
                disabled={step === 1 && !effectiveDoctor}
              >
                Next <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            ) : (
              <Button
                className="rounded-xl gradient-btn text-white border-0"
                onClick={handleBook}
                disabled={saving || !selectedSlot || uploading}
              >
                {saving || uploading ? "Saving..." : rescheduleAppt ? "Reschedule" : "Confirm Booking"}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
