package com.medicare.hms.repository;

import com.medicare.hms.entity.LabReport;
import com.medicare.hms.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LabReportRepository extends JpaRepository<LabReport, Long> {
    // Finds records by patient.
    List<LabReport> findByPatient(User patient);

    // Finds records by doctor.
    List<LabReport> findByDoctor(User doctor);

    // Finds all records for this repository.
    List<LabReport> findAll();

    // Deletes all lab reports where the user is patient or doctor.
    @Modifying
    @Query("DELETE FROM LabReport l WHERE l.patient.id = :userId OR l.doctor.id = :userId")
    void deleteByPatientIdOrDoctorId(Long userId);
}