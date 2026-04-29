import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface ExportPrescriptionData {
  patientName: string;
  patientAge?: number | null;
  patientGender?: string | null;
  patientPhone?: string | null;
  patientBloodGroup?: string | null;
  doctorName: string;
  doctorSpecialization?: string;
  diagnosis?: string;
  medicines: {
    name: string;
    dosage?: string;
    duration?: string;
    instructions?: string;
  }[];
  labTests?: string[];
  notes?: string;
  date: string;
}

export function exportPrescriptionPdf(data: ExportPrescriptionData) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // Header gradient bar
  doc.setFillColor(16, 185, 129); // emerald-500
  doc.rect(0, 0, pageWidth, 38, "F");
  doc.setFillColor(13, 148, 136); // teal-600 overlay
  doc.rect(0, 28, pageWidth, 10, "F");

  // Logo text
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text("Medicare Cure Hub", 14, 18);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text("Hospital Management System", 14, 25);

  // Prescription label
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("PRESCRIPTION", pageWidth - 14, 18, { align: "right" });
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text(data.date, pageWidth - 14, 25, { align: "right" });

  let y = 48;

  // Patient & Doctor info side by side
  doc.setTextColor(60, 60, 60);
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("PATIENT INFORMATION", 14, y);
  doc.text("DOCTOR INFORMATION", pageWidth / 2 + 10, y);
  y += 6;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(data.patientName || "N/A", 14, y);
  doc.text(`Dr. ${data.doctorName}`, pageWidth / 2 + 10, y);
  y += 5;

  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  const patientDetails = [
    data.patientAge ? `Age: ${data.patientAge}` : null,
    data.patientGender ? `Gender: ${data.patientGender}` : null,
    data.patientBloodGroup ? `Blood: ${data.patientBloodGroup}` : null,
  ].filter(Boolean).join(" | ");
  if (patientDetails) doc.text(patientDetails, 14, y);
  if (data.doctorSpecialization) doc.text(data.doctorSpecialization, pageWidth / 2 + 10, y);
  y += 5;

  if (data.patientPhone) {
    doc.text(`Phone: ${data.patientPhone}`, 14, y);
    y += 5;
  }

  // Divider
  y += 3;
  doc.setDrawColor(16, 185, 129);
  doc.setLineWidth(0.5);
  doc.line(14, y, pageWidth - 14, y);
  y += 8;

  // Diagnosis
  if (data.diagnosis) {
    doc.setTextColor(60, 60, 60);
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text("DIAGNOSIS", 14, y);
    y += 5;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(data.diagnosis, 14, y);
    y += 8;
  }

  // Medicines table
  if (data.medicines.length > 0) {
    doc.setTextColor(60, 60, 60);
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text("PRESCRIBED MEDICINES", 14, y);
    y += 3;

    autoTable(doc, {
      startY: y,
      head: [["#", "Medicine", "Dosage", "Duration", "Instructions"]],
      body: data.medicines.map((m, i) => [
        String(i + 1),
        m.name || "",
        m.dosage || "",
        m.duration || "",
        m.instructions || "",
      ]),
      theme: "grid",
      headStyles: {
        fillColor: [16, 185, 129],
        textColor: [255, 255, 255],
        fontSize: 8,
        fontStyle: "bold",
      },
      bodyStyles: { fontSize: 9, textColor: [60, 60, 60] },
      columnStyles: {
        0: { cellWidth: 10 },
        1: { cellWidth: 45 },
        2: { cellWidth: 30 },
        3: { cellWidth: 30 },
        4: { cellWidth: "auto" },
      },
      margin: { left: 14, right: 14 },
    });

    y = (doc as any).lastAutoTable.finalY + 8;
  }

  // Lab Tests
  if (data.labTests && data.labTests.length > 0) {
    doc.setTextColor(60, 60, 60);
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text("RECOMMENDED LAB TESTS", 14, y);
    y += 3;

    autoTable(doc, {
      startY: y,
      head: [["#", "Test Name"]],
      body: data.labTests.map((t, i) => [String(i + 1), t]),
      theme: "grid",
      headStyles: {
        fillColor: [147, 51, 234],
        textColor: [255, 255, 255],
        fontSize: 8,
        fontStyle: "bold",
      },
      bodyStyles: { fontSize: 9, textColor: [60, 60, 60] },
      columnStyles: { 0: { cellWidth: 10 } },
      margin: { left: 14, right: 14 },
    });

    y = (doc as any).lastAutoTable.finalY + 8;
  }

  // Notes
  if (data.notes) {
    doc.setTextColor(60, 60, 60);
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text("NOTES", 14, y);
    y += 5;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    const noteLines = doc.splitTextToSize(data.notes, pageWidth - 28);
    doc.text(noteLines, 14, y);
    y += noteLines.length * 4 + 8;
  }

  // Footer
  const footerY = doc.internal.pageSize.getHeight() - 20;
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.line(14, footerY, pageWidth - 14, footerY);
  doc.setTextColor(150, 150, 150);
  doc.setFontSize(7);
  doc.text("This is a digitally generated prescription from Medicare Cure Hub.", pageWidth / 2, footerY + 5, { align: "center" });
  doc.text(`Generated on: ${new Date().toLocaleString()}`, pageWidth / 2, footerY + 10, { align: "center" });

  doc.save(`Prescription_${data.patientName.replace(/\s+/g, "_")}_${data.date.replace(/\s+/g, "_")}.pdf`);
}
