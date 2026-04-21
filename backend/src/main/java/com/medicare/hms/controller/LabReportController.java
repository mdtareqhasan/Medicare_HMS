package com.medicare.hms.controller;

import com.medicare.hms.entity.LabReport;
import com.medicare.hms.entity.User;
import com.medicare.hms.repository.LabReportRepository;
import com.medicare.hms.repository.UserRepository;
import com.medicare.hms.security.UserDetailsImpl;
import com.medicare.hms.service.CloudinaryService;
import com.medicare.hms.service.LabService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDate;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/lab")
public class LabReportController {

    @Autowired
    private LabReportRepository labReportRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private LabService labService;

    @Autowired
    private CloudinaryService cloudinaryService;

    /**
     * Lab technician uploads a report for a patient.
     * File is stored in Cloudinary and URL saved in lab_reports.file_path.
     */
    @PostMapping("/reports")
    @PreAuthorize("hasRole('LAB_TECHNICIAN')")
    public ResponseEntity<?> uploadReport(
            @AuthenticationPrincipal UserDetailsImpl currentUser,
            @RequestParam("file") MultipartFile file,
            @RequestParam("patientId") Long patientId,
            @RequestParam("testName") String testName) {
        if (file == null || file.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "No file provided"));
        }
        String contentType = file.getContentType();
        if (contentType == null ||
                !(contentType.startsWith("image/") || "application/pdf".equals(contentType))) {
            return ResponseEntity.badRequest().body(Map.of("error", "Only images and PDFs are allowed"));
        }

        Optional<User> patientOpt = userRepository.findById(patientId);
        if (patientOpt.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid patient ID"));
        }

        try {
            String url = cloudinaryService.uploadFile(file, "lab_reports");
            LabReport report = new LabReport();
            report.setPatient(patientOpt.get());
            // Get current user as doctor, must exist
            User doctor = userRepository.findById(currentUser.getId())
                    .orElseThrow(() -> new RuntimeException("Doctor not found"));
            report.setDoctor(doctor);
            report.setTestName(testName);
            report.setFileUrl(url);
            report.setTestDate(LocalDate.now());
            labReportRepository.save(report);
            return ResponseEntity.ok(report);
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Report upload failed"));
        }
    }

    /**
     * Get all lab reports for a specific patient.
     */
    @GetMapping("/reports/patient/{patientId}")
    @PreAuthorize("hasAnyRole('ADMIN','DOCTOR','PATIENT','LAB_TECHNICIAN')")
    public ResponseEntity<?> getPatientReports(
            @PathVariable Long patientId,
            @AuthenticationPrincipal UserDetailsImpl currentUser) {
        try {
            // Check authorization: patients can only see their own, others need proper role
            User current = userRepository.findById(currentUser.getId())
                    .orElseThrow(() -> new RuntimeException("Current user not found"));

            if (current.getRole().name().equals("PATIENT") && !current.getId().equals(patientId)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("error", "You can only view your own lab reports"));
            }

            return ResponseEntity.ok(labService.getLabReportsForPatient(patientId));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            System.err.println("[LabReportController] Error fetching patient lab reports: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to fetch lab reports: " + e.getMessage()));
        }
    }

    /**
     * Get all lab reports for a specific doctor.
     */
    @GetMapping("/reports/doctor/{doctorId}")
    @PreAuthorize("hasAnyRole('ADMIN','DOCTOR','LAB_TECHNICIAN')")
    public ResponseEntity<?> getDoctorReports(
            @PathVariable Long doctorId) {
        try {
            return ResponseEntity.ok(labService.getLabReportsForDoctor(doctorId));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            System.err.println("[LabReportController] Error fetching doctor lab reports: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to fetch lab reports: " + e.getMessage()));
        }
    }

    /**
     * Get all pending lab reports.
     */
    @GetMapping("/reports/pending")
    @PreAuthorize("hasAnyRole('ADMIN','LAB_TECHNICIAN','DOCTOR')")
    public ResponseEntity<?> getPendingReports() {
        try {
            return ResponseEntity.ok(labService.getPendingReports());
        } catch (Exception e) {
            System.err.println("[LabReportController] Error fetching pending lab reports: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to fetch pending reports: " + e.getMessage()));
        }
    }

    /**
     * Get all lab reports (admin view for pharmacy & lab management).
     */
    @GetMapping("/reports/all")
    @PreAuthorize("hasAnyRole('ADMIN','LAB_TECHNICIAN','PHARMACIST')")
    public ResponseEntity<?> getAllReports() {
        try {
            System.out.println("[LabReportController] getAllReports called");
            var reports = labService.getAllReports();
            System.out.println("[LabReportController] Found " + reports.size() + " reports");
            return ResponseEntity.ok(reports);
        } catch (Exception e) {
            System.err.println("[LabReportController] Error fetching all lab reports: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to fetch all reports: " + e.getMessage()));
        }
    }

    /**
     * Lab technician marks a test as in-progress.
     */
    @PutMapping("/reports/{reportId}/start")
    @PreAuthorize("hasRole('LAB_TECHNICIAN')")
    public ResponseEntity<?> startTest(@PathVariable Long reportId) {
        try {
            return ResponseEntity.ok(labService.startTest(reportId));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            System.err.println("[LabReportController] Error starting test: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to start test: " + e.getMessage()));
        }
    }

    /**
     * Lab technician submits test results.
     */
    @PutMapping("/reports/{reportId}/submit")
    @PreAuthorize("hasRole('LAB_TECHNICIAN')")
    public ResponseEntity<?> submitResult(
            @PathVariable Long reportId,
            @RequestBody Map<String, String> payload) {
        try {
            String result = payload.get("result");
            String fileUrl = payload.get("fileUrl");
            return ResponseEntity.ok(labService.submitResult(reportId, result, fileUrl));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            System.err.println("[LabReportController] Error submitting result: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to submit result: " + e.getMessage()));
        }
    }

    /**
     * Get all lab tests.
     */
    @GetMapping("/tests/all")
    @PreAuthorize("hasAnyRole('ADMIN','LAB_TECHNICIAN','DOCTOR')")
    public ResponseEntity<?> getAllLabTests() {
        try {
            return ResponseEntity.ok(labService.getAllLabTests());
        } catch (Exception e) {
            System.err.println("[LabReportController] Error fetching lab tests: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to fetch lab tests: " + e.getMessage()));
        }
    }

    /**
     * Get lab reports by status (for admin filtering).
     */
    @GetMapping("/reports/status/{status}")
    @PreAuthorize("hasAnyRole('ADMIN','LAB_TECHNICIAN','PHARMACIST')")
    public ResponseEntity<?> getReportsByStatus(@PathVariable String status) {
        try {
            return ResponseEntity.ok(labService.getReportsByStatus(status));
        } catch (Exception e) {
            System.err.println("[LabReportController] Error fetching reports by status: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to fetch reports: " + e.getMessage()));
        }
    }
}