import { useState, useRef } from "react";

import { userService } from "@/api/userService";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UserPlus, Mail, Lock, Camera, Stethoscope, GraduationCap, Award, Clock, MapPin } from "lucide-react";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";

type AppRole = "admin" | "doctor" | "patient" | "pharmacist" | "nurse" | "lab_staff";

const ROLE_LABELS: Record<AppRole, string> = {
  admin: "Admin",
  doctor: "Doctor",
  nurse: "Nurse",
  patient: "Patient",
  pharmacist: "Pharmacist",
  lab_staff: "Laboratory Staff",
};

interface AddUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  defaultRole?: AppRole;
}

const initialForm = (role: AppRole) => ({
  email: "",
  password: "",
  full_name: "",
  role,
  phone: "",
  gender: "",
  specialization: "",
  degrees: "",
  education: "",
  experience_years: "",
  experience_details: "",
  address: "",
});

export function AddUserDialog({ open, onOpenChange, onSuccess, defaultRole }: AddUserDialogProps) {
  const [saving, setSaving] = useState(false);
  const effectiveRole = defaultRole || "patient";
  const [form, setForm] = useState(initialForm(effectiveRole));
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isDoctor = form.role === "doctor";

  const handleChange = (key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setAvatarPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const resetForm = () => {
    setForm(initialForm(effectiveRole));
    setAvatarFile(null);
    setAvatarPreview(null);
  };

  const initials = (name: string) =>
    name ? name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) : "U";

  const handleSubmit = async () => {
    if (!form.email.trim() || !form.password.trim()) {
      toast.error("Email and password are required");
      return;
    }
    if (form.password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setSaving(true);
    try {
      await userService.createUser({
        username: form.full_name.trim() || form.email.trim(),
        email: form.email.trim(),
        password: form.password,
        role: form.role,
      });

      toast.success(`${ROLE_LABELS[form.role]} "${form.full_name || form.email}" created successfully`);
      resetForm();
      onOpenChange(false);
      onSuccess();
    } catch (err: any) {
      toast.error(err?.response?.data || err.message || "Failed to create user");
    }
    setSaving(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) resetForm(); onOpenChange(v); }}>
      <DialogContent className="rounded-3xl max-w-lg p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle className="text-lg font-bold flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-secondary" />
            {isDoctor ? "Add New Doctor" : "Add New User"}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[65vh] px-6">
          <div className="space-y-4 pb-4">
            {/* Avatar Upload */}
            {isDoctor && (
              <div className="flex justify-center">
                <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                  <Avatar className="h-20 w-20 ring-4 ring-primary/10">
                    <AvatarImage src={avatarPreview || ""} />
                    <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white text-lg font-bold">
                      {initials(form.full_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Camera className="h-5 w-5 text-white" />
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarChange}
                  />
                </div>
              </div>
            )}

            {/* Basic Info */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Full Name</Label>
              <Input
                placeholder={isDoctor ? "Dr. John Doe" : "John Doe"}
                value={form.full_name}
                onChange={(e) => handleChange("full_name", e.target.value)}
                className="rounded-xl h-10"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Email *</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="email"
                  placeholder="user@hospital.com"
                  value={form.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  className="rounded-xl h-10 pl-10"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Password *</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="password"
                  placeholder="Min 6 characters"
                  value={form.password}
                  onChange={(e) => handleChange("password", e.target.value)}
                  className="rounded-xl h-10 pl-10"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Role *</Label>
              <Select value={form.role} onValueChange={(v) => handleChange("role", v)}>
                <SelectTrigger className="rounded-xl h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(ROLE_LABELS) as AppRole[]).map((r) => (
                    <SelectItem key={r} value={r}>{ROLE_LABELS[r]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Phone</Label>
                <Input
                  placeholder="+880 1XXXXXXX"
                  value={form.phone}
                  onChange={(e) => handleChange("phone", e.target.value)}
                  className="rounded-xl h-10"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Gender</Label>
                <Select value={form.gender} onValueChange={(v) => handleChange("gender", v)}>
                  <SelectTrigger className="rounded-xl h-10">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Doctor-specific fields */}
            {isDoctor && (
              <>
                <div className="border-t border-border/50 pt-4 mt-2">
                  <p className="text-xs font-semibold text-primary flex items-center gap-1.5 mb-3">
                    <Stethoscope className="h-3.5 w-3.5" />
                    Professional Information
                  </p>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Specialization</Label>
                  <div className="relative">
                    <Stethoscope className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="e.g. Cardiology, Pediatrics"
                      value={form.specialization}
                      onChange={(e) => handleChange("specialization", e.target.value)}
                      className="rounded-xl h-10 pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Degrees</Label>
                  <div className="relative">
                    <Award className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="e.g. MBBS, FCPS, MD"
                      value={form.degrees}
                      onChange={(e) => handleChange("degrees", e.target.value)}
                      className="rounded-xl h-10 pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Education</Label>
                  <div className="relative">
                    <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="e.g. Dhaka Medical College"
                      value={form.education}
                      onChange={(e) => handleChange("education", e.target.value)}
                      className="rounded-xl h-10 pl-10"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Experience (Years)</Label>
                    <div className="relative">
                      <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="number"
                        min="0"
                        placeholder="e.g. 5"
                        value={form.experience_years}
                        onChange={(e) => handleChange("experience_years", e.target.value)}
                        className="rounded-xl h-10 pl-10"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Address</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Clinic address"
                        value={form.address}
                        onChange={(e) => handleChange("address", e.target.value)}
                        className="rounded-xl h-10 pl-10"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Experience Details</Label>
                  <Textarea
                    placeholder="Previous hospitals, notable achievements..."
                    value={form.experience_details}
                    onChange={(e) => handleChange("experience_details", e.target.value)}
                    className="rounded-xl min-h-[70px] text-sm"
                  />
                </div>
              </>
            )}
          </div>
        </ScrollArea>

        <DialogFooter className="gap-2 px-6 pb-6 pt-2">
          <Button variant="outline" className="rounded-xl" onClick={() => { resetForm(); onOpenChange(false); }}>
            Cancel
          </Button>
          <Button
            className="rounded-xl gradient-btn text-white border-0"
            onClick={handleSubmit}
            disabled={saving}
          >
            {saving ? "Creating..." : isDoctor ? "Create Doctor" : "Create User"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
