package com.medicare.hms.controller;

import com.medicare.hms.entity.Gender;
import com.medicare.hms.entity.Profile;
import com.medicare.hms.entity.User;
import com.medicare.hms.repository.ProfileRepository;
import com.medicare.hms.repository.UserRepository;
import com.medicare.hms.service.CloudinaryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/profile")
public class ProfileController {

    @Autowired
    private ProfileRepository profileRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CloudinaryService cloudinaryService;

    // Returns the current user's profile details.
    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> getProfile() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated())
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();

        User user = userRepository.findByUsername(auth.getName())
                .orElse(null);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "User not found"));
        }

        Profile profile = profileRepository.findByUser(user).orElse(new Profile());

        Map<String, Object> response = new HashMap<>();
        response.put("id", profile.getId());
        response.put("userId", user.getId());
        response.put("firstName", profile.getFirstName() != null ? profile.getFirstName() : "");
        response.put("lastName", profile.getLastName() != null ? profile.getLastName() : "");
        response.put("phone", profile.getPhone() != null ? profile.getPhone() : "");
        response.put("address", profile.getAddress() != null ? profile.getAddress() : "");
        response.put("dateOfBirth", profile.getDateOfBirth() != null ? profile.getDateOfBirth().toString() : "");
        response.put("gender", profile.getGender() != null ? profile.getGender().name().toLowerCase() : "");
        response.put("bloodGroup", profile.getBloodGroup() != null ? profile.getBloodGroup() : "");
        response.put("emergencyName", profile.getEmergencyName() != null ? profile.getEmergencyName() : "");
        response.put("emergencyPhone", profile.getEmergencyPhone() != null ? profile.getEmergencyPhone() : "");
        response.put("emergencyRelation", profile.getEmergencyRelation() != null ? profile.getEmergencyRelation() : "");
        response.put("avatarUrl", profile.getAvatarUrl() != null ? profile.getAvatarUrl() : "");
        response.put("specialization", profile.getSpecialization() != null ? profile.getSpecialization() : "");
        response.put("degrees", profile.getDegrees() != null ? profile.getDegrees() : "");
        response.put("education", profile.getEducation() != null ? profile.getEducation() : "");
        response.put("experienceYears", profile.getExperienceYears());
        response.put("experienceDetails", profile.getExperienceDetails() != null ? profile.getExperienceDetails() : "");
        response.put("insuranceProvider", profile.getInsuranceProvider() != null ? profile.getInsuranceProvider() : "");
        response.put("insurancePolicyNumber", profile.getInsurancePolicyNumber() != null ? profile.getInsurancePolicyNumber() : "");

        return ResponseEntity.ok(response);
    }

    // Updates profile details from the submitted request body.
    @PutMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> updateProfile(@RequestBody Map<String, Object> body) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        User user = userRepository.findByUsername(auth.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Verify user can only update their own profile (security check)
        String requestedUserId = body.get("userId") != null ? body.get("userId").toString() : null;
        if (requestedUserId != null && !requestedUserId.equals(user.getId().toString())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "You can only update your own profile"));
        }

        Profile profile = profileRepository.findByUser(user).orElse(new Profile());
        profile.setUser(user);

        profile.setFirstName((String) body.getOrDefault("firstName", profile.getFirstName()));
        profile.setLastName((String) body.getOrDefault("lastName", profile.getLastName()));
        profile.setPhone((String) body.getOrDefault("phone", profile.getPhone()));
        profile.setAddress((String) body.getOrDefault("address", profile.getAddress()));
        profile.setBloodGroup((String) body.getOrDefault("bloodGroup", profile.getBloodGroup()));
        profile.setEmergencyName((String) body.getOrDefault("emergencyName", profile.getEmergencyName()));
        profile.setEmergencyPhone((String) body.getOrDefault("emergencyPhone", profile.getEmergencyPhone()));
        profile.setEmergencyRelation((String) body.getOrDefault("emergencyRelation", profile.getEmergencyRelation()));
        profile.setAvatarUrl((String) body.getOrDefault("avatarUrl", profile.getAvatarUrl()));
        profile.setSpecialization((String) body.getOrDefault("specialization", profile.getSpecialization()));
        profile.setDegrees((String) body.getOrDefault("degrees", profile.getDegrees()));
        profile.setEducation((String) body.getOrDefault("education", profile.getEducation()));
        profile.setExperienceDetails((String) body.getOrDefault("experienceDetails", profile.getExperienceDetails()));
        profile.setInsuranceProvider((String) body.getOrDefault("insuranceProvider", profile.getInsuranceProvider()));
        profile.setInsurancePolicyNumber((String) body.getOrDefault("insurancePolicyNumber", profile.getInsurancePolicyNumber()));

        if (body.get("gender") != null) {
            try {
                profile.setGender(Gender.valueOf(((String) body.get("gender")).toUpperCase()));
            } catch (Exception e) {
                profile.setGender(null);
            }
        }

        if (body.containsKey("dateOfBirth")) {
            String dateOfBirth = (String) body.get("dateOfBirth");
            try {
                profile.setDateOfBirth(dateOfBirth == null || dateOfBirth.isBlank() ? null : LocalDate.parse(dateOfBirth));
            } catch (Exception e) {
                return ResponseEntity.badRequest().body(Map.of("error", "Date of birth must be a valid date"));
            }
        }

        if (body.containsKey("experienceYears")) {
            Object experienceYears = body.get("experienceYears");
            if (experienceYears == null || experienceYears.toString().isBlank()) {
                profile.setExperienceYears(null);
            } else if (experienceYears instanceof Number number) {
                profile.setExperienceYears(number.intValue());
            } else {
                try {
                    profile.setExperienceYears(Integer.parseInt(experienceYears.toString()));
                } catch (NumberFormatException e) {
                    return ResponseEntity.badRequest().body(Map.of("error", "Experience years must be a number"));
                }
            }
        }

        profileRepository.save(profile);
        return ResponseEntity.ok(Map.of("message", "Profile updated successfully"));
    }

    // Uploads and saves a new avatar for the current profile.
    @PutMapping("/avatar")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> updateAvatar(@RequestParam("file") MultipartFile file) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        User user = userRepository.findByUsername(auth.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));

        Profile profile = profileRepository.findByUser(user).orElse(new Profile());
        profile.setUser(user);

        try {
            String avatarUrl = cloudinaryService.uploadFile(file, "avatars");
            profile.setAvatarUrl(avatarUrl);
            profileRepository.save(profile);
            return ResponseEntity.ok(Map.of("avatarUrl", avatarUrl));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to upload avatar: " + e.getMessage()));
        }
    }
}
