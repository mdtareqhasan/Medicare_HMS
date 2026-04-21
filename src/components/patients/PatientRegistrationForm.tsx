import { useState, useEffect } from "react";
import { authService } from "@/api/authService";
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
import { User, Phone, MapPin, Heart, Shield } from "lucide-react";
import { toast } from "sonner";

interface PatientRegistrationFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  editPatient?: any;
}

export function PatientRegistrationForm({ open, onOpenChange, onSuccess, editPatient }: PatientRegistrationFormProps) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    full_name: "",
    age: "",
    gender: "",
    phone: "",
    address: "",
    date_of_birth: "",
    blood_group: "",
    emergency_contact_name: "",
    emergency_contact_phone: "",
    emergency_contact_relation: "",
    insurance_provider: "",
    insurance_policy_number: "",
    email: "",
    password: "",
  });

  useEffect(() => {
    if (editPatient) {
      setForm({
        full_name: editPatient.full_name || "",
        age: editPatient.age?.toString() || "",
        gender: editPatient.gender || "",
        phone: editPatient.phone || "",
        address: editPatient.address || "",
        date_of_birth: editPatient.date_of_birth || "",
        blood_group: editPatient.blood_group || "",
        emergency_contact_name: editPatient.emergency_contact_name || "",
        emergency_contact_phone: editPatient.emergency_contact_phone || "",
        emergency_contact_relation: editPatient.emergency_contact_relation || "",
        insurance_provider: editPatient.insurance_provider || "",
        insurance_policy_number: editPatient.insurance_policy_number || "",
        email: "",
        password: "",
      });
    } else {
      setForm({
        full_name: "", age: "", gender: "", phone: "", address: "",
        date_of_birth: "", blood_group: "", emergency_contact_name: "",
        emergency_contact_phone: "", emergency_contact_relation: "",
        insurance_provider: "", insurance_policy_number: "", email: "", password: "",
      });
    }
  }, [editPatient, open]);

  const handleChange = (key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async () => {
    if (!form.full_name.trim()) {
      toast.error("Patient name is required");
      return;
    }
    setSaving(true);

    const updateData = {
      full_name: form.full_name.trim(),
      age: form.age ? parseInt(form.age) : null,
      gender: form.gender || null,
      phone: form.phone || null,
      address: form.address || null,
      date_of_birth: form.date_of_birth || null,
      blood_group: form.blood_group || null,
      emergency_contact_name: form.emergency_contact_name || null,
      emergency_contact_phone: form.emergency_contact_phone || null,
      emergency_contact_relation: form.emergency_contact_relation || null,
      insurance_provider: form.insurance_provider || null,
      insurance_policy_number: form.insurance_policy_number || null,
    };

    if (editPatient?.user_id) {
      try {
        await userService.updateProfile(Number(editPatient.user_id), updateData);
        toast.success("Patient updated successfully");
        onSuccess();
        onOpenChange(false);
      } catch (err: any) {
        toast.error("Failed to update: " + (err?.message || "Unknown error"));
      }
    } else {
      // Create new patient via backend API
      if (!form.email.trim() || !form.password.trim()) {
        toast.error("Email and password required for new patient");
        setSaving(false);
        return;
      }
      try {
        await authService.register({
          username: form.full_name.trim() || form.email.trim(),
          email: form.email.trim(),
          password: form.password,
        });

        toast.success("Patient registered successfully");
        onSuccess();
        onOpenChange(false);
      } catch (err: any) {
        toast.error(err?.response?.data || err.message || "Failed to create patient");
      }
    }
    setSaving(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-3xl max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold flex items-center gap-2">
            <User className="h-5 w-5 text-secondary" />
            {editPatient ? "Edit Patient" : "Register Patient"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 pt-2">
          {/* Account Info - only for new patients */}
          {!editPatient && (
            <div>
              <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
                <Shield className="h-4 w-4 text-primary" />
                Account Credentials
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Email *</Label>
                  <Input
                    type="email"
                    placeholder="patient@email.com"
                    value={form.email}
                    onChange={(e) => handleChange("email", e.target.value)}
                    className="rounded-xl h-10"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Password *</Label>
                  <Input
                    type="password"
                    placeholder="Min 6 characters"
                    value={form.password}
                    onChange={(e) => handleChange("password", e.target.value)}
                    className="rounded-xl h-10"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Personal Info */}
          <div>
            <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
              <User className="h-4 w-4 text-secondary" />
              Personal Information
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Full Name *</Label>
                <Input
                  placeholder="John Doe"
                  value={form.full_name}
                  onChange={(e) => handleChange("full_name", e.target.value)}
                  className="rounded-xl h-10"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Age</Label>
                <Input
                  type="number"
                  placeholder="25"
                  value={form.age}
                  onChange={(e) => handleChange("age", e.target.value)}
                  className="rounded-xl h-10"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Gender</Label>
                <Select value={form.gender} onValueChange={(v) => handleChange("gender", v)}>
                  <SelectTrigger className="rounded-xl h-10">
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Date of Birth</Label>
                <Input
                  type="date"
                  value={form.date_of_birth}
                  onChange={(e) => handleChange("date_of_birth", e.target.value)}
                  className="rounded-xl h-10"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Blood Group</Label>
                <Select value={form.blood_group} onValueChange={(v) => handleChange("blood_group", v)}>
                  <SelectTrigger className="rounded-xl h-10">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((bg) => (
                      <SelectItem key={bg} value={bg}>{bg}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Phone</Label>
                <Input
                  placeholder="+880 1XXXXXXXXX"
                  value={form.phone}
                  onChange={(e) => handleChange("phone", e.target.value)}
                  className="rounded-xl h-10"
                />
              </div>
            </div>
            <div className="mt-3 space-y-1.5">
              <Label className="text-xs font-medium">Address</Label>
              <Textarea
                placeholder="Full address..."
                value={form.address}
                onChange={(e) => handleChange("address", e.target.value)}
                className="rounded-xl min-h-[60px]"
              />
            </div>
          </div>

          {/* Emergency Contact */}
          <div>
            <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
              <Heart className="h-4 w-4 text-destructive" />
              Emergency Contact
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Name</Label>
                <Input
                  placeholder="Contact name"
                  value={form.emergency_contact_name}
                  onChange={(e) => handleChange("emergency_contact_name", e.target.value)}
                  className="rounded-xl h-10"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Phone</Label>
                <Input
                  placeholder="Phone number"
                  value={form.emergency_contact_phone}
                  onChange={(e) => handleChange("emergency_contact_phone", e.target.value)}
                  className="rounded-xl h-10"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Relation</Label>
                <Input
                  placeholder="e.g. Spouse, Parent"
                  value={form.emergency_contact_relation}
                  onChange={(e) => handleChange("emergency_contact_relation", e.target.value)}
                  className="rounded-xl h-10"
                />
              </div>
            </div>
          </div>

          {/* Insurance */}
          <div>
            <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
              <Shield className="h-4 w-4 text-blue-500" />
              Insurance Details
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Insurance Provider</Label>
                <Input
                  placeholder="Provider name"
                  value={form.insurance_provider}
                  onChange={(e) => handleChange("insurance_provider", e.target.value)}
                  className="rounded-xl h-10"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Policy Number</Label>
                <Input
                  placeholder="Policy #"
                  value={form.insurance_policy_number}
                  onChange={(e) => handleChange("insurance_policy_number", e.target.value)}
                  className="rounded-xl h-10"
                />
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 mt-4">
          <Button variant="outline" className="rounded-xl" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            className="rounded-xl gradient-btn text-white border-0"
            onClick={handleSubmit}
            disabled={saving}
          >
            {saving ? "Saving..." : editPatient ? "Update Patient" : "Register"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
