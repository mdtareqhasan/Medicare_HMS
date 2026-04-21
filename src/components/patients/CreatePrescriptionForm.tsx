import { useState } from "react";

import { useAuth } from "@/contexts/AuthContext";
import { prescriptionService } from "@/api/prescriptionService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Pill, FlaskConical, Save, X } from "lucide-react";
import { toast } from "sonner";

interface MedicineRow {
  name: string;
  dosage: string;
  duration: string;
  instructions: string;
}

const LAB_TEST_OPTIONS = [
  "CBC (Complete Blood Count)", "Blood Group", "Blood Sugar (Fasting)", "Blood Sugar (PP)",
  "HbA1c", "Lipid Profile", "Liver Function Test", "Kidney Function Test",
  "Thyroid Profile (T3, T4, TSH)", "Urine R/E", "ECG", "X-Ray Chest",
  "Ultrasonography", "CT Scan", "MRI", "Echocardiography",
  "Troponin I", "D-Dimer", "CRP", "ESR", "Serum Electrolytes",
];

interface Props {
  patientId: string;
  patientName: string;
  appointmentId?: string | number;
  onSuccess: () => void;
  onCancel: () => void;
}

export function CreatePrescriptionForm({ patientId, patientName, appointmentId, onSuccess, onCancel }: Props) {
  const { user } = useAuth();
  const [medicines, setMedicines] = useState<MedicineRow[]>([
    { name: "", dosage: "", duration: "", instructions: "" },
  ]);
  const [selectedTests, setSelectedTests] = useState<string[]>([]);
  const [diagnosis, setDiagnosis] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const addMedicineRow = () => {
    setMedicines([...medicines, { name: "", dosage: "", duration: "", instructions: "" }]);
  };

  const removeMedicineRow = (idx: number) => {
    if (medicines.length <= 1) return;
    setMedicines(medicines.filter((_, i) => i !== idx));
  };

  const updateMedicine = (idx: number, field: keyof MedicineRow, value: string) => {
    const updated = [...medicines];
    updated[idx] = { ...updated[idx], [field]: value };
    setMedicines(updated);
  };

  const toggleTest = (test: string) => {
    setSelectedTests((prev) =>
      prev.includes(test) ? prev.filter((t) => t !== test) : [...prev, test]
    );
  };

  const handleSave = async () => {
    if (!user) return;

    const validMedicines = medicines.filter((m) => m.name.trim());
    if (validMedicines.length === 0 && selectedTests.length === 0) {
      toast.error("Please add at least one medicine or lab test");
      return;
    }
    if (!diagnosis.trim()) {
      toast.error("Please enter a diagnosis");
      return;
    }

    setSaving(true);

    try {
      const prescriptionText = validMedicines
        .map((m) => {
          const parts = [m.name.trim()];
          if (m.dosage.trim()) parts.push(`(${m.dosage.trim()})`);
          if (m.duration.trim()) parts.push(`for ${m.duration.trim()}`);
          if (m.instructions.trim()) parts.push(`- ${m.instructions.trim()}`);
          return parts.join(" ");
        })
        .join("\n");

      const labText = selectedTests.length > 0 ? `Recommended tests: ${selectedTests.join(", ")}` : "";
      const notesWithTests = [notes.trim(), labText].filter(Boolean).join("\n");

      await prescriptionService.create({
        patientId: Number(patientId),
        diagnosis: diagnosis.trim(),
        medicines: validMedicines.map((m) => ({
          name: m.name.trim(),
          dosage: m.dosage.trim(),
          duration: m.duration.trim(),
          instructions: m.instructions.trim(),
        })),
        labTests: selectedTests,
        notes: notesWithTests,
        appointmentId: appointmentId ? Number(appointmentId) : undefined,
      });

      toast.success("Prescription saved successfully.");
      onSuccess();
    } catch (err: any) {
      toast.error("Error: " + (err?.message || "Unknown"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5 p-4 rounded-2xl border border-secondary/30 bg-secondary/5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
          <Pill className="h-4 w-4 text-secondary" />
          Create Prescription — {patientName}
        </h3>
        <Button size="sm" variant="ghost" onClick={onCancel} className="h-7 w-7 p-0 rounded-lg">
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Diagnosis */}
      <div className="space-y-1.5">
        <Label className="text-xs font-semibold">Diagnosis *</Label>
        <Input
          placeholder="e.g. Viral Fever, Hypertension..."
          value={diagnosis}
          onChange={(e) => setDiagnosis(e.target.value)}
          className="rounded-xl h-9 text-sm"
        />
      </div>

      {/* Medicines */}
      <div className="space-y-3">
        <Label className="text-xs font-semibold flex items-center gap-1.5">
          <Pill className="h-3.5 w-3.5 text-primary" /> Medicines
        </Label>
        {medicines.map((med, idx) => (
          <div key={idx} className="grid grid-cols-12 gap-2 items-start p-3 rounded-xl bg-card border border-border/50">
            <div className="col-span-12 sm:col-span-3">
              <Input
                placeholder="Medicine Name"
                value={med.name}
                onChange={(e) => updateMedicine(idx, "name", e.target.value)}
                className="rounded-lg h-8 text-xs"
              />
            </div>
            <div className="col-span-4 sm:col-span-2">
              <Input
                placeholder="Dosage (1+0+1)"
                value={med.dosage}
                onChange={(e) => updateMedicine(idx, "dosage", e.target.value)}
                className="rounded-lg h-8 text-xs"
              />
            </div>
            <div className="col-span-4 sm:col-span-2">
              <Input
                placeholder="Duration (7 days)"
                value={med.duration}
                onChange={(e) => updateMedicine(idx, "duration", e.target.value)}
                className="rounded-lg h-8 text-xs"
              />
            </div>
            <div className="col-span-3 sm:col-span-4">
              <Input
                placeholder="Instructions (After meal)"
                value={med.instructions}
                onChange={(e) => updateMedicine(idx, "instructions", e.target.value)}
                className="rounded-lg h-8 text-xs"
              />
            </div>
            <div className="col-span-1 flex justify-end">
              <Button
                size="sm"
                variant="ghost"
                className="h-8 w-8 p-0 text-destructive hover:text-destructive rounded-lg"
                onClick={() => removeMedicineRow(idx)}
                disabled={medicines.length <= 1}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        ))}
        <Button size="sm" variant="outline" className="rounded-xl text-xs gap-1.5" onClick={addMedicineRow}>
          <Plus className="h-3.5 w-3.5" /> Add Medicine
        </Button>
      </div>

      {/* Lab Tests */}
      <div className="space-y-2">
        <Label className="text-xs font-semibold flex items-center gap-1.5">
          <FlaskConical className="h-3.5 w-3.5 text-purple-600" /> Recommended Lab Tests
        </Label>
        <div className="flex flex-wrap gap-1.5">
          {LAB_TEST_OPTIONS.map((test) => (
            <Badge
              key={test}
              variant={selectedTests.includes(test) ? "default" : "outline"}
              className={`cursor-pointer text-[10px] transition-all ${
                selectedTests.includes(test)
                  ? "bg-secondary text-secondary-foreground hover:bg-secondary/90"
                  : "hover:bg-muted"
              }`}
              onClick={() => toggleTest(test)}
            >
              {test}
            </Badge>
          ))}
        </div>
        {selectedTests.length > 0 && (
          <p className="text-[10px] text-muted-foreground">{selectedTests.length} test(s) selected</p>
        )}
      </div>

      {/* Notes */}
      <div className="space-y-1.5">
        <Label className="text-xs font-semibold">Notes (Optional)</Label>
        <Textarea
          placeholder="Additional instructions, follow-up, etc."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="rounded-xl min-h-[50px] text-sm"
        />
      </div>

      {/* Actions */}
      <div className="flex gap-2 justify-end">
        <Button size="sm" variant="outline" className="rounded-xl" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          size="sm"
          className="rounded-xl gradient-btn text-white border-0 gap-1.5"
          onClick={handleSave}
          disabled={saving}
        >
          <Save className="h-3.5 w-3.5" />
          {saving ? "Saving..." : "Save Prescription"}
        </Button>
      </div>
    </div>
  );
}
