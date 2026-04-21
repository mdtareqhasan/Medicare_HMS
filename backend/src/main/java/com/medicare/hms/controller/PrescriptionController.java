package com.medicare.hms.controller;

import com.medicare.hms.dto.PrescriptionRequest;
import com.medicare.hms.dto.PrescriptionResponse;
import com.medicare.hms.security.UserDetailsImpl;
import com.medicare.hms.service.PrescriptionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/prescriptions")
public class PrescriptionController {

    @Autowired
    private PrescriptionService prescriptionService;

    @PostMapping
    @PreAuthorize("hasAnyRole('DOCTOR','ADMIN')")
    public ResponseEntity<PrescriptionResponse> createPrescription(
            @RequestBody PrescriptionRequest request,
            @AuthenticationPrincipal UserDetailsImpl currentUser) {

        if (request == null || request.patientId == null || request.diagnosis == null || request.diagnosis.isBlank()) {
            return ResponseEntity.badRequest().build();
        }

        long doctorId = currentUser.getId();
        PrescriptionResponse response = prescriptionService.createPrescriptionWithAppointment(doctorId,
                request.patientId,
                request.diagnosis, request.medicines, request.labTests, request.notes, request.appointmentId);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/patient/{patientId}")
    @PreAuthorize("hasAnyRole('ADMIN','DOCTOR','PHARMACIST','LAB_TECHNICIAN','PATIENT')")
    public ResponseEntity<List<PrescriptionResponse>> getPatientPrescriptions(
            @PathVariable Long patientId,
            @AuthenticationPrincipal UserDetailsImpl currentUser) {
        // doctor/admin/pharmacist can see all; patient only own
        if (currentUser.getAuthorities().stream().noneMatch(a -> a.getAuthority().equals("ROLE_ADMIN")
                || a.getAuthority().equals("ROLE_DOCTOR")
                || a.getAuthority().equals("ROLE_PHARMACIST")
                || a.getAuthority().equals("ROLE_LAB_TECHNICIAN"))) {
            if (!currentUser.getId().equals(patientId)) {
                return ResponseEntity.status(403).build();
            }
        }
        List<PrescriptionResponse> list = prescriptionService.listPrescriptionsForPatient(patientId);
        return ResponseEntity.ok(list);
    }

    @GetMapping("/pending")
    @PreAuthorize("hasAnyRole('ADMIN','PHARMACIST')")
    public ResponseEntity<List<PrescriptionResponse>> getPendingPrescriptions() {
        return ResponseEntity.ok(prescriptionService.listPendingPrescriptions());
    }

    @PutMapping("/{id}/dispense")
    @PreAuthorize("hasAnyRole('ADMIN','PHARMACIST')")
    public ResponseEntity<PrescriptionResponse> dispensePrescription(@PathVariable Long id) {
        PrescriptionResponse response = prescriptionService.dispensePrescription(id);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/doctor")
    @PreAuthorize("hasAnyRole('ADMIN','DOCTOR')")
    public ResponseEntity<List<PrescriptionResponse>> getDoctorPrescriptions(
            @AuthenticationPrincipal UserDetailsImpl currentUser) {
        return ResponseEntity.ok(prescriptionService.listPrescriptionsForDoctor(currentUser.getId()));
    }

    @GetMapping("/dispensed")
    @PreAuthorize("hasAnyRole('ADMIN','PHARMACIST')")
    public ResponseEntity<List<PrescriptionResponse>> getDispensedPrescriptions() {
        return ResponseEntity.ok(prescriptionService.listDispensedPrescriptions());
    }
}
