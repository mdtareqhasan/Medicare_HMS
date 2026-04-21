import jsPDF from "jspdf";

interface LabTestSlipData {
  testName: string;
  patientName: string;
  patientAge?: number | null;
  patientGender?: string | null;
  patientPhone?: string | null;
  doctorName: string;
  description?: string | null;
  status: string;
  requestedDate: string;
}

export function exportLabTestSlip(data: LabTestSlipData) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // Header gradient bar
  doc.setFillColor(16, 185, 129);
  doc.rect(0, 0, pageWidth, 38, "F");
  doc.setFillColor(13, 148, 136);
  doc.rect(0, 28, pageWidth, 10, "F");

  // Logo
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text("Medicare", 14, 18);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text("Health Management System", 14, 25);

  // Label
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("LAB TEST SLIP", pageWidth - 14, 18, { align: "right" });
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text(data.requestedDate, pageWidth - 14, 25, { align: "right" });

  let y = 50;

  // Patient Info
  doc.setTextColor(60, 60, 60);
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("PATIENT INFORMATION", 14, y);
  y += 7;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(`Name: ${data.patientName}`, 14, y);
  y += 6;

  const details = [
    data.patientAge ? `Age: ${data.patientAge}` : null,
    data.patientGender ? `Gender: ${data.patientGender}` : null,
    data.patientPhone ? `Phone: ${data.patientPhone}` : null,
  ].filter(Boolean).join("  |  ");
  if (details) {
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text(details, 14, y);
    y += 8;
  }

  // Divider
  doc.setDrawColor(16, 185, 129);
  doc.setLineWidth(0.5);
  doc.line(14, y, pageWidth - 14, y);
  y += 10;

  // Test Details
  doc.setTextColor(60, 60, 60);
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("TEST DETAILS", 14, y);
  y += 8;

  // Test name box
  doc.setFillColor(240, 253, 244);
  doc.roundedRect(14, y, pageWidth - 28, 28, 3, 3, "F");
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(16, 185, 129);
  doc.text(data.testName, pageWidth / 2, y + 12, { align: "center" });
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 100, 100);
  doc.text(`Status: ${data.status.toUpperCase()}`, pageWidth / 2, y + 22, { align: "center" });
  y += 36;

  // Description
  if (data.description) {
    doc.setTextColor(60, 60, 60);
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text("INSTRUCTIONS", 14, y);
    y += 6;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    const lines = doc.splitTextToSize(data.description, pageWidth - 28);
    doc.text(lines, 14, y);
    y += lines.length * 4 + 8;
  }

  // Requesting Doctor
  y += 4;
  doc.setTextColor(60, 60, 60);
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("REQUESTING DOCTOR", 14, y);
  y += 7;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(`Dr. ${data.doctorName}`, 14, y);

  // Footer
  const footerY = doc.internal.pageSize.getHeight() - 20;
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.line(14, footerY, pageWidth - 14, footerY);
  doc.setTextColor(150, 150, 150);
  doc.setFontSize(7);
  doc.text("This is a digitally generated lab test slip from Medicare Health Management System.", pageWidth / 2, footerY + 5, { align: "center" });
  doc.text(`Generated on: ${new Date().toLocaleString()}`, pageWidth / 2, footerY + 10, { align: "center" });

  doc.save(`LabTest_${data.testName.replace(/\s+/g, "_")}_${data.patientName.replace(/\s+/g, "_")}.pdf`);
}
