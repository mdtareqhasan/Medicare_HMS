package com.medicare.hms.controller;

import com.medicare.hms.dto.DashboardStats;
import com.medicare.hms.dto.SignupRequest;
import com.medicare.hms.dto.UserProfileResponse;
import com.medicare.hms.dto.UserResponse;
import com.medicare.hms.dto.PublicDoctorProfileResponse;
import com.medicare.hms.entity.Gender;
import com.medicare.hms.entity.Profile;
import com.medicare.hms.entity.User;
import com.medicare.hms.entity.UserRole;
import com.medicare.hms.repository.*;
import com.medicare.hms.service.AuthService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import jakarta.annotation.security.PermitAll;
import jakarta.transaction.Transactional;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api")
public class UserController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private AppointmentRepository appointmentRepository;

    @Autowired
    private MedicalRecordRepository medicalRecordRepository;

    @Autowired
    private PrescriptionRepository prescriptionRepository;

    @Autowired
    private LabReportRepository labReportRepository;

    @Autowired
    private BillingInvoiceRepository billingInvoiceRepository;

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private DoctorAvailabilityRepository doctorAvailabilityRepository;

    @Autowired
    private TestReportRepository testReportRepository;

    @Autowired
    private ProfileRepository profileRepository;

    @Autowired
    private AuthService authService;

    // Returns the authenticated user and role information.
    @GetMapping("/users/me")
    public ResponseEntity<?> getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || auth.getName() == null || auth.getName().equals("anonymousUser")) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        }

        var userOpt = userRepository.findByUsername(auth.getName());
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            String avatarUrl = user.getProfile() != null ? user.getProfile().getAvatarUrl() : null;
            return ResponseEntity
                    .ok(new UserResponse(user.getId(), user.getUsername(), user.getEmail(),
                            user.getRole().name().toLowerCase(), avatarUrl));
        }
        return ResponseEntity.status(404).body(Map.of("error", "User not found"));
    }

    // Returns every user for admin management screens.
    @GetMapping("/admin/users")
    @PreAuthorize("hasRole('ADMIN')")
    public List<UserResponse> listUsers() {
        return userRepository.findAll().stream()
                .map(user -> {
                    String avatarUrl = user.getProfile() != null ? user.getProfile().getAvatarUrl() : null;
                    return new UserResponse(user.getId(), user.getUsername(), user.getEmail(),
                            user.getRole().name().toLowerCase(), avatarUrl);
                })
                .collect(Collectors.toList());
    }

    // Returns all doctor users for admin workflows.
    @GetMapping("/admin/doctors")
    @PreAuthorize("hasRole('ADMIN')")
    public List<UserResponse> listAdminDoctors() {
        return userRepository.findAll().stream()
                .filter(user -> user.getRole() == UserRole.DOCTOR)
                .map(user -> {
                    String avatarUrl = user.getProfile() != null ? user.getProfile().getAvatarUrl() : null;
                    return new UserResponse(user.getId(), user.getUsername(), user.getEmail(),
                            user.getRole().name().toLowerCase(), avatarUrl);
                })
                .collect(Collectors.toList());
    }

    // Returns all patient users for admin workflows.
    @GetMapping("/admin/patients")
    @PreAuthorize("hasRole('ADMIN')")
    public List<UserResponse> listAdminPatients() {
        return userRepository.findAll().stream()
                .filter(user -> user.getRole() == UserRole.PATIENT)
                .map(user -> {
                    String avatarUrl = user.getProfile() != null ? user.getProfile().getAvatarUrl() : null;
                    return new UserResponse(user.getId(), user.getUsername(), user.getEmail(),
                            user.getRole().name().toLowerCase(), avatarUrl);
                })
                .collect(Collectors.toList());
    }

    // Returns all users with the doctor role (public).
    @GetMapping("/users/doctors")
    public List<UserResponse> listDoctors() {
        return userRepository.findByRoleWithProfile(UserRole.DOCTOR).stream()
                .map(user -> {
                    String avatarUrl = user.getProfile() != null ? user.getProfile().getAvatarUrl() : null;
                    return new UserResponse(user.getId(), user.getUsername(), user.getEmail(),
                            user.getRole().name().toLowerCase(), avatarUrl);
                })
                .collect(Collectors.toList());
    }

    // Returns only non-sensitive doctor profile information for visitors on the landing page.
    @GetMapping("/public/doctors")
    public List<PublicDoctorProfileResponse> listPublicDoctors() {
        return userRepository.findByRoleWithProfile(UserRole.DOCTOR).stream()
                .map(user -> {
                    Profile profile = user.getProfile();
                    String fullName = user.getUsername();
                    if (profile != null) {
                        String firstName = profile.getFirstName() == null ? "" : profile.getFirstName().trim();
                        String lastName = profile.getLastName() == null ? "" : profile.getLastName().trim();
                        String profileName = (firstName + " " + lastName).trim();
                        if (!profileName.isEmpty()) fullName = profileName;
                    }
                    return new PublicDoctorProfileResponse(
                            user.getId(), fullName,
                            profile != null ? profile.getAvatarUrl() : null,
                            profile != null ? profile.getSpecialization() : null,
                            profile != null ? profile.getDegrees() : null,
                            profile != null ? profile.getEducation() : null,
                            profile != null ? profile.getExperienceYears() : null,
                            profile != null ? profile.getExperienceDetails() : null,
                            profile != null ? profile.getAddress() : null);
                })
                .collect(Collectors.toList());
    }

    // Returns all users with the patient role.
    @GetMapping("/users/patients")
    @PreAuthorize("hasAnyRole('ADMIN','DOCTOR','NURSE','PATIENT')")
    public List<UserResponse> listPatients() {
        return userRepository.findByRole(UserRole.PATIENT).stream()
                .map(user -> {
                    String avatarUrl = user.getProfile() != null ? user.getProfile().getAvatarUrl() : null;
                    return new UserResponse(user.getId(), user.getUsername(), user.getEmail(),
                            user.getRole().name().toLowerCase(), avatarUrl);
                })
                .collect(Collectors.toList());
    }

    // Returns full profile details for a specific user (admin only).
    @GetMapping("/admin/users/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> getUserDetails(@PathVariable Long id) {
        var userOpt = userRepository.findById(id);
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(404).body(Map.of("error", "User not found"));
        }
        User user = userOpt.get();
        Profile profile = user.getProfile();
        UserProfileResponse resp = new UserProfileResponse();
        resp.setId(user.getId());
        resp.setUsername(user.getUsername());
        resp.setEmail(user.getEmail());
        resp.setRole(user.getRole().name().toLowerCase());
        resp.setCreatedAt(user.getCreatedAt());
        resp.setUpdatedAt(user.getUpdatedAt());
        if (profile != null) {
            resp.setAvatarUrl(profile.getAvatarUrl());
            resp.setFirstName(profile.getFirstName());
            resp.setLastName(profile.getLastName());
            resp.setPhone(profile.getPhone());
            resp.setAddress(profile.getAddress());
            resp.setDateOfBirth(profile.getDateOfBirth());
            resp.setGender(profile.getGender() != null ? profile.getGender().name().toLowerCase() : null);
            resp.setBloodGroup(profile.getBloodGroup());
            resp.setEmergencyName(profile.getEmergencyName());
            resp.setEmergencyPhone(profile.getEmergencyPhone());
            resp.setEmergencyRelation(profile.getEmergencyRelation());
            resp.setSpecialization(profile.getSpecialization());
            resp.setDegrees(profile.getDegrees());
            resp.setEducation(profile.getEducation());
            resp.setExperienceYears(profile.getExperienceYears());
            resp.setExperienceDetails(profile.getExperienceDetails());
        }
        return ResponseEntity.ok(resp);
    }

    // Creates a user account from an admin request.
    @PostMapping("/admin/users")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> createUser(@Valid @RequestBody SignupRequest request) {
        try {
            authService.registerUser(request);
            return ResponseEntity.ok("User created successfully");
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // Builds summary counts for the admin dashboard.
    @GetMapping("/admin/dashboard-stats")
    @PreAuthorize("hasRole('ADMIN')")
    public DashboardStats getDashboardStats() {
        long totalPatients = userRepository.countByRole(UserRole.PATIENT);
        long totalDoctors = userRepository.countByRole(UserRole.DOCTOR);
        long totalAppointments = appointmentRepository.count();

        LocalDateTime startOfDay = LocalDateTime.now().withHour(0).withMinute(0).withSecond(0).withNano(0);
        LocalDateTime endOfDay = startOfDay.plusDays(1);
        long appointmentsToday = appointmentRepository.findByAppointmentDateBetween(startOfDay, endOfDay).size();

        // খালি billing এম্পি; এখনই 0 বরাবর
        double totalRevenue = 0.0;

        return new DashboardStats(totalPatients, totalDoctors, totalAppointments, appointmentsToday, totalRevenue);
    }

    // Changes a user's assigned role.
    @PutMapping("/admin/users/{id}/role")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> updateUserRole(@PathVariable Long id, @RequestParam String role) {
        UserRole newRole;
        try {
            newRole = UserRole.valueOf(role.toUpperCase());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body("Invalid role: " + role);
        }

        var userOpt = userRepository.findById(id);
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            user.setRole(newRole);
            user.setUpdatedAt(java.time.LocalDateTime.now());
            userRepository.save(user);
            String avatarUrl = user.getProfile() != null ? user.getProfile().getAvatarUrl() : null;
            return ResponseEntity
                    .ok(new UserResponse(user.getId(), user.getUsername(), user.getEmail(),
                            user.getRole().name().toLowerCase(), avatarUrl));
        }
        return ResponseEntity.status(404).body(Map.of("error", "User not found"));
    }

    // Deletes a user account by id, cleaning up all related records first.
    @DeleteMapping("/admin/users/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    public ResponseEntity<?> deleteUser(@PathVariable Long id) {
        var userOpt = userRepository.findById(id);
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(404).body("User not found");
        }

        testReportRepository.deleteByPatientIdOrDoctorId(id);
        medicalRecordRepository.deleteByPatientIdOrDoctorId(id);
        prescriptionRepository.deleteByPatientIdOrDoctorId(id);
        labReportRepository.deleteByPatientIdOrDoctorId(id);
        billingInvoiceRepository.deleteByPatientIdOrDoctorId(id);
        notificationRepository.deleteByUserId(id);
        doctorAvailabilityRepository.deleteByDoctorId(id);
        appointmentRepository.deleteByPatientIdOrDoctorId(id);

        userRepository.deleteById(id);
        return ResponseEntity.ok("User deleted successfully");
    }

    // Updates profile details from the submitted request body.
    @PutMapping("/users/{id}/profile")
    @PreAuthorize("hasAnyRole('ADMIN','DOCTOR','NURSE')")
    public ResponseEntity<?> updateProfile(@PathVariable Long id, @RequestBody Map<String, Object> profileData) {
        var userOpt = userRepository.findById(id);
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(404).body(Map.of("error", "User not found"));
        }
        User user = userOpt.get();
        Profile profile = user.getProfile();
        if (profile == null) {
            profile = new Profile();
            profile.setUser(user);
        }
        if (profileData.containsKey("full_name")) {
            String fullName = (String) profileData.get("full_name");
            String[] parts = fullName.trim().split("\\s+", 2);
            profile.setFirstName(parts[0]);
            profile.setLastName(parts.length > 1 ? parts[1] : "");
        }
        if (profileData.containsKey("phone")) profile.setPhone((String) profileData.get("phone"));
        if (profileData.containsKey("address")) profile.setAddress((String) profileData.get("address"));
        if (profileData.containsKey("gender")) {
            try {
                profile.setGender(Gender.valueOf(((String) profileData.get("gender")).toUpperCase()));
            } catch (IllegalArgumentException ignored) {}
        }
        if (profileData.containsKey("date_of_birth")) {
            String dob = (String) profileData.get("date_of_birth");
            if (dob != null && !dob.isBlank()) {
                profile.setDateOfBirth(LocalDate.parse(dob));
            }
        }
        if (profileData.containsKey("blood_group")) profile.setBloodGroup((String) profileData.get("blood_group"));
        if (profileData.containsKey("avatar_url")) profile.setAvatarUrl((String) profileData.get("avatar_url"));
        if (profileData.containsKey("specialization")) profile.setSpecialization((String) profileData.get("specialization"));
        if (profileData.containsKey("degrees")) profile.setDegrees((String) profileData.get("degrees"));
        if (profileData.containsKey("education")) profile.setEducation((String) profileData.get("education"));
        if (profileData.containsKey("experience_details")) profile.setExperienceDetails((String) profileData.get("experience_details"));
        if (profileData.containsKey("emergency_name")) profile.setEmergencyName((String) profileData.get("emergency_name"));
        if (profileData.containsKey("emergency_phone")) profile.setEmergencyPhone((String) profileData.get("emergency_phone"));
        if (profileData.containsKey("emergency_relation")) profile.setEmergencyRelation((String) profileData.get("emergency_relation"));
        if (profileData.containsKey("experience_years")) {
            Object val = profileData.get("experience_years");
            if (val instanceof Number) profile.setExperienceYears(((Number) val).intValue());
        }

        profileRepository.save(profile);
        return ResponseEntity.ok(Map.of("message", "Profile updated successfully"));
    }
}
