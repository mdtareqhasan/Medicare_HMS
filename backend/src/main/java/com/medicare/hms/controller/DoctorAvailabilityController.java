package com.medicare.hms.controller;

import com.medicare.hms.dto.DoctorAvailabilityDto;
import com.medicare.hms.service.DoctorAvailabilityService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/doctor-availability")
public class DoctorAvailabilityController {

    @Autowired
    private DoctorAvailabilityService availabilityService;

    // Bulk update endpoint: Accepts a List of availability slots
    @PutMapping("/bulk/{doctorId}")
    public ResponseEntity<?> saveBulkAvailability(
            @PathVariable Long doctorId,
            @RequestBody List<DoctorAvailabilityDto> dtos) {
        try {
            List<DoctorAvailabilityDto> savedData = availabilityService.saveAvailabilityBulk(doctorId, dtos);
            return ResponseEntity.ok(savedData);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }

    @GetMapping("/{doctorId}")
    public ResponseEntity<?> getAvailability(@PathVariable Long doctorId) {
        return ResponseEntity.ok(availabilityService.getAvailability(doctorId));
    }
}