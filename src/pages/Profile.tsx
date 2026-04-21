import { useState, useEffect } from "react";

import { useAuth } from "@/contexts/AuthContext";
import { profileService } from "@/api/profileService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  User, Mail, Phone, MapPin, Calendar, Heart, Shield,
  Save, Loader2, Droplets, UserCheck, GraduationCap, Briefcase, Award, Camera,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface ProfileData {
  id?: number;
  userId?: number;
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
  gender?: "male" | "female" | "other" | null;
  dateOfBirth?: string | null;
  address?: string | null;
  bloodGroup?: string | null;
  emergencyName?: string | null;
  emergencyPhone?: string | null;
  emergencyRelation?: string | null;
  avatarUrl?: string | null;
  createdAt?: string | null;
}

const roleLabels: Record<string, string> = {
  admin: "System Administrator",
  doctor: "Senior Cardiologist",
  patient: "Patient",
  pharmacist: "Pharmacist",
  nurse: "Head Nurse",
  lab_staff: "Lab Technician",
};

export default function Profile() {
  const { user, role, signOut } = useAuth();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // Editable fields
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [gender, setGender] = useState<"male" | "female" | "other" | "">("");
  const [dob, setDob] = useState("");
  const [address, setAddress] = useState("");
  const [bloodGroup, setBloodGroup] = useState("");
  const [emergencyName, setEmergencyName] = useState("");
  const [emergencyPhone, setEmergencyPhone] = useState("");
  const [emergencyRelation, setEmergencyRelation] = useState("");
  const [insuranceProvider, setInsuranceProvider] = useState("");
  const [insurancePolicyNumber, setInsurancePolicyNumber] = useState("");
  const [specialization, setSpecialization] = useState("");
  const [degrees, setDegrees] = useState("");
  const [education, setEducation] = useState("");
  const [experienceYears, setExperienceYears] = useState("");
  const [experienceDetails, setExperienceDetails] = useState("");

  useEffect(() => {
    fetchProfile();
  }, [user]);

  const fetchProfile = async () => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const data = await profileService.getProfile();
      const profileData = data || {};

      setProfile(profileData);
      populateFields(profileData);
    } catch (fetchError: any) {
      console.error("Profile fetch execution error", fetchError);
      if (fetchError?.response?.status === 401) {
        toast.error("Session expired. Please login again.");
        signOut();
        return;
      }
      toast.error("Failed to load profile");
      setProfile(null);
      setFirstName(user?.email?.split("@")[0] || "");
    } finally {
      setLoading(false);
    }
  };

  const populateFields = (p: ProfileData) => {
    setFirstName(p.firstName || "");
    setLastName(p.lastName || "");
    setPhone(p.phone || "");
    setGender(p.gender || "");
    setDob(p.dateOfBirth || "");
    setAddress(p.address || "");
    setBloodGroup(p.bloodGroup || "");
    setEmergencyName(p.emergencyName || "");
    setEmergencyPhone(p.emergencyPhone || "");
    setEmergencyRelation(p.emergencyRelation || "");
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);

    try {
      await profileService.updateProfile({
        firstName: firstName || null,
        lastName: lastName || null,
        phone: phone || null,
        gender: gender || null,
        address: address || null,
        dateOfBirth: dob || null,
        bloodGroup: bloodGroup || null,
        emergencyName: emergencyName || null,
        emergencyPhone: emergencyPhone || null,
        emergencyRelation: emergencyRelation || null,
        avatarUrl: profile?.avatarUrl || null,
      });

      toast.success("Profile saved successfully!");
      setEditing(false);
      // Immediately recheck auth if profile API returns 401 or requires refresh state
      setTimeout(fetchProfile, 1000);
    } catch (err: any) {
      console.error("Profile save failed", err);
      if (err?.response?.status === 401) {
        toast.error("Session expired. Please login again.");
        signOut();
      } else {
        toast.error(err?.response?.data?.error || err.message || "Failed to save profile");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error("File size must be under 2MB");
      return;
    }
    setUploadingAvatar(true);
    try {
      const result = await profileService.uploadAvatar(file);
      const avatarUrl = result.avatarUrl;
      setProfile((prev) => ({ ...prev, avatarUrl } as ProfileData));
      toast.success("Photo uploaded successfully!");
      fetchProfile();
    } catch (err: any) {
      toast.error(err.message || "Failed to upload photo");
    }
    setUploadingAvatar(false);
  };

  const handleCancel = () => {
    if (profile) populateFields(profile);
    setEditing(false);
  };

  const displayName = `${firstName || ""} ${lastName || ""}`.trim() || user?.email?.split("@")[0] || "User";
  const initials = displayName
    ? displayName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : user?.email?.charAt(0).toUpperCase() || "U";

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-48 rounded-2xl skeleton-shimmer" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => <div key={i} className="h-20 rounded-xl skeleton-shimmer" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Profile Header */}
      <div className="dashboard-card p-6 md:p-8 animate-fade-in-up">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
          <div className="relative group shrink-0">
            <Avatar className="h-20 w-20 sm:h-24 sm:w-24 ring-4 ring-primary/10">
              {profile?.avatarUrl ? (
                <img src={profile.avatarUrl} alt="Avatar" className="h-full w-full object-cover rounded-full" />
              ) : (
                <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white text-2xl sm:text-3xl font-bold">
                  {initials}
                </AvatarFallback>
              )}
            </Avatar>
            <label className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
              {uploadingAvatar ? (
                <Loader2 className="h-5 w-5 text-white animate-spin" />
              ) : (
                <Camera className="h-5 w-5 text-white" />
              )}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarUpload}
                disabled={uploadingAvatar}
              />
            </label>
          </div>
          <div className="flex-1 text-center sm:text-left">
            <h1 className="text-xl md:text-2xl font-extrabold text-foreground">
              {displayName}
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">{user?.email}</p>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-3">
              <Badge className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white border-0 capitalize">
                {roleLabels[role || ""] || role || "User"}
              </Badge>
              {profile?.gender && (
                <Badge variant="outline" className="capitalize">{profile.gender}</Badge>
              )}
              {profile?.bloodGroup && (
                <Badge variant="outline" className="text-destructive border-destructive/30">
                  <Droplets className="h-3 w-3 mr-1" />
                  {profile.bloodGroup}
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Member since {profile?.createdAt ? format(new Date(profile.createdAt), "dd MMM yyyy") : "—"}
            </p>
          </div>
          <div className="shrink-0">
            {!editing ? (
              <Button onClick={() => setEditing(true)} variant="outline" className="rounded-xl gap-2">
                <UserCheck className="h-4 w-4" /> Edit Profile
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button onClick={handleCancel} variant="outline" className="rounded-xl text-sm">Cancel</Button>
                <Button
                  onClick={handleSave}
                  disabled={saving}
                  className="rounded-xl gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white border-0"
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Save
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Personal Information */}
      <div className="dashboard-card p-6 animate-fade-in-up" style={{ animationDelay: "100ms" }}>
        <h2 className="text-sm font-bold text-foreground mb-5 flex items-center gap-2">
          <User className="h-4 w-4 text-primary" />
          Personal Information
        </h2>
        {!profile && (
          <div className="mb-4 p-3 rounded-lg border border-yellow-300 bg-yellow-50 text-yellow-900">
            <p className="text-xs">
              Debug: profile row not found. Auth user id: {user?.id || "N/A"}, role: {role || "N/A"}.
            </p>
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
              <User className="h-3 w-3" /> First Name
            </Label>
            {editing ? (
              <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} className="rounded-xl" />
            ) : (
              <p className="text-sm font-medium text-foreground py-2">{firstName || "—"}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
              <User className="h-3 w-3" /> Last Name
            </Label>
            {editing ? (
              <Input value={lastName} onChange={(e) => setLastName(e.target.value)} className="rounded-xl" />
            ) : (
              <p className="text-sm font-medium text-foreground py-2">{lastName || "—"}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
              <Mail className="h-3 w-3" /> Email
            </Label>
            <p className="text-sm font-medium text-foreground py-2">{user?.email || "—"}</p>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
              <Phone className="h-3 w-3" /> Phone
            </Label>
            {editing ? (
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} className="rounded-xl" placeholder="+880..." />
            ) : (
              <p className="text-sm font-medium text-foreground py-2">{phone || "—"}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
              <User className="h-3 w-3" /> Gender
            </Label>
            {editing ? (
              <Select value={gender} onValueChange={setGender}>
                <SelectTrigger className="rounded-xl"><SelectValue placeholder="Select gender" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <p className="text-sm font-medium text-foreground py-2 capitalize">{gender || "—"}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
              <Calendar className="h-3 w-3" /> Date of Birth
            </Label>
            {editing ? (
              <Input type="date" value={dob} onChange={(e) => setDob(e.target.value)} className="rounded-xl" />
            ) : (
              <p className="text-sm font-medium text-foreground py-2">
                {dob ? format(new Date(dob), "dd MMM yyyy") : "—"}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
              <Droplets className="h-3 w-3" /> Blood Group
            </Label>
            {editing ? (
              <Select value={bloodGroup} onValueChange={setBloodGroup}>
                <SelectTrigger className="rounded-xl"><SelectValue placeholder="Select blood group" /></SelectTrigger>
                <SelectContent>
                  {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((bg) => (
                    <SelectItem key={bg} value={bg}>{bg}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <p className="text-sm font-medium text-foreground py-2">{bloodGroup || "—"}</p>
            )}
          </div>

          <div className="space-y-1.5 md:col-span-2">
            <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
              <MapPin className="h-3 w-3" /> Address
            </Label>
            {editing ? (
              <Textarea value={address} onChange={(e) => setAddress(e.target.value)} className="rounded-xl" rows={2} />
            ) : (
              <p className="text-sm font-medium text-foreground py-2">{address || "—"}</p>
            )}
          </div>
        </div>
      </div>


      {/* Doctor Professional Info */}
      {role === "doctor" && (
        <div className="dashboard-card p-6 animate-fade-in-up" style={{ animationDelay: "150ms" }}>
          <h2 className="text-sm font-bold text-foreground mb-5 flex items-center gap-2">
            <GraduationCap className="h-4 w-4 text-primary" />
            Professional Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
                <Award className="h-3 w-3" /> Specialization
              </Label>
              {editing ? (
                <Input value={specialization} onChange={(e) => setSpecialization(e.target.value)} className="rounded-xl" placeholder="e.g. Cardiology" />
              ) : (
                <p className="text-sm font-medium text-foreground py-2">{specialization || "—"}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
                <Briefcase className="h-3 w-3" /> Experience (Years)
              </Label>
              {editing ? (
                <Input type="number" value={experienceYears} onChange={(e) => setExperienceYears(e.target.value)} className="rounded-xl" placeholder="e.g. 10" />
              ) : (
                <p className="text-sm font-medium text-foreground py-2">{experienceYears ? `${experienceYears} years` : "—"}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
                <GraduationCap className="h-3 w-3" /> Degrees
              </Label>
              {editing ? (
                <Input value={degrees} onChange={(e) => setDegrees(e.target.value)} className="rounded-xl" placeholder="e.g. MBBS, FCPS (Medicine)" />
              ) : (
                <p className="text-sm font-medium text-foreground py-2">{degrees || "—"}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
                <GraduationCap className="h-3 w-3" /> Education
              </Label>
              {editing ? (
                <Input value={education} onChange={(e) => setEducation(e.target.value)} className="rounded-xl" placeholder="e.g. Dhaka Medical College" />
              ) : (
                <p className="text-sm font-medium text-foreground py-2">{education || "—"}</p>
              )}
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
                <Briefcase className="h-3 w-3" /> Experience Details
              </Label>
              {editing ? (
                <Textarea value={experienceDetails} onChange={(e) => setExperienceDetails(e.target.value)} className="rounded-xl" rows={3} placeholder="Previous hospitals, positions, achievements..." />
              ) : (
                <p className="text-sm font-medium text-foreground py-2 whitespace-pre-line">{experienceDetails || "—"}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Emergency Contact */}
      <div className="dashboard-card p-6 animate-fade-in-up" style={{ animationDelay: "200ms" }}>
        <h2 className="text-sm font-bold text-foreground mb-5 flex items-center gap-2">
          <Heart className="h-4 w-4 text-destructive" />
          Emergency Contact
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Contact Name</Label>
            {editing ? (
              <Input value={emergencyName} onChange={(e) => setEmergencyName(e.target.value)} className="rounded-xl" />
            ) : (
              <p className="text-sm font-medium text-foreground py-2">{emergencyName || "—"}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Contact Phone</Label>
            {editing ? (
              <Input value={emergencyPhone} onChange={(e) => setEmergencyPhone(e.target.value)} className="rounded-xl" />
            ) : (
              <p className="text-sm font-medium text-foreground py-2">{emergencyPhone || "—"}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Relation</Label>
            {editing ? (
              <Input value={emergencyRelation} onChange={(e) => setEmergencyRelation(e.target.value)} className="rounded-xl" placeholder="e.g. Spouse, Parent" />
            ) : (
              <p className="text-sm font-medium text-foreground py-2">{emergencyRelation || "—"}</p>
            )}
          </div>
        </div>
      </div>

      {/* Insurance */}
      <div className="dashboard-card p-6 animate-fade-in-up" style={{ animationDelay: "300ms" }}>
        <h2 className="text-sm font-bold text-foreground mb-5 flex items-center gap-2">
          <Shield className="h-4 w-4 text-primary" />
          Insurance Information
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Insurance Provider</Label>
            {editing ? (
              <Input value={insuranceProvider} onChange={(e) => setInsuranceProvider(e.target.value)} className="rounded-xl" />
            ) : (
              <p className="text-sm font-medium text-foreground py-2">{insuranceProvider || "—"}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Policy Number</Label>
            {editing ? (
              <Input value={insurancePolicyNumber} onChange={(e) => setInsurancePolicyNumber(e.target.value)} className="rounded-xl" />
            ) : (
              <p className="text-sm font-medium text-foreground py-2">{insurancePolicyNumber || "—"}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}