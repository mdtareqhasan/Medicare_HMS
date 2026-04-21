package com.medicare.hms.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.medicare.hms.dto.PrescriptionResponse;
import com.medicare.hms.entity.*;
import com.medicare.hms.repository.AppointmentRepository;
import com.medicare.hms.repository.LabTestRepository;
import com.medicare.hms.repository.PrescriptionRepository;
import com.medicare.hms.repository.UserRepository;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class PrescriptionService {

    @Autowired
    private PrescriptionRepository prescriptionRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private AppointmentRepository appointmentRepository;

    @Autowired
    private MedicalRecordService medicalRecordService;

    @Autowired
    private LabService labService;

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private LabTestRepository labTestRepository;

    @Autowired
    private ObjectMapper objectMapper;

    @Transactional
    public PrescriptionResponse createPrescription(Long doctorId, Long patientId, String diagnosis,
            List<Map<String, String>> medicines, List<String> labTests,
            String notes) {
        return createPrescriptionWithAppointment(doctorId, patientId, diagnosis, medicines, labTests, notes, null);
    }

    @Transactional
    public PrescriptionResponse createPrescriptionWithAppointment(Long doctorId, Long patientId, String diagnosis,
            List<Map<String, String>> medicines, List<String> labTests,
            String notes, Long appointmentId) {
        try {
            User doctor = userRepository.findById(doctorId)
                    .orElseThrow(() -> new RuntimeException("Doctor not found with ID: " + doctorId));
            User patient = userRepository.findById(patientId)
                    .orElseThrow(() -> new RuntimeException("Patient not found with ID: " + patientId));

            if (diagnosis == null || diagnosis.isBlank()) {
                throw new RuntimeException("Diagnosis is required");
            }

            // Handle appointment linking
            Appointment appointment = null;
            if (appointmentId != null) {
                appointment = appointmentRepository.findById(appointmentId)
                        .orElseThrow(() -> new RuntimeException("Appointment not found with ID: " + appointmentId));
                // Mark appointment as completed
                appointment.setStatus(AppointmentStatus.COMPLETED);
                appointment.setUpdatedAt(LocalDateTime.now());
                appointmentRepository.save(appointment);
            }

            String prescriptionText = medicines == null ? ""
                    : medicines.stream()
                            .filter(m -> m.get("name") != null && !m.get("name").isBlank())
                            .map(m -> {
                                String label = m.get("name").trim();
                                if (m.get("dosage") != null && !m.get("dosage").isBlank()) {
                                    label += " - " + m.get("dosage").trim();
                                }
                                if (m.get("duration") != null && !m.get("duration").isBlank()) {
                                    label += " - " + m.get("duration").trim();
                                }
                                return label;
                            })
                            .collect(Collectors.joining("; "));

            // 1) medical record
            medicalRecordService.createMedicalRecord(appointment, doctor, patient,
                    diagnosis, prescriptionText, notes == null ? "" : notes);

            // 2) prescription entry (JSON field + status)
            Prescription prescription = new Prescription();
            prescription.setDoctor(doctor);
            prescription.setPatient(patient);
            prescription.setAppointment(appointment);
            String medicinesJson;
            try {
                medicinesJson = objectMapper.writeValueAsString(medicines == null ? new ArrayList<>() : medicines);
            } catch (JsonProcessingException e) {
                medicinesJson = "[]";
            }
            prescription.setMedicines(medicinesJson);
            prescription.setNotes(notes == null ? "" : notes);
            prescription.setStatus(PrescriptionStatus.PENDING);
            prescription.setCreatedAt(LocalDateTime.now());
            prescription.setUpdatedAt(LocalDateTime.now());
            Prescription savedPrescription = prescriptionRepository.save(prescription);

            // 3) lab tests
            int addedLabTests = 0;
            if (labTests != null && !labTests.isEmpty()) {
                for (String testName : labTests.stream().filter(s -> s != null && !s.isBlank())
                        .collect(Collectors.toList())) {
                    try {
                        System.out.println("[PrescriptionService] Processing lab test: " + testName);
                        LabTest labTest = labTestRepository.findByTestNameIgnoreCase(testName.trim())
                                .orElseGet(() -> {
                                    LabTest created = new LabTest();
                                    created.setTestName(testName.trim());
                                    created.setDescription("Prescribed from doctor");
                                    created.setCost(java.math.BigDecimal.ZERO);
                                    return labTestRepository.save(created);
                                });
                        System.out.println("[PrescriptionService] Found/created LabTest id: " + labTest.getId() + ", name: " + labTest.getTestName());
                        TestReport report = labService.prescribeTest(labTest.getId(), doctor.getId(), patient.getId());
                        System.out.println("[PrescriptionService] Created TestReport id: " + report.getId() + " for patient: " + patient.getUsername());
                        addedLabTests++;
                    } catch (Exception e) {
                        System.err.println(
                                "[PrescriptionService] Failed to prescribe test '" + testName + "': " + e.getMessage());
                        e.printStackTrace();
                    }
                }
            }
            System.out.println("[PrescriptionService] Total lab tests added: " + addedLabTests);

            // 4) notification
            String msgCount = String.format("Your doctor has prescribed %d medicine(s) and %d lab test(s).",
                    medicines == null ? 0 : medicines.size(), addedLabTests);
            try {
                notificationService.createNotification(patient.getUsername(), "New Prescription", msgCount,
                        "prescription", "/dashboard");
            } catch (Exception e) {
                System.err.println("[PrescriptionService] Failed to create notification: " + e.getMessage());
            }

            // Build response with labTests
            PrescriptionResponse response = new PrescriptionResponse(savedPrescription.getId(), patient.getId(), doctor.getId(),
                    doctor.getUsername(),
                    savedPrescription.getMedicines(), savedPrescription.getNotes(),
                    savedPrescription.getStatus().name(),
                    appointmentId, savedPrescription.getCreatedAt(), savedPrescription.getUpdatedAt());
            try {
                List<String> rxLabTests = labTests != null ? labTests : new ArrayList<>();
                response.labTests = rxLabTests;
            } catch (Exception e) {
                response.labTests = new ArrayList<>();
            }
            return response;
        } catch (Exception e) {
            System.err.println("[PrescriptionService] Critical error creating prescription: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Failed to create prescription: " + e.getMessage(), e);
        }
    }

    public List<PrescriptionResponse> listPrescriptionsForPatient(Long patientId) {
        try {
            User patient = userRepository.findById(patientId)
                    .orElseThrow(() -> new RuntimeException("Patient not found with ID: " + patientId));
            return prescriptionRepository.findByPatient(patient).stream().map(this::toResponse)
                    .collect(Collectors.toList());
        } catch (Exception e) {
            System.err.println("[PrescriptionService] Error fetching prescriptions for patient " + patientId + ": "
                    + e.getMessage());
            throw new RuntimeException("Failed to fetch prescriptions: " + e.getMessage(), e);
        }
    }

    public List<PrescriptionResponse> listPendingPrescriptions() {
        return prescriptionRepository.findByStatus(PrescriptionStatus.PENDING).stream().map(this::toResponse)
                .collect(Collectors.toList());
    }

    public PrescriptionResponse dispensePrescription(Long prescriptionId) {
        Prescription prescription = prescriptionRepository.findById(prescriptionId)
                .orElseThrow(() -> new RuntimeException("Prescription not found"));
        prescription.setStatus(PrescriptionStatus.DISPENSED);
        prescription.setUpdatedAt(LocalDateTime.now());
        prescriptionRepository.save(prescription);

        notificationService.createNotification(prescription.getPatient().getUsername(), "Prescription Dispensed",
                "Your prescription has been dispensed by pharmacy.", "prescription", "/dashboard");

        return toResponse(prescription);
    }

    public List<PrescriptionResponse> listDispensedPrescriptions() {
        return prescriptionRepository.findByStatus(PrescriptionStatus.DISPENSED).stream().map(this::toResponse)
                .collect(Collectors.toList());
    }

    public List<PrescriptionResponse> listPrescriptionsForDoctor(Long doctorId) {
        User doctor = userRepository.findById(doctorId).orElseThrow(() -> new RuntimeException("Doctor not found"));
        return prescriptionRepository.findByDoctor(doctor).stream().map(this::toResponse)
                .collect(Collectors.toList());
    }

    private PrescriptionResponse toResponse(Prescription prescription) {
        Long appointmentId = prescription.getAppointment() != null ? prescription.getAppointment().getId() : null;
        PrescriptionResponse response = new PrescriptionResponse(prescription.getId(), prescription.getPatient().getId(),
                prescription.getDoctor().getId(), prescription.getDoctor().getUsername(), prescription.getMedicines(),
                prescription.getNotes(),
                prescription.getStatus().name(), appointmentId, prescription.getCreatedAt(),
                prescription.getUpdatedAt());
        response.labTests = new ArrayList<>();
        return response;
    }
}
