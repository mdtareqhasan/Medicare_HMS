package com.medicare.hms.service;

import com.medicare.hms.entity.*;
import com.medicare.hms.repository.LabTestRepository;
import com.medicare.hms.repository.TestReportRepository;
import com.medicare.hms.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class LabService {

    @Autowired
    private LabTestRepository labTestRepository;

    @Autowired
    private TestReportRepository testReportRepository;

    @Autowired
    private UserRepository userRepository;

    // Saves a new lab test definition.
    public LabTest createLabTest(LabTest labTest) {
        return labTestRepository.save(labTest);
    }

    // Returns all lab test definitions.
    public List<LabTest> getAllLabTests() {
        return labTestRepository.findAll();
    }

    // Creates a lab test report ordered by a doctor for a patient.
    public TestReport prescribeTest(Long labTestId, Long doctorId, Long patientId) {
        LabTest labTest = labTestRepository.findById(labTestId)
                .orElseThrow(() -> new RuntimeException("Lab test not found"));
        User doctor = userRepository.findById(doctorId).orElseThrow(() -> new RuntimeException("Doctor not found"));
        User patient = userRepository.findById(patientId).orElseThrow(() -> new RuntimeException("Patient not found"));

        TestReport report = new TestReport();
        report.setLabTest(labTest);
        report.setDoctor(doctor);
        report.setPatient(patient);
        report.setStatus(TestStatus.PENDING);
        report.setCreatedAt(LocalDateTime.now());
        report.setUpdatedAt(LocalDateTime.now());

        return testReportRepository.save(report);
    }

    // Returns lab reports for a patient.
    public List<TestReport> getLabReportsForPatient(Long patientId) {
        User patient = userRepository.findById(patientId).orElseThrow(() -> new RuntimeException("Patient not found"));
        return testReportRepository.findByPatient(patient);
    }

    // Returns lab reports that are still waiting to be processed.
    public List<TestReport> getPendingReports() {
        return testReportRepository.findByStatus(TestStatus.PENDING);
    }

    // Stores the uploaded result URL and marks the report completed.
    public TestReport uploadReportResult(Long reportId, String resultUrl) {
        TestReport report = testReportRepository.findById(reportId)
                .orElseThrow(() -> new RuntimeException("Report not found"));
        report.setResultUrl(resultUrl);
        report.setStatus(TestStatus.COMPLETED);
        report.setUpdatedAt(LocalDateTime.now());
        return testReportRepository.save(report);
    }

    // Returns lab reports ordered by a doctor.
    public List<TestReport> getLabReportsForDoctor(Long doctorId) {
        User doctor = userRepository.findById(doctorId).orElseThrow(() -> new RuntimeException("Doctor not found"));
        return testReportRepository.findByDoctor(doctor);
    }

    // Returns all lab reports for staff views.
    public List<TestReport> getAllReports() {
        List<TestReport> reports = testReportRepository.findAll();
        System.out.println("[LabService] getAllReports: found " + reports.size() + " reports");
        return reports;
    }

    // Moves a lab report into the in-progress testing state.
    public TestReport startTest(Long reportId) {
        TestReport report = testReportRepository.findById(reportId)
                .orElseThrow(() -> new RuntimeException("Report not found"));
        report.setStatus(TestStatus.IN_PROGRESS);
        report.setUpdatedAt(LocalDateTime.now());
        return testReportRepository.save(report);
    }

    // Saves lab result text, optional file URL, and completion status.
    public TestReport submitResult(Long reportId, String result, String fileUrl) {
        TestReport report = testReportRepository.findById(reportId)
                .orElseThrow(() -> new RuntimeException("Report not found"));
        report.setResult(result);
        if (fileUrl != null && !fileUrl.isBlank()) {
            report.setResultUrl(fileUrl);
        }
        report.setStatus(TestStatus.COMPLETED);
        report.setUpdatedAt(LocalDateTime.now());
        return testReportRepository.save(report);
    }

    // Returns lab reports filtered by their workflow status.
    public List<TestReport> getReportsByStatus(String status) {
        try {
            TestStatus testStatus = TestStatus.valueOf(status.toUpperCase());
            return testReportRepository.findByStatus(testStatus);
        } catch (IllegalArgumentException e) {
            throw new RuntimeException("Invalid status: " + status);
        }
    }
}