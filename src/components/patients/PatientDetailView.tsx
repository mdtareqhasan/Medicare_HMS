import { useState, useEffect } from "react";

import { useAuth } from "@/contexts/AuthContext";
import { appointmentService } from "@/api/appointmentService";
import { medicalRecordService } from "@/api/medicalRecordService";
import { prescriptionService } from "@/api/prescriptionService";
import { labReportService } from "@/api/labReportService";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  User, Phone, MapPin, Calendar, Heart, Shield, FileText,
  Stethoscope, Pill, FlaskConical, Edit, Save, X, Plus, Download, Activity,
  CalendarCheck,
} from "lucide-react";
import { format, isValid } from "date-fns";
import { toast } from "sonner";
import { CreatePrescriptionForm } from "./CreatePrescriptionForm";
import { exportPrescriptionPdf } from "@/utils/exportPrescriptionPdf";

interface PatientDetailViewProps {
  patient: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface MedicalRecord {
  id: string;
  diagnosis: string;
  prescription: string | null;
  notes: string | null;
  record_date: string;
  doctor_id: string;
}

interface LabReport {
  id: string;
  title: string;
  description: string | null;
  result: string | null;
  status: string;
  report_date: string;
  file_url: string | null;
}

interface MedicalDocument {
  id: string;
  title: string;
  description: string | null;
  file_url: string;
  file_type: string | null;
  created_at: string;
}

interface Prescription {
  id: string;
  doctor_id: string;
  status: string;
  medicines: any;
  notes: string | null;
  created_at: string;
  patient_id?: string;
  doctor_name?: string;
}

export function PatientDetailView({ patient, open, onOpenChange }: PatientDetailViewProps) {
  const { user, role } = useAuth();
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [labReports, setLabReports] = useState<LabReport[]>([]);
  const [documents, setDocuments] = useState<MedicalDocument[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPrescriptionForm, setShowPrescriptionForm] = useState(false);
  const [doctorProfile, setDoctorProfile] = useState<any>(null);

  // Edit record state
  const [editingRecord, setEditingRecord] = useState<MedicalRecord | null>(null);
  const [editForm, setEditForm] = useState({ diagnosis: "", prescription: "", notes: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (patient && open) {
      fetchPatientData();
      if (user) fetchDoctorProfile();
    }
  }, [patient, open]);

  // Realtime subscription for prescriptions and lab reports
  useEffect(() => {
    // Real-time subscription is currently not supported in API mode.
    // TODO: add WebSocket / SSE endpoint for live updates.
    if (!patient || !open) return;
  }, [patient, open]);

  const fetchDoctorProfile = async () => {
    if (!user) return;
    setDoctorProfile({ full_name: user.email || "Doctor", specialization: "" });
  };

  const fetchPrescriptions = async () => {
    if (!patient && !user) {
      setPrescriptions([]);
      return;
    }

    try {
      const patientId = patient?.user_id ? Number(patient.user_id) : Number(user?.id);
      if (!patientId) {
        setPrescriptions([]);
        return;
      }

      const rxItems = await prescriptionService.getPatientPrescriptions(patientId);
      setPrescriptions(
        rxItems.map((rx) => ({
          id: rx.id.toString(),
          doctor_id: rx.doctorId.toString(),
          patient_id: rx.patientId.toString(),
          status: rx.status.toLowerCase(),
          medicines: Array.isArray(rx.medicines)
            ? rx.medicines
            : rx.medicines
              ? JSON.parse(rx.medicines as unknown as string)
              : [],
          notes: rx.notes || "",
          created_at: rx.createdAt,
          doctor_name: "",
        }))
      );

      const records = await medicalRecordService.getPatientRecords(patientId);
      setRecords(
        records.map((r) => ({
          id: r.id.toString(),
          diagnosis: r.diagnosis,
          prescription: r.prescription,
          notes: r.notes,
          record_date: r.recordDate,
          doctor_id: r.doctorId.toString(),
        }))
      );
    } catch (error: any) {
      console.warn("Failed to fetch prescriptions", error);
      setPrescriptions([]);
      setRecords([]);
    }
  };

  const fetchLabReports = async () => {
    if (!patient && !user) {
      setLabReports([]);
      return;
    }

    try {
      const patientId = patient?.user_id ? Number(patient.user_id) : Number(user?.id);
      if (!patientId) {
        setLabReports([]);
        return;
      }

      const reports = await labReportService.getPatientReports(patientId);
      setLabReports(
        reports.map((r) => ({
          id: r.id.toString(),
          title: r.labTest?.testName || "",
          description: r.labTest?.description || "",
          status: (r.status || "").toLowerCase(),
          report_date: r.createdAt || "",
          file_url: r.resultUrl || null,
        }))
      );
    } catch (error: any) {
      console.warn("Failed to fetch lab reports", error);
      setLabReports([]);
    }
  };

  const fetchPatientData = async () => {
    setLoading(true);
    try {
      setRecords([]);
      setLabReports([]);
      setDocuments([]);
      setPrescriptions([]);

      if (patient?.user_id) {
        const appointmentsResp = await appointmentService.getPatientAppointments(Number(patient.user_id));
        setAppointments(appointmentsResp.map((a) => ({ ...a, appointment_date: a.appointmentDate } as any)));
      } else if (role === "patient" && user?.id) {
        const myAppointments = await appointmentService.getMyAppointments();
        setAppointments(myAppointments.map((a) => ({ ...a, appointment_date: a.appointmentDate } as any)));
      } else {
        setAppointments([]);
      }
      await fetchPrescriptions();
      await fetchLabReports();
    } catch (error) {
      console.warn("Failed to load patient data", error);
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  };

  const canEditRecord = (record: MedicalRecord) => {
    return role === "admin" || (role === "doctor" && record.doctor_id === user?.id);
  };

  const startEditing = (record: MedicalRecord) => {
    setEditingRecord(record);
    setEditForm({
      diagnosis: record.diagnosis,
      prescription: record.prescription || "",
      notes: record.notes || "",
    });
  };

  const handleUpdateRecord = async () => {
    if (!editingRecord) return;
    setSaving(true);
    // Backend medical records management is not yet implemented; this is a UI stub.
    toast.success("Medical record update is pending backend API support.");
    setEditingRecord(null);
    await fetchPatientData();
    setSaving(false);
  };

  const handleExportPdf = (rx: Prescription) => {
    const medicines = Array.isArray(rx.medicines) ? rx.medicines : [];
    // Find matching lab reports created around same time
    const rxDate = new Date(rx.created_at);
    const relatedLabs = labReports
      .filter((l) => {
        const labDate = new Date(l.report_date);
        return Math.abs(rxDate.getTime() - labDate.getTime()) < 60000 * 5; // within 5 min
      })
      .map((l) => l.title);

    exportPrescriptionPdf({
      patientName: patient.full_name || "N/A",
      patientAge: patient.age,
      patientGender: patient.gender,
      patientPhone: patient.phone,
      patientBloodGroup: patient.blood_group,
      doctorName: doctorProfile?.full_name || "Doctor",
      doctorSpecialization: doctorProfile?.specialization || "",
      medicines: medicines.map((m: any) => ({
        name: m.name || m.medicine_name || "Medicine",
        dosage: m.dosage || "",
        duration: m.duration || "",
        instructions: m.instructions || "",
      })),
      labTests: relatedLabs.length > 0 ? relatedLabs : undefined,
      notes: rx.notes || undefined,
      date: rx.created_at && isValid(new Date(rx.created_at)) ? format(new Date(rx.created_at), "dd MMM yyyy") : "N/A",
    });
    toast.success("PDF exported!");
  };

  if (!patient) return null;

  const STATUS_COLORS: Record<string, string> = {
    pending: "bg-amber-500/10 text-amber-600 border-amber-500/20",
    completed: "bg-secondary/10 text-secondary border-secondary/20",
    cancelled: "bg-destructive/10 text-destructive border-destructive/20",
    dispensed: "bg-secondary/10 text-secondary border-secondary/20",
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-3xl max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">Patient Details</DialogTitle>
        </DialogHeader>

        {/* Patient Info Header */}
        <div className="flex items-start gap-4 p-4 rounded-2xl bg-muted/50">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary/10 shrink-0">
            <User className="h-8 w-8 text-secondary" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-xl font-bold text-foreground">{patient.full_name || "Unnamed"}</h3>
            <div className="flex flex-wrap gap-2 mt-2">
              {patient.gender && <Badge variant="outline" className="capitalize text-xs">{patient.gender}</Badge>}
              {patient.age && <Badge variant="outline" className="text-xs">{patient.age} years</Badge>}
              {patient.blood_group && <Badge variant="outline" className="text-xs text-destructive border-destructive/30">{patient.blood_group}</Badge>}
            </div>
          </div>
          {role === "doctor" && (
            <Button
              size="sm"
              className="rounded-xl gradient-btn text-white border-0 gap-1.5 shrink-0"
              onClick={() => setShowPrescriptionForm(true)}
            >
              <Plus className="h-3.5 w-3.5" /> Prescribe
            </Button>
          )}
        </div>

        {/* Contact & Insurance */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Phone className="h-3.5 w-3.5" />
              <span>{patient.phone || "No phone"}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-3.5 w-3.5" />
              <span>{patient.date_of_birth && isValid(new Date(patient.date_of_birth)) ? format(new Date(patient.date_of_birth), "dd MMM yyyy") : "No DOB"}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="h-3.5 w-3.5" />
              <span className="truncate">{patient.address || "No address"}</span>
            </div>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Heart className="h-3.5 w-3.5 text-destructive" />
              <span>
                {patient.emergency_contact_name
                  ? `${patient.emergency_contact_name} (${patient.emergency_contact_relation || "N/A"}) - ${patient.emergency_contact_phone || "N/A"}`
                  : "No emergency contact"}
              </span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Shield className="h-3.5 w-3.5" />
              <span>
                {patient.insurance_provider
                  ? `${patient.insurance_provider} — #${patient.insurance_policy_number || "N/A"}`
                  : "No insurance"}
              </span>
            </div>
          </div>
        </div>

        {/* Patient Symptoms from Appointments */}
        {(() => {
          const allSymptoms = appointments
            .filter((a) => a.symptoms && Array.isArray(a.symptoms) && a.symptoms.length > 0)
            .flatMap((a) => a.symptoms as string[]);
          const uniqueSymptoms = [...new Set(allSymptoms)];
          if (uniqueSymptoms.length === 0) return null;
          return (
            <div className="p-3 rounded-2xl bg-amber-500/5 border border-amber-500/20">
              <p className="text-xs font-semibold text-foreground flex items-center gap-1.5 mb-2">
                <Activity className="h-3.5 w-3.5 text-amber-600" />
                Patient Reported Symptoms
              </p>
              <div className="flex flex-wrap gap-1.5">
                {uniqueSymptoms.map((s, i) => (
                  <Badge key={i} variant="outline" className="text-[10px] bg-amber-500/10 text-amber-700 border-amber-500/20">
                    {s}
                  </Badge>
                ))}
              </div>
            </div>
          );
        })()}

        {/* Prescription Form */}
        {showPrescriptionForm && role === "doctor" && (
          <CreatePrescriptionForm
            patientId={patient.user_id}
            patientName={patient.full_name || "Patient"}
            onSuccess={() => {
              setShowPrescriptionForm(false);
              fetchPatientData();
            }}
            onCancel={() => setShowPrescriptionForm(false)}
          />
        )}

        {/* Tabs */}
        <Tabs defaultValue="prescriptions" className="mt-2">
          <TabsList className="w-full rounded-xl">
            <TabsTrigger value="appointments" className="flex-1 rounded-lg text-xs">
              <CalendarCheck className="h-3.5 w-3.5 mr-1.5" />
              Appointments ({appointments.length})
            </TabsTrigger>
            <TabsTrigger value="prescriptions" className="flex-1 rounded-lg text-xs">
              <Pill className="h-3.5 w-3.5 mr-1.5" />
              Rx ({prescriptions.length})
            </TabsTrigger>
            <TabsTrigger value="records" className="flex-1 rounded-lg text-xs">
              <Stethoscope className="h-3.5 w-3.5 mr-1.5" />
              Records ({records.length})
            </TabsTrigger>
            <TabsTrigger value="lab" className="flex-1 rounded-lg text-xs">
              <FlaskConical className="h-3.5 w-3.5 mr-1.5" />
              Lab ({labReports.length})
            </TabsTrigger>
            <TabsTrigger value="documents" className="flex-1 rounded-lg text-xs">
              <FileText className="h-3.5 w-3.5 mr-1.5" />
              Docs ({documents.length})
            </TabsTrigger>
          </TabsList>

          {loading ? (
            <div className="p-6 space-y-3">
              {[1, 2, 3].map((i) => <div key={i} className="h-16 rounded-xl skeleton-shimmer" />)}
            </div>
          ) : (
            <>
              {/* Appointments Tab */}
              <TabsContent value="appointments" className="space-y-3 mt-3">
                {appointments.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground text-sm">No appointments yet</div>
                ) : (
                  <div className="grid grid-cols-1 gap-3">
                    {appointments.map((apt) => (
                      <div key={apt.id} className="p-4 rounded-2xl border border-border bg-card">
                        <div className="flex items-center justify-between">
                          <p className="font-semibold text-sm">{(apt.appointmentDate || apt.appointment_date) && isValid(new Date(apt.appointmentDate || apt.appointment_date)) ? format(new Date(apt.appointmentDate || apt.appointment_date), "dd MMM yyyy, hh:mm a") : "N/A"}</p>
                          <Badge variant="outline" className="text-[10px] capitalize">
                            {((apt.status || "").toString()).toLowerCase()}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Doctor: {apt.doctor?.username || apt.doctor_name || "Unknown"}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">Notes: {apt.notes || "-"}</p>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* Prescriptions Tab */}
              <TabsContent value="prescriptions" className="space-y-3 mt-3">
                {prescriptions.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground text-sm">No prescriptions yet</div>
                ) : (
                  prescriptions.map((rx) => {
                    const meds = Array.isArray(rx.medicines) ? rx.medicines : [];
                    return (
                      <div key={rx.id} className="p-4 rounded-2xl border border-border bg-card space-y-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="text-xs text-muted-foreground">
                              {rx.created_at && isValid(new Date(rx.created_at)) ? format(new Date(rx.created_at), "dd MMM yyyy, hh:mm a") : "N/A"}
                            </p>
                            <Badge variant="outline" className={`text-[10px] capitalize mt-1 ${STATUS_COLORS[rx.status] || ""}`}>
                              {rx.status}
                            </Badge>
                          </div>
                          <Button size="sm" variant="outline" className="rounded-xl text-xs gap-1" onClick={() => handleExportPdf(rx)}>
                            <Download className="h-3 w-3" /> Export PDF
                          </Button>
                        </div>

                        {/* Medicine list */}
                        {meds.length > 0 && (
                          <div className="space-y-1.5">
                            {meds.map((m: any, i: number) => (
                              <div key={i} className="flex items-start gap-2 text-xs p-2 rounded-lg bg-muted/30">
                                <Pill className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
                                <div>
                                  <span className="font-medium text-foreground">{m.name || m.medicine_name}</span>
                                  <div className="flex flex-wrap gap-1.5 mt-1">
                                    {m.dosage && <Badge variant="outline" className="text-[9px]">💊 {m.dosage}</Badge>}
                                    {m.duration && <Badge variant="outline" className="text-[9px]">📅 {m.duration}</Badge>}
                                    {m.instructions && <Badge variant="outline" className="text-[9px]">📝 {m.instructions}</Badge>}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {rx.notes && (
                          <p className="text-xs text-muted-foreground italic">{rx.notes}</p>
                        )}
                      </div>
                    );
                  })
                )}
              </TabsContent>

              {/* Records Tab */}
              <TabsContent value="records" className="space-y-3 mt-3">
                {records.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground text-sm">No medical records found</div>
                ) : (
                  records.map((rec) => (
                    <div key={rec.id} className="p-4 rounded-2xl border border-border bg-card space-y-2">
                      {editingRecord?.id === rec.id ? (
                        <div className="space-y-3">
                          <div className="space-y-1.5">
                            <Label className="text-xs font-medium">Diagnosis</Label>
                            <Input value={editForm.diagnosis} onChange={(e) => setEditForm((f) => ({ ...f, diagnosis: e.target.value }))} className="rounded-xl h-9 text-sm" />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs font-medium">Prescription</Label>
                            <Textarea value={editForm.prescription} onChange={(e) => setEditForm((f) => ({ ...f, prescription: e.target.value }))} className="rounded-xl min-h-[60px] text-sm" />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs font-medium">Notes</Label>
                            <Textarea value={editForm.notes} onChange={(e) => setEditForm((f) => ({ ...f, notes: e.target.value }))} className="rounded-xl min-h-[40px] text-sm" />
                          </div>
                          <div className="flex gap-2 justify-end">
                            <Button size="sm" variant="outline" className="rounded-xl" onClick={() => setEditingRecord(null)}><X className="h-3.5 w-3.5 mr-1" /> Cancel</Button>
                            <Button size="sm" className="rounded-xl gradient-btn text-white border-0" onClick={handleUpdateRecord} disabled={saving}><Save className="h-3.5 w-3.5 mr-1" /> {saving ? "Saving..." : "Save"}</Button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="font-semibold text-foreground text-sm">{rec.diagnosis}</p>
                              <p className="text-xs text-muted-foreground mt-0.5">{rec.record_date && isValid(new Date(rec.record_date)) ? format(new Date(rec.record_date), "dd MMM yyyy, hh:mm a") : "N/A"}</p>
                            </div>
                            <div className="flex items-center gap-1.5">
                              {canEditRecord(rec) && (
                                <Button size="sm" variant="ghost" className="h-7 w-7 p-0 rounded-lg" onClick={() => startEditing(rec)}>
                                  <Edit className="h-3.5 w-3.5 text-muted-foreground" />
                                </Button>
                              )}
                              <Stethoscope className="h-4 w-4 text-secondary shrink-0" />
                            </div>
                          </div>
                          {rec.prescription && (
                            <div className="flex items-start gap-2 text-xs">
                              <Pill className="h-3.5 w-3.5 text-amber-500 mt-0.5 shrink-0" />
                              <span className="text-muted-foreground">{rec.prescription}</span>
                            </div>
                          )}
                          {rec.notes && <p className="text-xs text-muted-foreground italic">{rec.notes}</p>}
                        </>
                      )}
                    </div>
                  ))
                )}
              </TabsContent>

              {/* Lab Tab */}
              <TabsContent value="lab" className="space-y-3 mt-3">
                {labReports.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground text-sm">No lab reports found</div>
                ) : (
                  labReports.map((report) => (
                    <div key={report.id} className="p-4 rounded-2xl border border-border bg-card space-y-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-semibold text-foreground text-sm">{report.title}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{report.report_date && isValid(new Date(report.report_date)) ? format(new Date(report.report_date), "dd MMM yyyy") : "N/A"}</p>
                        </div>
                        <Badge variant="outline" className={`text-xs ${STATUS_COLORS[report.status] || ""}`}>{report.status}</Badge>
                      </div>
                      {report.result && <p className="text-xs text-muted-foreground">{report.result}</p>}
                      {report.file_url && (
                        <Button size="sm" variant="outline" className="rounded-xl text-xs" asChild>
                          <a href={report.file_url} target="_blank" rel="noopener noreferrer">
                            <FileText className="h-3 w-3 mr-1" /> View Report
                          </a>
                        </Button>
                      )}
                    </div>
                  ))
                )}
              </TabsContent>

              {/* Documents Tab */}
              <TabsContent value="documents" className="space-y-3 mt-3">
                {documents.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground text-sm">No documents uploaded</div>
                ) : (
                  documents.map((doc) => (
                    <div key={doc.id} className="p-4 rounded-2xl border border-border bg-card flex items-center justify-between">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent shrink-0">
                          <FileText className="h-4 w-4 text-accent-foreground" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-foreground text-sm truncate">{doc.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {doc.created_at && isValid(new Date(doc.created_at)) ? format(new Date(doc.created_at), "dd MMM yyyy") : "N/A"}
                            {doc.file_type && ` · ${doc.file_type}`}
                          </p>
                        </div>
                      </div>
                      <Button size="sm" variant="outline" className="rounded-xl text-xs shrink-0" asChild>
                        <a href={doc.file_url} target="_blank" rel="noopener noreferrer">View</a>
                      </Button>
                    </div>
                  ))
                )}
              </TabsContent>
            </>
          )}
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
