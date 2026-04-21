package com.medicare.hms.controller;

import com.medicare.hms.dto.MedicalRecordResponse;
import com.medicare.hms.entity.Appointment;
import com.medicare.hms.entity.AppointmentStatus;
import com.medicare.hms.entity.MedicalRecord;
import com.medicare.hms.entity.User;
import com.medicare.hms.entity.UserRole;
import com.medicare.hms.repository.AppointmentRepository;
import com.medicare.hms.repository.UserRepository;
import com.medicare.hms.security.UserDetailsImpl;
import com.medicare.hms.service.MedicalRecordService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/medical-records")
public class MedicalRecordController {

        @Autowired
        private MedicalRecordService medicalRecordService;

        @Autowired
        private UserRepository userRepository;

        @Autowired
        private AppointmentRepository appointmentRepository;

        @GetMapping("/patient/{patientId}")
        @PreAuthorize("hasAnyRole('ADMIN','DOCTOR','NURSE','PATIENT')")
        public ResponseEntity<List<MedicalRecordResponse>> getPatientRecords(
                        @PathVariable Long patientId,
                        @AuthenticationPrincipal UserDetailsImpl currentUser) {

                User current = userRepository.findByUsername(currentUser.getUsername())
                                .orElseThrow(() -> new RuntimeException("User not found"));

                // Check authorization: only patient's own records, patient's doctors, or admin
                if (current.getRole() == UserRole.PATIENT && !current.getId().equals(patientId)) {
                        return ResponseEntity.status(403).build();
                }

                if (current.getRole() == UserRole.DOCTOR) {
                        // Doctor can only see their own patients' records
                        List<Appointment> doctorAppointments = appointmentRepository.findByDoctor(current);
                        boolean canViewRecord = doctorAppointments.stream()
                                        .anyMatch(a -> a.getPatient().getId().equals(patientId));
                        if (!canViewRecord) {
                                return ResponseEntity.status(403).build();
                        }
                }

                User patient = userRepository.findById(patientId)
                                .orElseThrow(() -> new RuntimeException("Patient not found"));

                List<MedicalRecord> records = medicalRecordService.getMedicalRecordsForPatient(patient);

                List<MedicalRecordResponse> response = records.stream().map(r -> new MedicalRecordResponse(
                                r.getId(),
                                r.getAppointment() != null ? r.getAppointment().getId() : null,
                                r.getDoctor().getId(),
                                r.getDoctor().getUsername(),
                                r.getPatient().getId(),
                                r.getPatient().getUsername(),
                                r.getDiagnosis(),
                                r.getPrescription(),
                                r.getNotes(),
                                r.getRecordDate(),
                                r.getCreatedAt(),
                                r.getUpdatedAt())).collect(Collectors.toList());

                return ResponseEntity.ok(response);
        }

        @GetMapping("/doctor/{doctorId}")
        @PreAuthorize("hasAnyRole('ADMIN','DOCTOR','NURSE')")
        public ResponseEntity<List<MedicalRecordResponse>> getDoctorRecords(
                        @PathVariable Long doctorId,
                        @AuthenticationPrincipal UserDetailsImpl currentUser) {

                User current = userRepository.findByUsername(currentUser.getUsername())
                                .orElseThrow(() -> new RuntimeException("User not found"));

                if (current.getRole() == UserRole.DOCTOR && !current.getId().equals(doctorId)) {
                        return ResponseEntity.status(403).build();
                }

                User doctor = userRepository.findById(doctorId)
                                .orElseThrow(() -> new RuntimeException("Doctor not found"));

                List<MedicalRecord> records = medicalRecordService.getMedicalRecordsForDoctor(doctor);

                List<MedicalRecordResponse> response = records.stream().map(r -> new MedicalRecordResponse(
                                r.getId(),
                                r.getAppointment() != null ? r.getAppointment().getId() : null,
                                r.getDoctor().getId(),
                                r.getDoctor().getUsername(),
                                r.getPatient().getId(),
                                r.getPatient().getUsername(),
                                r.getDiagnosis(),
                                r.getPrescription(),
                                r.getNotes(),
                                r.getRecordDate(),
                                r.getCreatedAt(),
                                r.getUpdatedAt())).collect(Collectors.toList());

                return ResponseEntity.ok(response);
        }

        public static class MedicalRecordRequest {
                public Long patientId;
                public Long appointmentId;
                public String diagnosis;
                public String prescription;
                public String notes;
        }

        @PostMapping
        @PreAuthorize("hasAnyRole('ADMIN','DOCTOR')")
        public ResponseEntity<MedicalRecordResponse> createMedicalRecord(
                        @RequestBody MedicalRecordRequest request,
                        @AuthenticationPrincipal UserDetailsImpl currentUser) {

                if (request.patientId == null || request.diagnosis == null || request.diagnosis.isBlank()) {
                        return ResponseEntity.badRequest().build();
                }

                User doctor = userRepository.findByUsername(currentUser.getUsername())
                                .orElseThrow(() -> new RuntimeException("User not found"));

                if (doctor.getRole() != UserRole.DOCTOR && doctor.getRole() != UserRole.ADMIN) {
                        return ResponseEntity.status(403).build();
                }

                User patient = userRepository.findById(request.patientId)
                                .orElseThrow(() -> new RuntimeException("Patient not found"));

                Appointment appointment = null;
                if (request.appointmentId != null) {
                        appointment = appointmentRepository.findById(request.appointmentId)
                                        .orElseThrow(() -> new RuntimeException("Appointment not found"));

                        if (!appointment.getDoctor().getId().equals(doctor.getId())
                                        && doctor.getRole() != UserRole.ADMIN) {
                                return ResponseEntity.status(403).build();
                        }

                        if (!appointment.getPatient().getId().equals(patient.getId())) {
                                return ResponseEntity.badRequest().body(null);
                        }
                        appointment.setStatus(AppointmentStatus.COMPLETED);
                        appointment.setUpdatedAt(LocalDateTime.now());
                        appointmentRepository.save(appointment);
                }

                MedicalRecord record = medicalRecordService.createMedicalRecord(
                                appointment,
                                doctor,
                                patient,
                                request.diagnosis,
                                request.prescription == null ? "" : request.prescription,
                                request.notes == null ? "" : request.notes);

                MedicalRecordResponse responseBody = new MedicalRecordResponse(
                                record.getId(),
                                record.getAppointment() != null ? record.getAppointment().getId() : null,
                                doctor.getId(),
                                doctor.getUsername(),
                                patient.getId(),
                                patient.getUsername(),
                                record.getDiagnosis(),
                                record.getPrescription(),
                                record.getNotes(),
                                record.getRecordDate(),
                                record.getCreatedAt(),
                                record.getUpdatedAt());

                return ResponseEntity.ok(responseBody);
        }
}
