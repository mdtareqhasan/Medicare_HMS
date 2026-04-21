import { useState, useEffect, useCallback, useRef, useMemo } from "react";

import { useAuth } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList,
} from "@/components/ui/command";
import {
  CreditCard, Search, Plus, Trash2, FileText, DollarSign,
  CheckCircle, Clock, AlertCircle, Download, Eye, ChevronsUpDown, Check,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { billingService, BillingInvoice } from "@/api/billingService";
import { userService } from "@/api/userService";

interface BillingRecord {
  id: string;
  patient_id: string;
  appointment_id: string | null;
  amount: number;
  subtotal: number;
  tax_amount: number;
  discount: number;
  status: string;
  payment_method: string;
  invoice_number: string | null;
  description: string | null;
  payment_date: string | null;
  created_at: string;
  patient_name?: string;
}

interface InvoiceItem {
  id?: string;
  item_type: string;
  item_name: string;
  quantity: number;
  unit_price: number;
  total: number;
  medicine_id?: string;
}

interface Medicine {
  id: string;
  name: string;
  price: number;
  stock_quantity: number;
}

interface PatientProfile {
  user_id: string;
  full_name: string | null;
}

const statusColors: Record<string, string> = {
  pending: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  paid: "bg-secondary/10 text-secondary border-secondary/20",
  overdue: "bg-destructive/10 text-destructive border-destructive/20",
  cancelled: "bg-muted text-muted-foreground border-border",
};

const statusIcons: Record<string, typeof Clock> = {
  pending: Clock,
  paid: CheckCircle,
  overdue: AlertCircle,
  cancelled: AlertCircle,
};

const ITEM_TYPES = [
  { value: "consultation", label: "Consultation Fee" },
  { value: "lab_test", label: "Laboratory Test" },
  { value: "medicine", label: "Medicine" },
  { value: "service", label: "Other Service" },
];

export default function Billing() {
  const { role } = useAuth();
  const [bills, setBills] = useState<BillingRecord[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [patients, setPatients] = useState<PatientProfile[]>([]);
  const [medicines, setMedicines] = useState<Medicine[]>([]);

  // Create invoice
  const [showCreate, setShowCreate] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState("");
  const [patientDropdownOpen, setPatientDropdownOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [description, setDescription] = useState("");
  const [discount, setDiscount] = useState(0);
  const [taxRate, setTaxRate] = useState(0);
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [saving, setSaving] = useState(false);

  // View invoice
  const [viewBill, setViewBill] = useState<BillingRecord | null>(null);
  const [viewItems, setViewItems] = useState<InvoiceItem[]>([]);
  const invoiceRef = useRef<HTMLDivElement>(null);

const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const invoices = await billingService.getInvoices();
      
      // Transform to BillingRecord format
      const transformed: BillingRecord[] = invoices.map((inv: any) => ({
        id: inv.id?.toString() || "0",
        patient_id: inv.patient?.id?.toString() || "0",
        appointment_id: null,
        amount: Number(inv.totalAmount) || 0,
        subtotal: Number(inv.totalAmount) || 0,
        tax_amount: 0,
        discount: 0,
        status: inv.status?.toLowerCase() || "pending",
        payment_method: "cash",
        invoice_number: inv.invoiceNumber || `INV-${inv.id}`,
        description: null,
        payment_date: inv.createdAt,
        created_at: inv.createdAt,
        patient_name: inv.patient?.username || inv.patient?.email || `Patient #${inv.patient?.id}`,
      }));
      
      setBills(transformed);
      console.log("[Billing] Loaded invoices:", transformed.length);
    } catch (err: any) {
      console.error("[Billing] Failed to fetch invoices:", err?.message || err);
      setBills([]);
    }
    
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Computed totals
  const subtotal = items.reduce((s, i) => s + i.total, 0);
  const taxAmount = subtotal * (taxRate / 100);
  const totalAmount = subtotal - discount + taxAmount;

  // Stats
  const totalRevenue = bills.filter((b) => b.status === "paid").reduce((s, b) => s + Number(b.amount), 0);
  const pendingAmount = bills.filter((b) => b.status === "pending").reduce((s, b) => s + Number(b.amount), 0);
  const paidCount = bills.filter((b) => b.status === "paid").length;
  const pendingCount = bills.filter((b) => b.status === "pending").length;

  const addItem = () => {
    setItems([...items, { item_type: "service", item_name: "", quantity: 1, unit_price: 0, total: 0 }]);
  };

  const updateItem = (idx: number, key: keyof InvoiceItem, value: any) => {
    setItems((prev) => prev.map((item, i) => {
      if (i !== idx) return item;
      const updated = { ...item, [key]: value };
      if (key === "quantity" || key === "unit_price") {
        updated.total = updated.quantity * updated.unit_price;
      }
      return updated;
    }));
  };

  const addMedicine = (medId: string, idx: number) => {
    const med = medicines.find((m) => m.id === medId);
    if (!med) return;
    setItems((prev) => prev.map((item, i) => {
      if (i !== idx) return item;
      return { ...item, item_name: med.name, unit_price: med.price, total: item.quantity * med.price, medicine_id: med.id };
    }));
  };

  const removeItem = (idx: number) => {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleCreateInvoice = async () => {
    if (!selectedPatient || items.length === 0) {
      toast.error("Select a patient and add at least one item");
      return;
    }
    setSaving(true);

    try {
      // Calculate fees from items
      let doctorFee = 0, labFee = 0, pharmacyFee = 0;
      
      for (const item of items) {
        const itemTotal = Number(item.total) || 0;
        if (item.item_type === "consultation") {
          doctorFee += itemTotal;
        } else if (item.item_type === "lab_test") {
          labFee += itemTotal;
        } else if (item.item_type === "medicine") {
          pharmacyFee += itemTotal;
        } else {
          doctorFee += itemTotal;
        }
      }

      // Create invoice via backend API
      const invoice = await billingService.createInvoice({
        patientId: Number(selectedPatient),
        doctorFee,
        labFee,
        pharmacyFee,
      });

      toast.success("Invoice created: " + invoice.invoiceNumber);
      setShowCreate(false);
      resetForm();
      fetchData();
    } catch (err: any) {
      toast.error("Failed to create invoice: " + (err?.message || "Unknown error"));
    }

    setSaving(false);
  };

  const resetForm = () => {
    setSelectedPatient("");
    setPaymentMethod("cash");
    setDescription("");
    setDiscount(0);
    setTaxRate(0);
    setItems([]);
  };

  const handleMarkPaid = async (bill: BillingRecord) => {
    try {
      await billingService.markPaid(Number(bill.id));
      toast.success("Marked as paid");
      fetchData();
    } catch (err) {
      toast.error("Failed to mark as paid");
    }
  };

  const handleViewInvoice = async (bill: BillingRecord) => {
    setViewBill(bill);
    setViewItems([]);
  };

  const handlePrintPDF = () => {
    if (!invoiceRef.current) return;
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    printWindow.document.write(`
      <html><head><title>Invoice ${viewBill?.invoice_number}</title>
      <style>
        body { font-family: system-ui, sans-serif; padding: 40px; color: #1a1a1a; max-width: 800px; margin: 0 auto; }
        h1 { color: #0B4D3C; font-size: 28px; margin: 0; }
        .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #0B4D3C; padding-bottom: 20px; margin-bottom: 24px; }
        .info { font-size: 13px; color: #666; line-height: 1.6; }
        .info strong { color: #1a1a1a; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th { background: #f5f5f5; text-align: left; padding: 10px 12px; font-size: 12px; text-transform: uppercase; color: #666; border-bottom: 2px solid #ddd; }
        td { padding: 10px 12px; border-bottom: 1px solid #eee; font-size: 13px; }
        .totals { text-align: right; margin-top: 20px; }
        .totals p { margin: 4px 0; font-size: 14px; }
        .totals .grand { font-size: 20px; font-weight: bold; color: #0B4D3C; margin-top: 12px; padding-top: 12px; border-top: 2px solid #0B4D3C; }
        .status { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; }
        .status.paid { background: #dcfce7; color: #166534; }
        .status.pending { background: #fef3c7; color: #92400e; }
        .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; font-size: 11px; color: #999; text-align: center; }
        @media print { body { padding: 20px; } }
      </style></head><body>
      <div class="header">
        <div><h1>🌿 Medicare</h1><p style="color:#666;margin:4px 0 0;font-size:13px;">Healthcare Management System</p></div>
        <div style="text-align:right">
          <p style="font-size:20px;font-weight:bold;color:#0B4D3C;margin:0;">${viewBill?.invoice_number || "N/A"}</p>
          <p style="font-size:12px;color:#666;margin:4px 0 0;">Date: ${viewBill ? format(new Date(viewBill.created_at), "dd MMM yyyy") : ""}</p>
          <span class="status ${viewBill?.status}">${viewBill?.status?.toUpperCase()}</span>
        </div>
      </div>
      <div class="info">
        <p><strong>Patient:</strong> ${viewBill?.patient_name || "N/A"}</p>
        <p><strong>Payment Method:</strong> ${viewBill?.payment_method || "N/A"}</p>
        ${viewBill?.description ? `<p><strong>Description:</strong> ${viewBill.description}</p>` : ""}
      </div>
      <table>
        <thead><tr><th>#</th><th>Item</th><th>Type</th><th>Qty</th><th>Unit Price</th><th>Total</th></tr></thead>
        <tbody>
          ${viewItems.map((item, i) => `<tr><td>${i + 1}</td><td>${item.item_name}</td><td>${item.item_type}</td><td>${item.quantity}</td><td>৳${Number(item.unit_price).toFixed(2)}</td><td>৳${Number(item.total).toFixed(2)}</td></tr>`).join("")}
        </tbody>
      </table>
      <div class="totals">
        <p>Subtotal: ৳${Number(viewBill?.subtotal || 0).toFixed(2)}</p>
        ${Number(viewBill?.tax_amount) > 0 ? `<p>Tax: ৳${Number(viewBill?.tax_amount).toFixed(2)}</p>` : ""}
        ${Number(viewBill?.discount) > 0 ? `<p>Discount: -৳${Number(viewBill?.discount).toFixed(2)}</p>` : ""}
        <p class="grand">Total: ৳${Number(viewBill?.amount || 0).toFixed(2)}</p>
      </div>
      <div class="footer">
        <p>Thank you for choosing Medicare. This is a computer-generated invoice.</p>
      </div>
      </body></html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const filtered = bills.filter((b) => {
    const q = search.toLowerCase();
    const matchSearch = (b.patient_name || "").toLowerCase().includes(q) ||
      (b.invoice_number || "").toLowerCase().includes(q);
    const matchStatus = statusFilter === "all" || b.status === statusFilter;
    return matchSearch && matchStatus;
  });

  if (role !== "admin" && role !== "pharmacist") {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        You don't have permission to view this page.
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between animate-fade-in-up">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground tracking-tight">Billing & Invoicing</h1>
          <p className="text-sm text-muted-foreground mt-1">Generate invoices, track payments</p>
        </div>
        <Button onClick={async () => { 
          resetForm(); 
          setShowCreate(true);
          // Fetch patients for the dropdown
          try {
            const patientsData = await userService.getPatients();
            setPatients(patientsData.map((p: any) => ({
              user_id: p.id.toString(),
              full_name: p.username || p.email || "Unknown",
            })));
          } catch (err) {
            console.error("Failed to load patients:", err);
          }
        }} className="gradient-btn text-white rounded-xl gap-2 border-0">
          <Plus className="h-4 w-4" /> Create Invoice
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 animate-fade-in-up" style={{ animationDelay: "80ms" }}>
        <div className="dashboard-card p-4 text-center hover-lift">
          <p className="text-2xl font-extrabold text-secondary">৳{totalRevenue.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground font-medium mt-0.5">Total Revenue</p>
        </div>
        <div className="dashboard-card p-4 text-center hover-lift">
          <p className="text-2xl font-extrabold text-amber-600">৳{pendingAmount.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground font-medium mt-0.5">Pending Dues</p>
        </div>
        <div className="dashboard-card p-4 text-center hover-lift">
          <p className="text-2xl font-extrabold text-foreground">{paidCount}</p>
          <p className="text-xs text-muted-foreground font-medium mt-0.5">Paid Invoices</p>
        </div>
        <div className="dashboard-card p-4 text-center hover-lift">
          <p className="text-2xl font-extrabold text-foreground">{pendingCount}</p>
          <p className="text-xs text-muted-foreground font-medium mt-0.5">Pending Invoices</p>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="dashboard-card p-4 animate-fade-in-up" style={{ animationDelay: "160ms" }}>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search by patient or invoice #..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 h-11 rounded-xl" />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-40 h-11 rounded-xl"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="overdue">Overdue</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      <div className="dashboard-card overflow-hidden animate-fade-in-up" style={{ animationDelay: "240ms" }}>
        {loading ? (
          <div className="p-8 space-y-3">{[1, 2, 3, 4].map((i) => <div key={i} className="h-12 rounded-xl skeleton-shimmer" />)}</div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <CreditCard className="h-12 w-12 mb-3 opacity-30" />
            <p className="font-medium">No invoices found</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="font-bold">Invoice #</TableHead>
                <TableHead className="font-bold">Patient</TableHead>
                <TableHead className="font-bold">Amount</TableHead>
                <TableHead className="font-bold">Method</TableHead>
                <TableHead className="font-bold">Status</TableHead>
                <TableHead className="font-bold">Date</TableHead>
                <TableHead className="font-bold text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((bill) => {
                const SIcon = statusIcons[bill.status] || Clock;
                return (
                  <TableRow key={bill.id}>
                    <TableCell className="font-mono text-xs font-semibold text-foreground">{bill.invoice_number || bill.id.slice(0, 8)}</TableCell>
                    <TableCell className="font-medium">{bill.patient_name}</TableCell>
                    <TableCell className="font-bold text-foreground">৳{Number(bill.amount).toLocaleString()}</TableCell>
                    <TableCell><Badge variant="outline" className="capitalize text-xs">{bill.payment_method}</Badge></TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`text-xs capitalize ${statusColors[bill.status] || ""}`}>
                        <SIcon className="h-3 w-3 mr-1" />{bill.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs">{format(new Date(bill.created_at), "dd MMM yyyy")}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button size="sm" variant="outline" className="rounded-xl text-xs" onClick={() => handleViewInvoice(bill)}>
                          <Eye className="h-3.5 w-3.5 mr-1" /> View
                        </Button>
                        {bill.status === "pending" && (
                          <Button size="sm" variant="outline" className="rounded-xl text-xs text-secondary" onClick={() => handleMarkPaid(bill)}>
                            <CheckCircle className="h-3.5 w-3.5 mr-1" /> Paid
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Create Invoice Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="rounded-3xl max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <FileText className="h-5 w-5 text-secondary" />
              Create Invoice
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-5 pt-2">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Patient *</Label>
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
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Payment Method</Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger className="rounded-xl h-10"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="card">Card</SelectItem>
                    <SelectItem value="online">Online</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Description</Label>
                <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional note" className="rounded-xl h-10" />
              </div>
            </div>

            {/* Line Items */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <Label className="text-sm font-bold">Line Items</Label>
                <Button size="sm" variant="outline" className="rounded-xl text-xs" onClick={addItem}>
                  <Plus className="h-3.5 w-3.5 mr-1" /> Add Item
                </Button>
              </div>
              {items.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground text-sm border-2 border-dashed border-border rounded-xl">
                  Click "Add Item" to start adding line items
                </div>
              ) : (
                <div className="space-y-2">
                  {items.map((item, idx) => (
                    <div key={idx} className="p-3 rounded-xl border border-border bg-card space-y-2">
                      <div className="grid grid-cols-12 gap-2 items-end">
                        <div className="col-span-3 space-y-1">
                          <Label className="text-[10px] text-muted-foreground">Type</Label>
                          <Select value={item.item_type} onValueChange={(v) => updateItem(idx, "item_type", v)}>
                            <SelectTrigger className="rounded-lg h-8 text-xs"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {ITEM_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="col-span-3 space-y-1">
                          <Label className="text-[10px] text-muted-foreground">Item</Label>
                          {item.item_type === "medicine" ? (
                            <Select value={item.medicine_id || ""} onValueChange={(v) => addMedicine(v, idx)}>
                              <SelectTrigger className="rounded-lg h-8 text-xs"><SelectValue placeholder="Pick medicine" /></SelectTrigger>
                              <SelectContent>
                                {medicines.map((m) => <SelectItem key={m.id} value={m.id}>{m.name} (৳{m.price})</SelectItem>)}
                              </SelectContent>
                            </Select>
                          ) : (
                            <Input value={item.item_name} onChange={(e) => updateItem(idx, "item_name", e.target.value)} className="rounded-lg h-8 text-xs" placeholder="Item name" />
                          )}
                        </div>
                        <div className="col-span-2 space-y-1">
                          <Label className="text-[10px] text-muted-foreground">Qty</Label>
                          <Input type="number" value={item.quantity} onChange={(e) => updateItem(idx, "quantity", parseInt(e.target.value) || 1)} className="rounded-lg h-8 text-xs" min={1} />
                        </div>
                        <div className="col-span-2 space-y-1">
                          <Label className="text-[10px] text-muted-foreground">Price</Label>
                          <Input type="number" value={item.unit_price} onChange={(e) => updateItem(idx, "unit_price", parseFloat(e.target.value) || 0)} className="rounded-lg h-8 text-xs" />
                        </div>
                        <div className="col-span-1 text-right">
                          <p className="text-xs font-bold text-foreground mt-4">৳{item.total.toFixed(0)}</p>
                        </div>
                        <div className="col-span-1">
                          <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-destructive" onClick={() => removeItem(idx)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Totals */}
            {items.length > 0 && (
              <div className="p-4 rounded-2xl bg-muted/50 space-y-2">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-[10px] text-muted-foreground">Discount (৳)</Label>
                    <Input type="number" value={discount} onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)} className="rounded-lg h-8 text-xs" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] text-muted-foreground">Tax Rate (%)</Label>
                    <Input type="number" value={taxRate} onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)} className="rounded-lg h-8 text-xs" />
                  </div>
                </div>
                <div className="text-right space-y-0.5 pt-2 border-t border-border">
                  <p className="text-xs text-muted-foreground">Subtotal: ৳{subtotal.toFixed(2)}</p>
                  {taxAmount > 0 && <p className="text-xs text-muted-foreground">Tax: ৳{taxAmount.toFixed(2)}</p>}
                  {discount > 0 && <p className="text-xs text-muted-foreground">Discount: -৳{discount.toFixed(2)}</p>}
                  <p className="text-lg font-extrabold text-foreground">Total: ৳{totalAmount.toFixed(2)}</p>
                </div>
              </div>
            )}
          </div>
          <DialogFooter className="gap-2 mt-2">
            <Button variant="outline" className="rounded-xl" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button className="rounded-xl gradient-btn text-white border-0" onClick={handleCreateInvoice} disabled={saving}>
              {saving ? "Creating..." : "Create Invoice"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Invoice Dialog */}
      <Dialog open={!!viewBill} onOpenChange={() => setViewBill(null)}>
        <DialogContent className="rounded-3xl max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center justify-between">
              <span className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-secondary" />
                Invoice {viewBill?.invoice_number}
              </span>
              <Button size="sm" variant="outline" className="rounded-xl text-xs" onClick={handlePrintPDF}>
                <Download className="h-3.5 w-3.5 mr-1" /> Download PDF
              </Button>
            </DialogTitle>
          </DialogHeader>
          {viewBill && (
            <div ref={invoiceRef} className="space-y-4 pt-2">
              <div className="flex justify-between items-start">
                <div className="text-sm space-y-1">
                  <p className="font-bold text-foreground">Patient: {viewBill.patient_name}</p>
                  <p className="text-muted-foreground">Method: <span className="capitalize">{viewBill.payment_method}</span></p>
                  <p className="text-muted-foreground">Date: {format(new Date(viewBill.created_at), "dd MMM yyyy")}</p>
                </div>
                <Badge variant="outline" className={`capitalize ${statusColors[viewBill.status] || ""}`}>
                  {viewBill.status}
                </Badge>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Item</TableHead>
                    <TableHead className="text-xs">Type</TableHead>
                    <TableHead className="text-xs text-right">Qty</TableHead>
                    <TableHead className="text-xs text-right">Price</TableHead>
                    <TableHead className="text-xs text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {viewItems.map((item, i) => (
                    <TableRow key={i}>
                      <TableCell className="text-sm font-medium">{item.item_name}</TableCell>
                      <TableCell><Badge variant="outline" className="text-[10px] capitalize">{item.item_type}</Badge></TableCell>
                      <TableCell className="text-right">{item.quantity}</TableCell>
                      <TableCell className="text-right text-muted-foreground">৳{Number(item.unit_price).toFixed(2)}</TableCell>
                      <TableCell className="text-right font-semibold">৳{Number(item.total).toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <div className="text-right space-y-0.5 pt-3 border-t border-border">
                <p className="text-xs text-muted-foreground">Subtotal: ৳{Number(viewBill.subtotal).toFixed(2)}</p>
                {Number(viewBill.tax_amount) > 0 && <p className="text-xs text-muted-foreground">Tax: ৳{Number(viewBill.tax_amount).toFixed(2)}</p>}
                {Number(viewBill.discount) > 0 && <p className="text-xs text-muted-foreground">Discount: -৳{Number(viewBill.discount).toFixed(2)}</p>}
                <p className="text-xl font-extrabold text-foreground pt-2">Total: ৳{Number(viewBill.amount).toFixed(2)}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
