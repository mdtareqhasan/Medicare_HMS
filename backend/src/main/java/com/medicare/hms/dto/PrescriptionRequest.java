package com.medicare.hms.dto;

import java.util.List;
import java.util.Map;

public class PrescriptionRequest {
    public Long patientId;
    public String diagnosis;
    public List<Map<String, String>> medicines;
    public List<String> labTests;
    public String notes;
    public Long appointmentId;
}
