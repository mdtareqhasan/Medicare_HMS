import { useState, useEffect } from "react";
import { userService } from "@/api/userService";
import { appointmentService } from "@/api/appointmentService";
import { toast } from "sonner";

import { useAuth } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Search, Users, User, Phone, Edit, Eye, Plus, Stethoscope, Trash2,
} from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { format } from "date-fns";
import { PatientRegistrationForm } from "@/components/patients/PatientRegistrationForm";
import { PatientDetailView } from "@/components/patients/PatientDetailView";

interface Profile {
  id: string;
  user_id: string;
  full_name: string | null;
  phone: string | null;
  gender: string | null;
  date_of_birth: string | null;
  address: string | null;
  avatar_url: string | null;
  age: number | null;
  blood_group: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  emergency_contact_relation: string | null;
  insurance_provider: string | null;
  insurance_policy_number: string | null;
  created_at: string;
}

interface DoctorInfo {
  name: string;
  specialization: string | null;
  avatar_url: string | null;
}

interface PatientWithDoctor extends Profile {
  doctorNames?: string[];
  doctorInfos?: DoctorInfo[];
}

export default function Patients() {
  const { user, role } = useAuth();
  const [patients, setPatients] = useState<PatientWithDoctor[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedPatient, setSelectedPatient] = useState<Profile | null>(null);
  const [editPatient, setEditPatient] = useState<Profile | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<PatientWithDoctor | null>(null);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await userService.deleteUser(Number(deleteTarget.user_id));
      toast.success(`Patient "${deleteTarget.full_name || "Unknown"}" deleted successfully`);
      setDeleteTarget(null);
      fetchPatients();
    } catch (err: any) {
      toast.error(err?.response?.data || err.message || "Failed to delete");
    }
    setDeleting(false);
  };

  useEffect(() => {
    fetchPatients();
  }, [user, role]);

  const fetchPatients = async () => {
    setLoading(true);
    try {
      const data = await userService.getPatients();
      const patientList: PatientWithDoctor[] = data.map((u) => ({
        id: u.id.toString(),
        user_id: u.id.toString(),
        full_name: u.username,
        phone: "",
        gender: "",
        date_of_birth: null,
        address: "",
        avatar_url: "",
        age: null,
        blood_group: null,
        emergency_contact_name: null,
        emergency_contact_phone: null,
        emergency_contact_relation: null,
        insurance_provider: null,
        insurance_policy_number: null,
        created_at: new Date().toISOString(),
        doctorNames: [],
        doctorInfos: [],
      }));

      // Get appointments to map assigned doctors
      let appointments = [] as any[];
      if (role === "admin" || role === "nurse") {
        appointments = await appointmentService.getAllAppointments();
      } else if (role === "doctor") {
        const doctorId = user?.id ? Number(user.id) : 0;
        if (doctorId) {
          appointments = await appointmentService.getDoctorSchedule(doctorId);
        }
      }

      const patientMap = patientList.reduce((acc, patient) => {
        acc[patient.user_id] = patient;
        return acc;
      }, {} as Record<string, PatientWithDoctor>);

      appointments.forEach((appt) => {
        const pid = appt.patientId?.toString() || appt.patient?.id?.toString();
        const did = appt.doctorId?.toString() || appt.doctor?.id?.toString();
        const doctorName = appt.doctorName || appt.doctor?.username || appt.doctor?.email || "Unknown";

        if (pid && patientMap[pid]) {
          const patient = patientMap[pid];
          if (!patient.doctorNames?.includes(doctorName)) {
            patient.doctorNames = [...(patient.doctorNames || []), doctorName];
          }
          if (!patient.doctorInfos?.some((d) => d.name === doctorName)) {
            patient.doctorInfos = [...(patient.doctorInfos || []), {
              name: doctorName,
              specialization: appt.doctor?.specialization || null,
              avatar_url: appt.doctor?.avatar_url || null,
            }];
          }
        }
      });

      let visiblePatients = patientList;
      if (role === "doctor") {
        const assignedIds = new Set(appointments.map((appt) => (appt.patientId?.toString() || appt.patient?.id?.toString())));
        visiblePatients = patientList.filter((patient) => assignedIds.has(patient.user_id));
      }

      setPatients(visiblePatients);
    } catch (error: any) {
      toast.error("Failed to load patients: " + (error?.message || "Unknown error"));
      setPatients([]);
    } finally {
      setLoading(false);
    }
  };

  const filtered = patients.filter((p) => {
    const q = search.toLowerCase();
    return (
      (p.full_name || "").toLowerCase().includes(q) ||
      (p.phone || "").includes(q) ||
      (p.address || "").toLowerCase().includes(q) ||
      (p.insurance_provider || "").toLowerCase().includes(q) ||
      (p.doctorNames || []).some((d) => d.toLowerCase().includes(q))
    );
  });

  if (role !== "admin" && role !== "doctor" && role !== "nurse") {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        You don't have permission to view this page.
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 animate-fade-in-up">
        <div>
          <h1 className="text-xl md:text-2xl font-extrabold text-foreground tracking-tight">Patient Management</h1>
          <p className="text-xs md:text-sm text-muted-foreground mt-1">
            {role === "doctor"
              ? "Your patients list"
              : "View, register, and manage patient records"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {(role === "admin" || role === "doctor") && (
            <Button
              className="rounded-xl gradient-btn text-white border-0 h-9 md:h-10 px-4 text-xs md:text-sm font-semibold"
              onClick={() => { setEditPatient(null); setShowEdit(true); }}
            >
              <Plus className="h-4 w-4 mr-1.5" />
              Add Patient
            </Button>
          )}
          <Badge variant="secondary" className="text-sm px-3 py-1.5 hidden sm:flex">
            <Users className="h-3.5 w-3.5 mr-1.5" />
            {patients.length} Patients
          </Badge>
        </div>
      </div>

      {/* Search */}
      <div className="dashboard-card p-4 animate-fade-in-up" style={{ animationDelay: "100ms" }}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={role === "admin" ? "Search by name, phone, doctor..." : "Search patients by name, phone, address..."}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 h-11 rounded-xl border-border"
          />
        </div>
      </div>

      {/* Table */}
      <div className="dashboard-card overflow-hidden animate-fade-in-up" style={{ animationDelay: "200ms" }}>
        {loading ? (
          <div className="p-8 space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-12 rounded-xl skeleton-shimmer" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <Users className="h-12 w-12 mb-3 opacity-30" />
            <p className="font-medium">No patients found</p>
            <p className="text-sm mt-1">
              {search
                ? "Try adjusting your search"
                : role === "doctor"
                ? "No patients assigned yet"
                : "No patients registered yet"}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="font-bold">Patient</TableHead>
                  <TableHead className="font-bold">Age / Gender</TableHead>
                  <TableHead className="font-bold">Phone</TableHead>
                  {(role === "admin" || role === "nurse") && (
                    <TableHead className="font-bold">Assigned Doctor</TableHead>
                  )}
                  <TableHead className="font-bold text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((patient) => (
                  <TableRow key={patient.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9 shrink-0">
                          {patient.avatar_url && <AvatarImage src={patient.avatar_url} alt={patient.full_name || ""} />}
                          <AvatarFallback className="bg-secondary/10 text-secondary text-xs font-semibold">
                            {patient.full_name ? patient.full_name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) : "?"}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <span className="font-semibold text-foreground block">
                            {patient.full_name || "Unnamed"}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {patient.date_of_birth
                              ? format(new Date(patient.date_of_birth), "dd MMM yyyy")
                              : "No DOB"}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        {patient.age && (
                          <Badge variant="outline" className="text-xs">{patient.age}y</Badge>
                        )}
                        <Badge variant="outline" className="capitalize text-xs">
                          {patient.gender || "N/A"}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {patient.phone || "—"}
                    </TableCell>
                    {(role === "admin" || role === "nurse") && (
                      <TableCell>
                        {patient.doctorInfos && patient.doctorInfos.length > 0 ? (
                          <div className="flex flex-col gap-1.5">
                            {patient.doctorInfos.map((doc, i) => {
                              const docInitials = doc.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
                              return (
                                <div key={i} className="flex items-center gap-2">
                                  <Avatar className="h-7 w-7 shrink-0 ring-1 ring-primary/10">
                                    <AvatarImage src={doc.avatar_url || ""} />
                                    <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white text-[9px] font-bold">
                                      {docInitials}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="min-w-0">
                                    <p className="text-xs font-semibold text-foreground truncate leading-tight">{doc.name}</p>
                                    {doc.specialization && (
                                      <p className="text-[10px] text-primary leading-tight">{doc.specialization}</p>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                    )}
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          size="sm"
                          variant="outline"
                          className="rounded-xl"
                          onClick={() => { setSelectedPatient(patient); setShowDetail(true); }}
                        >
                          <Eye className="h-3.5 w-3.5 mr-1" />
                          View
                        </Button>
                        {(role === "admin" || role === "doctor") && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="rounded-xl"
                            onClick={() => { setEditPatient(patient); setShowEdit(true); }}
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                        )}
                        {(role === "admin" || role === "doctor") && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="rounded-xl text-destructive hover:bg-destructive/10"
                            onClick={(e) => { e.stopPropagation(); setDeleteTarget(patient); }}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Detail View */}
      <PatientDetailView
        patient={selectedPatient}
        open={showDetail}
        onOpenChange={setShowDetail}
      />

      {/* Edit Form */}
      <PatientRegistrationForm
        open={showEdit}
        onOpenChange={setShowEdit}
        onSuccess={fetchPatients}
        editPatient={editPatient}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(v) => { if (!v) setDeleteTarget(null); }}>
        <AlertDialogContent className="rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Patient?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{deleteTarget?.full_name || "this patient"}</strong>? This will permanently remove their account and all associated data. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
