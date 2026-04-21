import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { medicineService } from "@/api/medicineService";
import { prescriptionService, PrescriptionRecord } from "@/api/prescriptionService";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Pill, Search, AlertTriangle, Package, Plus, Check, ClipboardList,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { toast } from "sonner";

// ─── Types ───────────────────────────────────────────────────────
interface Medicine {
  id: number;
  name: string;
  genericName?: string | null;
  generic_name?: string | null;
  category?: string | null;
  price: number;
  stockQuantity?: number;
  stock_quantity?: number;
  expiryDate?: string | null;
  expiry_date?: string | null;
}

// Helper to normalize backend camelCase / snake_case
function normMed(m: any): Medicine {
  return {
    id: m.id,
    name: m.name,
    genericName: m.genericName ?? m.generic_name ?? null,
    category: m.category ?? null,
    price: m.price ?? 0,
    stockQuantity: m.stockQuantity ?? m.stock_quantity ?? 0,
    expiryDate: m.expiryDate ?? m.expiry_date ?? null,
  };
}

// ─── Component ───────────────────────────────────────────────────
export default function Pharmacy() {
  const { role } = useAuth();
  const canManage = role === "admin" || role === "pharmacist";
  const [tab, setTab] = useState("pending");

  // Prescriptions
  const [pending, setPending] = useState<PrescriptionRecord[]>([]);
  const [dispensed, setDispensed] = useState<PrescriptionRecord[]>([]);
  const [rxLoading, setRxLoading] = useState(true);

  // Medicines
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [medLoading, setMedLoading] = useState(true);
  const [medSearch, setMedSearch] = useState("");
  const [showMedModal, setShowMedModal] = useState(false);
  const [editingMed, setEditingMed] = useState<Medicine | null>(null);
  const [medForm, setMedForm] = useState({
    name: "", genericName: "", category: "", price: "", stockQuantity: "", expiryDate: "",
  });

  // ── Fetch ────────────────────────────────────────────────────
  const fetchPrescriptions = async () => {
    setRxLoading(true);
    try {
      const [p, d] = await Promise.all([
        prescriptionService.getPending(),
        prescriptionService.getDispensed(),
      ]);
      // Filter by normalized status (lowercase)
      setPending(p.filter(rx => rx.status === "pending"));
      setDispensed(d.filter(rx => rx.status === "dispensed"));
    } catch (e: any) {
      console.error("Failed to load prescriptions", e);
      toast.error("Failed to load prescriptions");
    } finally {
      setRxLoading(false);
    }
  };

  const fetchMedicines = async () => {
    setMedLoading(true);
    try {
      const data = await medicineService.getAll();
      setMedicines(data.map(normMed));
    } catch (e: any) {
      console.error("Failed to load medicines", e);
      toast.error("Failed to load medicines");
    } finally {
      setMedLoading(false);
    }
  };

  useEffect(() => {
    fetchPrescriptions();
    fetchMedicines();
  }, []);

  // ── Actions ──────────────────────────────────────────────────
  const handleDispense = async (id: number) => {
    try {
      await prescriptionService.dispense(id);
      toast.success("Prescription dispensed!");
      fetchPrescriptions();
    } catch (e: any) {
      toast.error("Dispense failed: " + (e?.response?.data?.error || e.message));
    }
  };

  const openMedModal = (med?: Medicine) => {
    if (med) {
      setEditingMed(med);
      setMedForm({
        name: med.name,
        genericName: med.genericName || "",
        category: med.category || "",
        price: String(med.price),
        stockQuantity: String(med.stockQuantity ?? 0),
        expiryDate: med.expiryDate || "",
      });
    } else {
      setEditingMed(null);
      setMedForm({ name: "", genericName: "", category: "", price: "", stockQuantity: "", expiryDate: "" });
    }
    setShowMedModal(true);
  };

  const saveMedicine = async () => {
    const payload: any = {
      name: medForm.name,
      genericName: medForm.genericName,
      category: medForm.category,
      price: parseFloat(medForm.price) || 0,
      stockQuantity: parseInt(medForm.stockQuantity) || 0,
      expiryDate: medForm.expiryDate || null,
    };
    try {
      if (editingMed) {
        await medicineService.update(editingMed.id, payload);
        toast.success("Medicine updated");
      } else {
        await medicineService.create(payload);
        toast.success("Medicine added");
      }
      setShowMedModal(false);
      fetchMedicines();
    } catch (e: any) {
      toast.error("Save failed: " + (e?.response?.data?.error || e.message));
    }
  };

  // ── Helpers ──────────────────────────────────────────────────
  const parseMedicines = (raw: string | any[]): { name: string; dosage?: string; duration?: string }[] => {
    if (Array.isArray(raw)) return raw;
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    } catch { /* ignore */ }
    if (typeof raw === "string" && raw.trim()) return [{ name: raw }];
    return [];
  };

  const filteredMeds = medicines.filter(
    (m) =>
      m.name.toLowerCase().includes(medSearch.toLowerCase()) ||
      (m.genericName || "").toLowerCase().includes(medSearch.toLowerCase()) ||
      (m.category || "").toLowerCase().includes(medSearch.toLowerCase())
  );

  // Block unauthorized roles
  if (role && !canManage && role !== "patient" && role !== "doctor") {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        You don't have permission to view this page.
      </div>
    );
  }

  // ── Render ───────────────────────────────────────────────────
  return (
    <div className="p-4 md:p-6 space-y-5">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600">
          <Pill className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Pharmacy</h1>
          <p className="text-xs text-muted-foreground">Manage prescriptions and medicine inventory</p>
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 max-w-lg">
          <TabsTrigger value="pending" className="gap-1.5">
            <ClipboardList className="h-3.5 w-3.5" /> Pending
            {pending.length > 0 && (
              <Badge variant="destructive" className="ml-1 text-[10px] px-1.5 py-0">{pending.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="dispensed" className="gap-1.5">
            <Check className="h-3.5 w-3.5" /> Dispensed
          </TabsTrigger>
          <TabsTrigger value="inventory" className="gap-1.5">
            <Package className="h-3.5 w-3.5" /> Inventory
          </TabsTrigger>
        </TabsList>

        {/* ───── TAB 1: Pending ───── */}
        <TabsContent value="pending" className="mt-4">
          {rxLoading ? (
            <div className="text-center py-12 text-muted-foreground">Loading prescriptions...</div>
          ) : pending.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <Pill className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="font-medium">No pending prescriptions</p>
              <p className="text-xs mt-1">All prescriptions have been dispensed</p>
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {pending.map((rx) => {
                const meds = parseMedicines(rx.medicines);
                return (
                  <div key={rx.id} className="bg-card border rounded-2xl p-5 shadow-sm hover:shadow-md transition-all">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <p className="text-sm font-bold">Dr. {rx.doctorName || rx.doctorId}</p>
                        <p className="text-xs text-muted-foreground">
                          Patient ID: {rx.patientId} • {rx.createdAt ? format(parseISO(rx.createdAt), "dd MMM yyyy") : ""}
                        </p>
                      </div>
                      <Badge className="bg-amber-100 text-amber-700 border-0 text-[10px]">Pending</Badge>
                    </div>

                    <div className="space-y-1 mb-3">
                      <p className="text-xs font-semibold text-muted-foreground">Medicines:</p>
                      {meds.length > 0 ? meds.map((m, i) => (
                        <div key={i} className="text-xs bg-muted/30 rounded-lg px-2.5 py-1.5 flex justify-between">
                          <span className="font-medium">{m.name}</span>
                          <span className="text-muted-foreground">{m.dosage || ""} {m.duration ? `• ${m.duration}` : ""}</span>
                        </div>
                      )) : (
                        <p className="text-xs text-muted-foreground italic">No medicines listed</p>
                      )}
                    </div>

                    {rx.notes && <p className="text-xs text-muted-foreground mb-3">📝 {rx.notes}</p>}

                    {canManage && (
                    <Button size="sm" className="w-full rounded-xl" onClick={() => handleDispense(rx.id)}>
                      <Check className="h-3.5 w-3.5 mr-1" /> Dispense
                    </Button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* ───── TAB 2: Dispensed ───── */}
        <TabsContent value="dispensed" className="mt-4">
          {rxLoading ? (
            <div className="text-center py-12 text-muted-foreground">Loading...</div>
          ) : dispensed.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <Check className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="font-medium">No dispensed prescriptions yet</p>
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {dispensed.map((rx) => {
                const meds = parseMedicines(rx.medicines);
                return (
                  <div key={rx.id} className="bg-card border rounded-2xl p-5 shadow-sm opacity-80">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <p className="text-sm font-bold">Dr. {rx.doctorName || rx.doctorId}</p>
                        <p className="text-xs text-muted-foreground">
                          Patient ID: {rx.patientId} • {rx.createdAt ? format(parseISO(rx.createdAt), "dd MMM yyyy") : ""}
                        </p>
                      </div>
                      <Badge className="bg-emerald-100 text-emerald-700 border-0 text-[10px]">Dispensed</Badge>
                    </div>
                    <div className="space-y-1">
                      {meds.map((m, i) => (
                        <div key={i} className="text-xs bg-muted/30 rounded-lg px-2.5 py-1.5">
                          <span className="font-medium">{m.name}</span>
                          {m.dosage && <span className="text-muted-foreground ml-2">{m.dosage}</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* ───── TAB 3: Inventory ───── */}
        <TabsContent value="inventory" className="mt-4 space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 justify-between">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search medicines..."
                value={medSearch}
                onChange={(e) => setMedSearch(e.target.value)}
                className="pl-9 rounded-xl"
              />
            </div>
            {canManage && (
            <Button onClick={() => openMedModal()} className="rounded-xl gap-1.5">
              <Plus className="h-4 w-4" /> Add Medicine
            </Button>
            )}
          </div>

          {medLoading ? (
            <div className="text-center py-12 text-muted-foreground">Loading inventory...</div>
          ) : (
            <div className="rounded-xl border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead>Name</TableHead>
                    <TableHead>Generic Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">Stock</TableHead>
                    <TableHead className="text-right">Price</TableHead>
                    <TableHead>Expiry</TableHead>
                    <TableHead className="text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMeds.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        No medicines found
                      </TableCell>
                    </TableRow>
                  ) : filteredMeds.map((med) => (
                    <TableRow key={med.id} className="hover:bg-muted/20">
                      <TableCell className="font-medium">{med.name}</TableCell>
                      <TableCell className="text-muted-foreground">{med.genericName || "—"}</TableCell>
                      <TableCell>{med.category || "—"}</TableCell>
                      <TableCell className="text-right">
                        {(med.stockQuantity ?? 0) < 10 ? (
                          <Badge variant="destructive" className="gap-1 text-xs">
                            <AlertTriangle className="h-3 w-3" /> {med.stockQuantity}
                          </Badge>
                        ) : (
                          <span className="font-medium">{med.stockQuantity}</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">৳{med.price?.toFixed(2)}</TableCell>
                      <TableCell className="text-muted-foreground text-xs">
                        {med.expiryDate ? format(parseISO(med.expiryDate), "dd MMM yyyy") : "—"}
                      </TableCell>
                      <TableCell className="text-center">
                        {canManage && (
                        <Button variant="ghost" size="sm" onClick={() => openMedModal(med)} className="text-xs">
                          Edit
                        </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* ───── Add/Edit Medicine Modal ───── */}
      <Dialog open={showMedModal} onOpenChange={setShowMedModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingMed ? "Edit Medicine" : "Add Medicine"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Name *</Label>
              <Input value={medForm.name} onChange={(e) => setMedForm({ ...medForm, name: e.target.value })} />
            </div>
            <div>
              <Label>Generic Name</Label>
              <Input value={medForm.genericName} onChange={(e) => setMedForm({ ...medForm, genericName: e.target.value })} />
            </div>
            <div>
              <Label>Category</Label>
              <Input value={medForm.category} onChange={(e) => setMedForm({ ...medForm, category: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Price</Label>
                <Input type="number" value={medForm.price} onChange={(e) => setMedForm({ ...medForm, price: e.target.value })} />
              </div>
              <div>
                <Label>Stock Qty</Label>
                <Input type="number" value={medForm.stockQuantity} onChange={(e) => setMedForm({ ...medForm, stockQuantity: e.target.value })} />
              </div>
            </div>
            <div>
              <Label>Expiry Date</Label>
              <Input type="date" value={medForm.expiryDate} onChange={(e) => setMedForm({ ...medForm, expiryDate: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowMedModal(false)}>Cancel</Button>
            <Button onClick={saveMedicine} disabled={!medForm.name.trim()}>
              {editingMed ? "Update" : "Add"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
