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
        response.put("gender", profile.getGender() != null ? profile.getGender().name().toLowerCase() : "");
        response.put("bloodGroup", profile.getBloodGroup() != null ? profile.getBloodGroup() : "");
        response.put("emergencyName", profile.getEmergencyName() != null ? profile.getEmergencyName() : "");
        response.put("emergencyPhone", profile.getEmergencyPhone() != null ? profile.getEmergencyPhone() : "");
        response.put("emergencyRelation", profile.getEmergencyRelation() != null ? profile.getEmergencyRelation() : "");
        response.put("avatarUrl", profile.getAvatarUrl() != null ? profile.getAvatarUrl() : "");

        return ResponseEntity.ok(response);
    }

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

        if (body.get("gender") != null) {
            try {
                profile.setGender(Gender.valueOf(((String) body.get("gender")).toUpperCase()));
            } catch (Exception e) {
                profile.setGender(null);
            }
        }

        profileRepository.save(profile);
        return ResponseEntity.ok(Map.of("message", "Profile updated successfully"));
    }

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