import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Clock, Save } from "lucide-react";
import { toast } from "sonner";
import { doctorAvailabilityService } from "@/api/doctorAvailabilityService";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

interface AvailabilitySlot {
  id?: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  break_start: string;
  break_end: string;
  is_available: boolean;
  slot_duration: number;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DoctorAvailabilitySettings({ open, onOpenChange }: Props) {
  const { user } = useAuth();
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const doctorId = Number(user?.id) || 0;

  useEffect(() => {
    if (open) fetchAvailability();
  }, [open, doctorId]);

  const getDefaultSlots = (): AvailabilitySlot[] =>
    Array.from({ length: 7 }, (_, i) => ({
      day_of_week: i,
      start_time: "09:00",
      end_time: "17:00",
      break_start: "13:00",
      break_end: "14:00",
      is_available: i >= 1 && i <= 5,
      slot_duration: 30,
    }));

  const fetchAvailability = async () => {
    setLoading(true);
    const fallback = getDefaultSlots();

    if (!doctorId) {
      setSlots(fallback);
      setLoading(false);
      return;
    }

    try {
      const data = await doctorAvailabilityService.getAvailability(doctorId);
      const existing = Array.isArray(data) ? data : [];
      const full: AvailabilitySlot[] = Array.from({ length: 7 }, (_, i) => {
        const found = existing.find((e: any) => e.dayOfWeek === i);
        return found
          ? {
              id: found.id?.toString(),
              day_of_week: i,
              start_time: found.startTime,
              end_time: found.endTime,
              break_start: found.breakStart || "",
              break_end: found.breakEnd || "",
              is_available: found.isAvailable ?? false,
              slot_duration: found.slotDuration ?? 30,
            }
          : fallback[i];
      });
      setSlots(full);
    } catch (error: any) {
      toast.error("Failed to load availability schedule.");
      setSlots(fallback);
    } finally {
      setLoading(false);
    }
  };

  const updateSlot = (index: number, key: keyof AvailabilitySlot, value: any) => {
    setSlots((prev) => prev.map((s, i) => (i === index ? { ...s, [key]: value } : s)));
  };

  const handleSave = async () => {
    setSaving(true);
    if (!doctorId) {
      toast.error('Session expired. Please login again.');
      setSaving(false);
      return;
    }

    try {
      // Mapping to Backend DTO (Matches DoctorAvailabilityDto.java)
      const payloadSlots = slots.map((slot, idx) => ({
        dayOfWeek: Number(slot.day_of_week),
        startTime: slot.start_time || "09:00",
        endTime: slot.end_time || "17:00",
        breakStart: slot.break_start || null,
        breakEnd: slot.break_end || null,
        isAvailable: Boolean(slot.is_available),
        slotDuration: slot.slot_duration || 30,
      }));

      console.log("Payload:", JSON.stringify(payloadSlots));

      await doctorAvailabilityService.saveAvailabilityBulk(doctorId, payloadSlots);
      
      toast.success('Availability settings updated!');
      await fetchAvailability(); 
      onOpenChange(false); // ডায়ালগ বন্ধ হবে, রিডাইরেক্ট হবে না
    } catch (error: any) {
      const message = error?.response?.data?.message || error?.message || 'Error saving data';
      toast.error('Failed to save: ' + message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-3xl max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold flex items-center gap-2">
            <Clock className="h-5 w-5 text-secondary" />
            Configure Availability
          </DialogTitle>
          <DialogDescription>
            Set up your weekly schedule for appointments.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="space-y-3 py-4 text-center">Loading schedule...</div>
        ) : (
          <div className="space-y-3 pt-2">
            {slots.map((slot, idx) => (
              <div
                key={slot.day_of_week}
                className={`p-4 rounded-2xl border transition-all ${
                  slot.is_available ? "border-secondary/30 bg-secondary/5" : "border-border bg-muted/30 opacity-60"
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="font-semibold text-sm">{DAYS[slot.day_of_week]}</span>
                  <Switch
                    checked={slot.is_available}
                    onCheckedChange={(v) => updateSlot(idx, "is_available", v)}
                  />
                </div>
                {slot.is_available && (
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                    <div className="space-y-1">
                      <Label className="text-[10px]">Start</Label>
                      <Input type="time" value={slot.start_time} onChange={(e) => updateSlot(idx, "start_time", e.target.value)} className="h-8 text-xs" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px]">End</Label>
                      <Input type="time" value={slot.end_time} onChange={(e) => updateSlot(idx, "end_time", e.target.value)} className="h-8 text-xs" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px]">Break Start</Label>
                      <Input type="time" value={slot.break_start} onChange={(e) => updateSlot(idx, "break_start", e.target.value)} className="h-8 text-xs" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px]">Break End</Label>
                      <Input type="time" value={slot.break_end} onChange={(e) => updateSlot(idx, "break_end", e.target.value)} className="h-8 text-xs" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px]">Slot (min)</Label>
                      <Input type="number" value={slot.slot_duration} onChange={(e) => updateSlot(idx, "slot_duration", parseInt(e.target.value) || 30)} className="h-8 text-xs" />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <DialogFooter className="gap-2 mt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button className="gradient-btn text-white border-0" onClick={handleSave} disabled={saving}>
            <Save className="h-4 w-4 mr-1.5" />
            {saving ? "Saving..." : "Save Availability"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}