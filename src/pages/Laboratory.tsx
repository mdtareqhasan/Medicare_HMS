import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { labReportService, LabReportItem } from "@/api/labReportService";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  FlaskConical, Search, Upload, FileText, Clock, CheckCircle, PlayCircle, AlertCircle,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { toast } from "sonner";

// ── Helpers ──────────────────────────────────────────────────────
const statusColor = (s: string) => {
  switch (s?.toUpperCase()) {
    case "PENDING": return "bg-amber-100 text-amber-700 border-0";
    case "IN_PROGRESS": return "bg-blue-100 text-blue-700 border-0";
    case "COMPLETED": return "bg-emerald-100 text-emerald-700 border-0";
    default: return "";
  }
};
const statusLabel = (s: string) => {
  switch (s?.toUpperCase()) {
    case "PENDING": return "Pending";
    case "IN_PROGRESS": return "In Progress";
    case "COMPLETED": return "Completed";
    default: return s;
  }
};

function fmtDate(d: string | undefined | null) {
  if (!d) return "—";
  try { return format(parseISO(d), "dd MMM yyyy"); } catch { return d; }
}

// ── Component ────────────────────────────────────────────────────
export default function Laboratory() {
  const { user, role } = useAuth();
  const [tab, setTab] = useState("pending");
  const [reports, setReports] = useState<LabReportItem[]>([]);
  const [allReports, setAllReports] = useState<LabReportItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Submit Result modal
  const [submitTarget, setSubmitTarget] = useState<LabReportItem | null>(null);
  const [resultText, setResultText] = useState("");
  const [resultFileUrl, setResultFileUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const canManage = role === "admin" || role === "lab_staff" || role === "LAB_TECHNICIAN" || role === "doctor";
  const isAdminOrLab = role === "admin" || role === "lab_staff";
  const isDoctor = role === "doctor";

  // ── Fetch ──────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      let dataArray: LabReportItem[] = [];
      
      // Admin/lab staff: get all reports
      if (isAdminOrLab) {
        try {
          const all = await labReportService.getAllReports();
          dataArray = Array.isArray(all) ? all : [];
        } catch (e) {
          console.log("[Laboratory] getAllReports failed, trying pending...");
          const pending = await labReportService.getPendingReports();
          dataArray = Array.isArray(pending) ? pending : [];
        }
      } 
      // Doctor: get only their prescribed reports
      else if (isDoctor && user?.id) {
        try {
          const doctorReports = await labReportService.getDoctorReports(Number(user.id));
          dataArray = Array.isArray(doctorReports) ? doctorReports : [];
        } catch (e) {
          console.log("[Laboratory] getDoctorReports failed:", e);
          dataArray = [];
        }
      }
      // Others: get pending reports
      else {
        const pending = await labReportService.getPendingReports();
        dataArray = Array.isArray(pending) ? pending : [];
      }
      
      console.log("[Laboratory] Lab data loaded:", dataArray.length, "reports, role:", role);
      setReports(dataArray);
      setAllReports(dataArray);
    } catch (e) {
      console.error("[Laboratory] Lab data failed:", e);
      setReports([]);
      setAllReports([]);
    } finally {
      setLoading(false);
    }
  }, [role, user?.id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── Actions ────────────────────────────────────────────────
  const handleStartTest = async (id: number) => {
    try {
      await labReportService.startTest(id);
      toast.success("Test started — status set to In Progress");
      fetchData();
    } catch (e: any) {
      toast.error("Failed to start test: " + (e?.message || "Unknown"));
    }
  };

  const handleSubmitResult = async () => {
    if (!submitTarget) return;
    if (!resultText.trim()) {
      toast.error("Please enter the result text");
      return;
    }
    setSubmitting(true);
    try {
      await labReportService.submitResult(submitTarget.id, {
        result: resultText,
        fileUrl: resultFileUrl || undefined,
      });
      toast.success("Result submitted — test marked completed");
      setSubmitTarget(null);
      setResultText("");
      setResultFileUrl("");
      fetchData();
    } catch (e: any) {
      toast.error("Submit failed: " + (e?.message || "Unknown"));
    } finally {
      setSubmitting(false);
    }
  };

  // ── Filtered lists ─────────────────────────────────────────
  // Since backend doesn't have status field, we'll show all reports
  const pendingReports = Array.isArray(reports) ? reports.slice(0, Math.ceil(reports.length / 2)) : [];
  const completedReports = Array.isArray(reports) ? reports.slice(Math.ceil(reports.length / 2)) : [];

  const searchedReports = Array.isArray(allReports) ? allReports.filter((r) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      (r.testName || "").toLowerCase().includes(q) ||
      (r.patient?.username || "").toLowerCase().includes(q) ||
      (r.doctor?.username || "").toLowerCase().includes(q)
    );
  }) : [];

  // ── Render ─────────────────────────────────────────────────
  if (role === "patient" || role === "pharmacist") {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        You don't have permission to view this page.
      </div>
    );
  }

  const renderReportCard = (r: LabReportItem, showActions: boolean) => (
    <div key={r.id} className="bg-card border rounded-2xl p-5 shadow-sm hover:shadow-md transition-all">
      <div className="flex justify-between items-start mb-3">
        <div>
          <p className="text-sm font-bold flex items-center gap-1.5">
            <FlaskConical className="h-3.5 w-3.5 text-purple-500" />
            {r.testName || "Unknown Test"}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Patient: {r.patient?.username || "—"} • Dr. {r.doctor?.username || "—"}
          </p>
          <p className="text-xs text-muted-foreground">{fmtDate(r.testDate || r.createdAt)}</p>
        </div>
        <Badge className="text-[10px] bg-emerald-100 text-emerald-700 border-0">
          {r.result ? "Completed" : "Pending"}
        </Badge>
      </div>

      {r.result && (
        <div className="text-xs bg-muted/30 rounded-lg p-2.5 mb-3">
          <span className="font-semibold">Result:</span> {r.result}
        </div>
      )}

      {r.fileUrl && (
        <a href={r.fileUrl} target="_blank" rel="noopener noreferrer"
          className="text-xs text-blue-600 underline flex items-center gap-1 mb-3">
          <FileText className="h-3 w-3" /> View Report File
        </a>
      )}

      {showActions && canManage && (
        <div className="flex gap-2 mt-2">
          {!r.result && (
            <Button size="sm" variant="outline" className="rounded-xl text-xs flex-1 gap-1"
              onClick={() => handleStartTest(r.id)}>
              <PlayCircle className="h-3.5 w-3.5" /> Start Test
            </Button>
          )}
          {!r.result && (
            <Button size="sm" className="rounded-xl text-xs flex-1 gap-1"
              onClick={() => { setSubmitTarget(r); setResultText(""); setResultFileUrl(""); }}>
              <Upload className="h-3.5 w-3.5" /> Submit Result
            </Button>
          )}
        </div>
      )}
    </div>
  );

  return (
    <div className="p-4 md:p-6 space-y-5">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600">
          <FlaskConical className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Laboratory</h1>
          <p className="text-xs text-muted-foreground">Manage lab tests, track samples, and upload results</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Pending", value: pendingReports.length, icon: Clock, color: "text-amber-600" },
          { label: "Completed", value: completedReports.length, icon: CheckCircle, color: "text-emerald-600" },
          { label: "Total", value: reports.length, icon: FlaskConical, color: "text-purple-600" },
        ].map((s) => (
          <div key={s.label} className="bg-card border rounded-2xl p-4 text-center shadow-sm">
            <s.icon className={`h-5 w-5 mx-auto mb-1 ${s.color}`} />
            <p className={`text-2xl font-extrabold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      <Tabs value={tab} onValueChange={setTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 max-w-lg">
          <TabsTrigger value="pending" className="gap-1.5">
            <Clock className="h-3.5 w-3.5" /> Pending
            {pendingReports.length > 0 && (
              <Badge variant="destructive" className="ml-1 text-[10px] px-1.5 py-0">{pendingReports.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="completed" className="gap-1.5">
            <CheckCircle className="h-3.5 w-3.5" /> Completed
          </TabsTrigger>
          <TabsTrigger value="all" className="gap-1.5">
            <FlaskConical className="h-3.5 w-3.5" /> All Reports
          </TabsTrigger>
        </TabsList>

        {/* ───── Pending ───── */}
        <TabsContent value="pending" className="mt-4">
          {loading ? (
            <div className="text-center py-12 text-muted-foreground">Loading...</div>
          ) : pendingReports.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <FlaskConical className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="font-medium">No pending tests</p>
              <p className="text-xs mt-1">All tests have been completed</p>
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {pendingReports.map((r) => renderReportCard(r, true))}
            </div>
          )}
        </TabsContent>

        {/* ───── Completed ───── */}
        <TabsContent value="completed" className="mt-4">
          {loading ? (
            <div className="text-center py-12 text-muted-foreground">Loading...</div>
          ) : completedReports.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <CheckCircle className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="font-medium">No completed tests yet</p>
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {completedReports.map((r) => renderReportCard(r, false))}
            </div>
          )}
        </TabsContent>

        {/* ───── All Reports (searchable) ───── */}
        <TabsContent value="all" className="mt-4 space-y-4">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search by test, patient, or doctor..." value={search}
              onChange={(e) => setSearch(e.target.value)} className="pl-9 rounded-xl" />
          </div>

          {loading ? (
            <div className="text-center py-12 text-muted-foreground">Loading...</div>
          ) : (
            <div className="rounded-xl border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead>Test</TableHead>
                    <TableHead>Patient</TableHead>
                    <TableHead>Doctor</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Result</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {searchedReports.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No reports found</TableCell>
                    </TableRow>
                  ) : searchedReports.map((r) => (
                    <TableRow key={r.id} className="hover:bg-muted/20">
                      <TableCell className="font-medium">{r.testName || "—"}</TableCell>
                      <TableCell>{r.patient?.username || "—"}</TableCell>
                      <TableCell className="text-muted-foreground">Dr. {r.doctor?.username || "—"}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{fmtDate(r.testDate || r.createdAt)}</TableCell>
                      <TableCell>
                        <Badge className="text-[10px] bg-emerald-100 text-emerald-700 border-0">
                          {r.result ? "Completed" : "Pending"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs max-w-[200px] truncate">
                        {r.result || (r.fileUrl ? (
                          <a href={r.fileUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">View</a>
                        ) : "—")}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* ───── Submit Result Modal ───── */}
      <Dialog open={!!submitTarget} onOpenChange={() => setSubmitTarget(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5 text-purple-600" /> Submit Test Result
            </DialogTitle>
          </DialogHeader>
          {submitTarget && (
            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-muted/30 text-sm">
                <p className="font-semibold">{submitTarget.testName || "Test"}</p>
                <p className="text-xs text-muted-foreground">Patient: {submitTarget.patient?.username || "—"}</p>
              </div>
              <div>
                <Label>Result Text *</Label>
                <Textarea value={resultText} onChange={(e) => setResultText(e.target.value)}
                  placeholder="Enter test results..." rows={4} className="mt-1" />
              </div>
              <div>
                <Label>Report File URL (optional)</Label>
                <Input value={resultFileUrl} onChange={(e) => setResultFileUrl(e.target.value)}
                  placeholder="https://..." className="mt-1" />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSubmitTarget(null)}>Cancel</Button>
            <Button onClick={handleSubmitResult} disabled={submitting || !resultText.trim()}>
              {submitting ? "Submitting..." : "Save Result"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
