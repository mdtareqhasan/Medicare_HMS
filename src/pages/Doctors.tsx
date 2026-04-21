import { useState, useEffect } from "react";
import { userService } from "@/api/userService";

import { useAuth } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Search, Stethoscope, Phone, MapPin, GraduationCap, Clock,
  CalendarCheck, Users, Award, Mail, Plus, Trash2,
} from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { format } from "date-fns";
import { toast } from "sonner";
import { AddUserDialog } from "@/components/users/AddUserDialog";

interface DoctorProfile {
  id: string;
  user_id: string;
  full_name: string | null;
  phone: string | null;
  gender: string | null;
  avatar_url: string | null;
  specialization: string | null;
  degrees: string | null;
  education: string | null;
  experience_years: number | null;
  experience_details: string | null;
  address: string | null;
  created_at: string;
  email?: string;
  patientCount?: number;
  appointmentCount?: number;
}

export default function Doctors() {
  const { role } = useAuth();
  const [doctors, setDoctors] = useState<DoctorProfile[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedDoctor, setSelectedDoctor] = useState<DoctorProfile | null>(null);
  const [addDoctorOpen, setAddDoctorOpen] = useState(false);
  // ...existing code...

  useEffect(() => {
    fetchDoctors();
  }, []);

  const fetchDoctors = async () => {
    setLoading(true);
    try {
      const data = await userService.getDoctors();
      const doctorList: DoctorProfile[] = data.map((u) => ({
        id: u.id.toString(),
        user_id: u.id.toString(),
        full_name: u.username,
        phone: "",
        gender: "",
        avatar_url: "",
        specialization: null,
        degrees: null,
        education: null,
        experience_years: null,
        experience_details: null,
        address: "",
        created_at: new Date().toISOString(),
        email: u.email,
        patientCount: 0,
        appointmentCount: 0,
      }));
      setDoctors(doctorList);
    } catch (error: any) {
      toast.error("Failed to load doctors: " + (error?.message || "Unknown error"));
      setDoctors([]);
    } finally {
      setLoading(false);
    }
  };

  const filtered = doctors.filter((d) => {
    const q = search.toLowerCase();
    return (
      (d.full_name || "").toLowerCase().includes(q) ||
      (d.specialization || "").toLowerCase().includes(q) ||
      (d.phone || "").includes(q)
    );
  });

  const initials = (name: string | null) =>
    name ? name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) : "DR";

  return (
    <div className="space-y-4 md:space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between animate-fade-in-up">
        <div>
          <h1 className="text-xl md:text-2xl font-extrabold text-foreground tracking-tight">Doctors</h1>
          <p className="text-xs md:text-sm text-muted-foreground mt-1">View doctor profiles, specializations & availability</p>
        </div>
        <div className="flex items-center gap-2">
          {(role === "admin" || role === "nurse") && (
            <Button onClick={() => setAddDoctorOpen(true)} className="rounded-xl gradient-btn text-white border-0 gap-1.5">
              <Plus className="h-4 w-4" />
              Add Doctor
            </Button>
          )}
          <Badge variant="secondary" className="text-sm px-3 py-1.5">
            <Stethoscope className="h-3.5 w-3.5 mr-1.5" />
            {doctors.length} Doctors
          </Badge>
        </div>
      </div>

      {/* Search */}
      <div className="dashboard-card p-4 animate-fade-in-up" style={{ animationDelay: "100ms" }}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, specialization..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 h-11 rounded-xl"
          />
        </div>
      </div>

      {/* Doctor Cards Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-48 rounded-2xl skeleton-shimmer" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="dashboard-card flex flex-col items-center justify-center py-16 text-muted-foreground">
          <Stethoscope className="h-12 w-12 mb-3 opacity-30" />
          <p className="font-medium">No doctors found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
          {filtered.map((doc, idx) => (
            <div
              key={doc.id}
              className="dashboard-card p-5 hover-lift cursor-pointer animate-fade-in-up group"
              style={{ animationDelay: `${(idx + 1) * 80}ms` }}
              onClick={() => setSelectedDoctor(doc)}
            >
              <div className="flex items-start gap-3.5">
                <Avatar className="h-12 w-12 ring-2 ring-primary/10 shrink-0">
                  <AvatarImage src={doc.avatar_url || ""} alt={doc.full_name || ""} />
                  <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white text-sm font-bold">
                    {initials(doc.full_name)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-foreground text-sm group-hover:text-primary transition-colors truncate">
                    Dr. {doc.full_name || "Unknown"}
                  </p>
                  {doc.specialization && (
                    <p className="text-xs text-primary font-medium mt-0.5">{doc.specialization}</p>
                  )}
                  {doc.degrees && (
                    <p className="text-[10px] text-muted-foreground mt-0.5 truncate">{doc.degrees}</p>
                  )}
                </div>
                {/* Delete button for admin removed */}
              </div>

              <div className="flex items-center gap-3 mt-4 pt-3 border-t border-border/30">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Users className="h-3.5 w-3.5 text-secondary" />
                  <span className="font-medium">{doc.patientCount || 0}</span> patients
                </div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <CalendarCheck className="h-3.5 w-3.5 text-primary" />
                  <span className="font-medium">{doc.appointmentCount || 0}</span> appts
                </div>
                {doc.experience_years && (
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground ml-auto">
                    <Clock className="h-3.5 w-3.5" />
                    {doc.experience_years}y exp
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Doctor Detail Dialog */}
      <Dialog open={!!selectedDoctor} onOpenChange={() => setSelectedDoctor(null)}>
        <DialogContent className="rounded-3xl max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Doctor Profile</DialogTitle>
          </DialogHeader>
          {selectedDoctor && (
            <div className="space-y-5">
              {/* Profile Header */}
              <div className="flex items-start gap-4 p-4 rounded-2xl bg-gradient-to-r from-emerald-500/10 to-teal-500/10">
                <Avatar className="h-16 w-16 ring-4 ring-primary/10 shrink-0">
                  <AvatarImage src={selectedDoctor.avatar_url || ""} />
                  <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white text-lg font-bold">
                    {initials(selectedDoctor.full_name)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <h3 className="text-xl font-extrabold text-foreground">Dr. {selectedDoctor.full_name || "Unknown"}</h3>
                  {selectedDoctor.specialization && (
                    <Badge className="mt-1.5 bg-primary/10 text-primary border-0 text-xs">
                      {selectedDoctor.specialization}
                    </Badge>
                  )}
                  {selectedDoctor.degrees && (
                    <p className="text-xs text-muted-foreground mt-1">{selectedDoctor.degrees}</p>
                  )}
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center p-3 rounded-xl bg-secondary/5 border border-secondary/10">
                  <p className="text-xl font-extrabold text-secondary">{selectedDoctor.patientCount || 0}</p>
                  <p className="text-[10px] text-muted-foreground font-medium">Patients</p>
                </div>
                <div className="text-center p-3 rounded-xl bg-primary/5 border border-primary/10">
                  <p className="text-xl font-extrabold text-primary">{selectedDoctor.appointmentCount || 0}</p>
                  <p className="text-[10px] text-muted-foreground font-medium">Appointments</p>
                </div>
                <div className="text-center p-3 rounded-xl bg-amber-500/5 border border-amber-500/10">
                  <p className="text-xl font-extrabold text-amber-600">{selectedDoctor.experience_years || "—"}</p>
                  <p className="text-[10px] text-muted-foreground font-medium">Years Exp</p>
                </div>
              </div>

              {/* Details */}
              <div className="space-y-2.5">
                {selectedDoctor.email && (
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/30">
                    <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="text-sm text-foreground">{selectedDoctor.email}</span>
                  </div>
                )}
                {role !== "patient" && selectedDoctor.phone && (
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/30">
                    <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="text-sm text-foreground">{selectedDoctor.phone}</span>
                  </div>
                )}                {role !== "patient" && selectedDoctor.address && (
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/30">
                    <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="text-sm text-foreground">{selectedDoctor.address}</span>
                  </div>
                )}
                {selectedDoctor.education && (
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/30">
                    <GraduationCap className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="text-sm text-foreground">{selectedDoctor.education}</span>
                  </div>
                )}
                {selectedDoctor.degrees && (
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/30">
                    <Award className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="text-sm text-foreground">{selectedDoctor.degrees}</span>
                  </div>
                )}
                {selectedDoctor.experience_details && (
                  <div className="flex items-start gap-3 p-3 rounded-xl bg-muted/30">
                    <Clock className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                    <span className="text-sm text-foreground">{selectedDoctor.experience_details}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Doctor Dialog */}
      <AddUserDialog open={addDoctorOpen} onOpenChange={setAddDoctorOpen} onSuccess={fetchDoctors} defaultRole="doctor" />

      {/* Delete confirmation dialog removed */}
    </div>
  );
}
