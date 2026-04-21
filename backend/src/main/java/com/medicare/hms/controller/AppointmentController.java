package com.medicare.hms.controller;

import com.medicare.hms.dto.AppointmentRequest;
import com.medicare.hms.entity.Appointment;
import com.medicare.hms.entity.AppointmentStatus;
import com.medicare.hms.entity.User;
import com.medicare.hms.repository.UserRepository;
import com.medicare.hms.security.UserDetailsImpl;
import com.medicare.hms.service.AppointmentService;
import com.medicare.hms.dto.AppointmentResponse;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/appointments")
@CrossOrigin
public class AppointmentController {

    @Autowired
    private AppointmentService appointmentService;

    @Autowired
    private UserRepository userRepository;

    // All roles: Get filtered appointments
    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<AppointmentResponse>> getAppointments(
            @AuthenticationPrincipal UserDetailsImpl currentUser) {
        List<Appointment> appointments = appointmentService.getAppointments(currentUser);
        return ResponseEntity.ok(toDtoList(appointments));
    }

    // Create appointment (book new)
    @PostMapping
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN','ROLE_DOCTOR','ROLE_NURSE','ROLE_PATIENT')")
    public ResponseEntity<?> createAppointment(
            @Valid @RequestBody AppointmentRequest request,
            @AuthenticationPrincipal UserDetailsImpl currentUser) {
        try {
            Long patientId = request.getPatientId();
            if (currentUser.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_PATIENT"))) {
                patientId = currentUser.getId();
            }

            Appointment appointment = appointmentService.bookAppointment(request.getDoctorId(), patientId,
                    request.getAppointmentDate(), request.getNotes(), currentUser);

            return ResponseEntity.status(HttpStatus.CREATED).body(toDto(appointment));
        } catch (RuntimeException e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    // Patient/Doctor/Admin: Book an appointment
    @PostMapping("/book")
    @PreAuthorize("hasAnyAuthority('ROLE_PATIENT','ROLE_DOCTOR','ROLE_ADMIN')")
    public ResponseEntity<?> bookAppointment(
            @Valid @RequestBody AppointmentRequest request,
            @AuthenticationPrincipal UserDetailsImpl currentUser) {
        try {
            Appointment appointment = appointmentService.bookAppointment(
                    request.getDoctorId(),
                    request.getPatientId(),
                    request.getAppointmentDate(),
                    request.getNotes(),
                    currentUser);
            return ResponseEntity.status(HttpStatus.CREATED).body(toDto(appointment));
        } catch (RuntimeException e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    private AppointmentResponse toDto(Appointment appointment) {
        return new AppointmentResponse(
                appointment.getId(),
                appointment.getPatient().getId(),
                appointment.getPatient().getUsername(),
                appointment.getDoctor().getId(),
                appointment.getDoctor().getUsername(),
                appointment.getAppointmentDate(),
                appointment.getStatus().name().toLowerCase(),
                appointment.getNotes(),
                appointment.getCreatedAt());
    }

    private List<AppointmentResponse> toDtoList(List<Appointment> appointments) {
        return appointments.stream().map(this::toDto).toList();
    }

    // Patient: Get my appointments
    @GetMapping("/my")
    @PreAuthorize("hasAuthority('ROLE_PATIENT')")
    public ResponseEntity<List<AppointmentResponse>> getMyAppointments(
            @AuthenticationPrincipal UserDetailsImpl currentUser) {
        List<Appointment> appointments = appointmentService.getPatientAppointments();
        return ResponseEntity.ok(toDtoList(appointments));
    }

    // Doctor: Get my schedule
    @GetMapping("/doctor/{doctorId}")
    @PreAuthorize("hasAnyAuthority('ROLE_DOCTOR','ROLE_ADMIN','ROLE_PATIENT','ROLE_NURSE')")
    public ResponseEntity<List<AppointmentResponse>> getDoctorSchedule(
            @PathVariable Long doctorId,
            @AuthenticationPrincipal UserDetailsImpl currentUser) {
        List<Appointment> appointments = appointmentService.getDoctorSchedule(doctorId);
        return ResponseEntity.ok(toDtoList(appointments));
    }

    // Get appointments for specific patient (admins/doctors/nurses can see others,
    // patient sees own via their own endpoint)
    @GetMapping("/patient/{patientId}")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN','ROLE_DOCTOR','ROLE_NURSE','ROLE_PATIENT')")
    public ResponseEntity<List<AppointmentResponse>> getPatientAppointmentsById(
            @PathVariable Long patientId,
            @AuthenticationPrincipal UserDetailsImpl currentUser) {
        // if patient is requesting another patient data, only allow admin/doctor/nurse
        if (currentUser.getAuthorities().stream().noneMatch(auth -> auth.getAuthority().equals("ROLE_ADMIN")
                || auth.getAuthority().equals("ROLE_DOCTOR") || auth.getAuthority().equals("ROLE_NURSE"))) {
            if (!currentUser.getId().equals(patientId)) {
                return ResponseEntity.status(403).build();
            }
        }

        List<Appointment> appointments = appointmentService.getPatientAppointments(patientId);
        return ResponseEntity.ok(toDtoList(appointments));
    }

    // Admin: Get all appointments
    @GetMapping("/all")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<List<AppointmentResponse>> getAllAppointments(
            @AuthenticationPrincipal UserDetailsImpl currentUser) {
        List<Appointment> appointments = appointmentService.getAllAppointments();
        return ResponseEntity.ok(toDtoList(appointments));
    }

    // Admin/Doctor/Patient: Update appointment status
    @PutMapping("/{appointmentId}/status")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN','ROLE_DOCTOR','ROLE_PATIENT')")
    public ResponseEntity<?> updateAppointmentStatus(
            @PathVariable Long appointmentId,
            @RequestParam AppointmentStatus status,
            @AuthenticationPrincipal UserDetailsImpl currentUser) {
        try {
            Appointment appointment = appointmentService.updateAppointmentStatus(appointmentId, status);
            return ResponseEntity.ok(toDto(appointment));
        } catch (RuntimeException e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    // Admin/Doctor/Patient: Reschedule appointment
    @PatchMapping("/{appointmentId}/reschedule")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> rescheduleAppointment(
            @PathVariable Long appointmentId,
            @Valid @RequestBody Map<String, String> body,
            @AuthenticationPrincipal UserDetailsImpl currentUser) {
        try {
            String newDate = body.get("new_date");
            if (newDate == null || newDate.isBlank()) {
                throw new RuntimeException("new_date is required");
            }
            Appointment appointment = appointmentService.rescheduleAppointment(appointmentId,
                    LocalDateTime.parse(newDate));
            return ResponseEntity.ok(toDto(appointment));
        } catch (RuntimeException e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    // Doctor only: Complete appointment and save medical record (PATCH preferred)
    @PatchMapping("/{appointmentId}/complete")
    @PreAuthorize("hasAuthority('ROLE_DOCTOR')")
    public ResponseEntity<?> completeAppointment(
            @PathVariable Long appointmentId,
            @Valid @RequestBody Map<String, String> body,
            @AuthenticationPrincipal UserDetailsImpl currentUser) {
        try {
            String diagnosis = body.getOrDefault("diagnosis", "");
            String prescription = body.getOrDefault("prescription", "");
            String notes = body.getOrDefault("notes", "");
            String followUpDate = body.getOrDefault("follow_up_date", "");

            Appointment appointment = appointmentService.completeAppointment(appointmentId, diagnosis,
                    prescription, notes, followUpDate);
            return ResponseEntity.ok(toDto(appointment));
        } catch (RuntimeException e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    // Alias endpoint to support legacy client that sends POST for completion
    @PostMapping("/{appointmentId}/complete")
    @PreAuthorize("hasRole('DOCTOR')")
    public ResponseEntity<?> completeAppointmentViaPost(
            @PathVariable Long appointmentId,
            @Valid @RequestBody Map<String, String> body,
            @AuthenticationPrincipal UserDetailsImpl currentUser) {
        return completeAppointment(appointmentId, body, currentUser);
    }

    // Doctor availability slots for a given date
    @GetMapping("/doctor/{doctorId}/slots")
    @PreAuthorize("hasRole('DOCTOR') or hasRole('ADMIN') or hasRole('PATIENT')")
    public ResponseEntity<?> getDoctorSlots(@PathVariable Long doctorId, @RequestParam String date) {
        try {
            LocalDate parsedDate = LocalDate.parse(date);
            return ResponseEntity.ok(appointmentService.getAvailableSlots(doctorId, parsedDate));
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    // Patient/Doctor/Admin: Cancel appointment
    @PatchMapping("/{appointmentId}/cancel")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> cancelAppointment(
            @PathVariable Long appointmentId,
            @AuthenticationPrincipal UserDetailsImpl currentUser) {
        try {
            User currentUserEntity = userRepository.findByUsername(currentUser.getUsername())
                    .orElseThrow(() -> new RuntimeException("User not found"));
            Appointment appointment = appointmentService.cancelAppointment(appointmentId, currentUserEntity);
            return ResponseEntity.ok(toDto(appointment));
        } catch (RuntimeException e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }
}