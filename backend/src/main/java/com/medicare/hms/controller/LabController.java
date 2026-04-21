package com.medicare.hms.controller;

import com.medicare.hms.entity.LabTest;
import com.medicare.hms.entity.TestReport;
import com.medicare.hms.service.LabService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/lab-tests")
public class LabController {

    @Autowired
    private LabService labService;

    @PostMapping
    @PreAuthorize("hasRole('DOCTOR') or hasRole('ADMIN')")
    public LabTest createTest(@RequestBody LabTest labTest) {
        return labService.createLabTest(labTest);
    }

    @GetMapping
    @PreAuthorize("hasRole('LAB_TECHNICIAN') or hasRole('ADMIN') or hasRole('DOCTOR')")
    public List<LabTest> listTests() {
        return labService.getAllLabTests();
    }

    @PostMapping("/prescribe")
    @PreAuthorize("hasRole('DOCTOR') or hasRole('ADMIN')")
    public TestReport prescribeTest(@RequestParam Long labTestId, @RequestParam Long doctorId,
            @RequestParam Long patientId) {
        return labService.prescribeTest(labTestId, doctorId, patientId);
    }
}
