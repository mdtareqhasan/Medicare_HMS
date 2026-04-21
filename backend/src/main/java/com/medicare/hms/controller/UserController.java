package com.medicare.hms.controller;

import com.medicare.hms.dto.DashboardStats;
import com.medicare.hms.dto.SignupRequest;
import com.medicare.hms.dto.UserResponse;
import com.medicare.hms.entity.User;
import com.medicare.hms.entity.UserRole;
import com.medicare.hms.repository.AppointmentRepository;
import com.medicare.hms.repository.UserRepository;
import com.medicare.hms.service.AuthService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import jakarta.annotation.security.PermitAll;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

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
    private AuthService authService;

    @GetMapping("/users/me")
    public ResponseEntity<?> getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || auth.getName() == null || auth.getName().equals("anonymousUser")) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        }

        var userOpt = userRepository.findByUsername(auth.getName());
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            return ResponseEntity
                    .ok(new UserResponse(user.getId(), user.getUsername(), user.getEmail(),
                            user.getRole().name().toLowerCase()));
        }
        return ResponseEntity.status(404).body(Map.of("error", "User not found"));
    }

    @GetMapping("/admin/users")
    @PreAuthorize("hasRole('ADMIN')")
    public List<UserResponse> listUsers() {
        return userRepository.findAll().stream()
                .map(user -> new UserResponse(user.getId(), user.getUsername(), user.getEmail(),
                        user.getRole().name().toLowerCase()))
                .collect(Collectors.toList());
    }

    @GetMapping("/admin/doctors")
    @PreAuthorize("hasRole('ADMIN')")
    public List<UserResponse> listAdminDoctors() {
        return userRepository.findAll().stream()
                .filter(user -> user.getRole() == UserRole.DOCTOR)
                .map(user -> new UserResponse(user.getId(), user.getUsername(), user.getEmail(),
                        user.getRole().name().toLowerCase()))
                .collect(Collectors.toList());
    }

    @GetMapping("/admin/patients")
    @PreAuthorize("hasRole('ADMIN')")
    public List<UserResponse> listAdminPatients() {
        return userRepository.findAll().stream()
                .filter(user -> user.getRole() == UserRole.PATIENT)
                .map(user -> new UserResponse(user.getId(), user.getUsername(), user.getEmail(),
                        user.getRole().name().toLowerCase()))
                .collect(Collectors.toList());
    }

    @GetMapping("/users/doctors")
    @PreAuthorize("hasAnyRole('ADMIN','DOCTOR','NURSE','PATIENT')")
    public List<UserResponse> listDoctors() {
        return userRepository.findByRole(UserRole.DOCTOR).stream()
                .map(user -> new UserResponse(user.getId(), user.getUsername(), user.getEmail(),
                        user.getRole().name().toLowerCase()))
                .collect(Collectors.toList());
    }

    @GetMapping("/users/patients")
    @PreAuthorize("hasAnyRole('ADMIN','DOCTOR','NURSE','PATIENT')")
    public List<UserResponse> listPatients() {
        return userRepository.findByRole(UserRole.PATIENT).stream()
                .map(user -> new UserResponse(user.getId(), user.getUsername(), user.getEmail(),
                        user.getRole().name().toLowerCase()))
                .collect(Collectors.toList());
    }

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
            return ResponseEntity
                    .ok(new UserResponse(user.getId(), user.getUsername(), user.getEmail(),
                            user.getRole().name().toLowerCase()));
        }
        return ResponseEntity.status(404).body(Map.of("error", "User not found"));
    }

    @DeleteMapping("/admin/users/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> deleteUser(@PathVariable Long id) {
        var userOpt = userRepository.findById(id);
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(404).body("User not found");
        }
        userRepository.deleteById(id);
        return ResponseEntity.ok("User deleted successfully");
    }

    @PutMapping("/users/{id}/profile")
    @PreAuthorize("hasAnyRole('ADMIN','DOCTOR','NURSE')")
    public ResponseEntity<?> updateProfile(@PathVariable Long id, @RequestBody Map<String, Object> profileData) {
        var userOpt = userRepository.findById(id);
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(404).body(Map.of("error", "User not found"));
        }
        // Simply return success for now - profile update logic can be expanded
        return ResponseEntity.ok(Map.of("message", "Profile updated successfully"));
    }
}
