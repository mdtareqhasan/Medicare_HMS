package com.medicare.hms.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import com.fasterxml.jackson.annotation.JsonFormat;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AppointmentRequest {
    @NotNull(message = "Doctor ID is required")
    private Long doctorId;

    private Long patientId; // optional for doctors/admins/nurses booking on behalf of patient

    @NotNull(message = "Appointment date is required")
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime appointmentDate;

    private String consultationType = "in-person";
    private String visitType = "new";
    private String urgency = "normal";
    private String department;
    private java.util.List<String> symptoms;

    @Size(max = 500, message = "Notes must not exceed 500 characters")
    private String notes;
}