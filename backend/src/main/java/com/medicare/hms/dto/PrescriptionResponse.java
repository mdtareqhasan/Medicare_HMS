package com.medicare.hms.dto;

import com.medicare.hms.entity.PrescriptionStatus;

import java.time.LocalDateTime;
import java.util.List;

public class PrescriptionResponse {
    public Long id;
    public Long patientId;
    public Long doctorId;
    public String doctorName;
    public String medicines;
    public String notes;
    public String status;
    public Long appointmentId;
    public LocalDateTime createdAt;
    public LocalDateTime updatedAt;
    public List<String> labTests;

    public PrescriptionResponse(Long id, Long patientId, Long doctorId, String doctorName, String medicines, String notes,
            String status, LocalDateTime createdAt, LocalDateTime updatedAt) {
        this(id, patientId, doctorId, doctorName, medicines, notes, status, null, createdAt, updatedAt);
    }

    public PrescriptionResponse(Long id, Long patientId, Long doctorId, String doctorName, String medicines, String notes,
            String status, Long appointmentId, LocalDateTime createdAt, LocalDateTime updatedAt) {
        this.id = id;
        this.patientId = patientId;
        this.doctorId = doctorId;
        this.doctorName = doctorName;
        this.medicines = medicines;
        this.notes = notes;
        this.status = status;
        this.appointmentId = appointmentId;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
        this.labTests = null;
    }
}
