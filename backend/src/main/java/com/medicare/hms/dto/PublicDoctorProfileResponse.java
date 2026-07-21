package com.medicare.hms.dto;

/**
 * Public, non-sensitive information shown on the landing page.
 * Contact, patient, and account details intentionally remain private.
 */
public record PublicDoctorProfileResponse(
        Long id,
        String fullName,
        String avatarUrl,
        String specialization,
        String degrees,
        String education,
        Integer experienceYears,
        String experienceDetails,
        String address) {
}
