package com.medicare.hms.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserProfileResponse {
    private Long id;
    private String username;
    private String email;
    private String role;
    private String avatarUrl;
    private String firstName;
    private String lastName;
    private String phone;
    private String address;
    private LocalDate dateOfBirth;
    private String gender;
    private String bloodGroup;
    private String emergencyName;
    private String emergencyPhone;
    private String emergencyRelation;
    private String specialization;
    private String degrees;
    private String education;
    private Integer experienceYears;
    private String experienceDetails;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}