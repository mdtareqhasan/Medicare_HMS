package com.medicare.hms.repository;

import com.medicare.hms.entity.TestReport;
import com.medicare.hms.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TestReportRepository extends JpaRepository<TestReport, Long> {
    // Finds test reports created for a specific lab test.
    List<TestReport> findByLabTest_Id(Long labTestId);

    // Finds records by patient.
    List<TestReport> findByPatient(User patient);

    // Finds records by status.
    List<TestReport> findByStatus(com.medicare.hms.entity.TestStatus status);

    // Finds records by doctor.
    List<TestReport> findByDoctor(User doctor);

    // Deletes all test reports where the user is patient or doctor.
    @Modifying
    @Query("DELETE FROM TestReport t WHERE t.patient.id = :userId OR t.doctor.id = :userId")
    void deleteByPatientIdOrDoctorId(Long userId);
}
