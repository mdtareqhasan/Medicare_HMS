package com.medicare.hms.repository;

import com.medicare.hms.entity.Prescription;
import com.medicare.hms.entity.User;
import com.medicare.hms.entity.PrescriptionStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PrescriptionRepository extends JpaRepository<Prescription, Long> {
    // Finds records by patient.
    List<Prescription> findByPatient(User patient);

    // Finds records by doctor.
    List<Prescription> findByDoctor(User doctor);

    // Finds records by status.
    List<Prescription> findByStatus(PrescriptionStatus status);

    // Deletes all prescriptions where the user is patient or doctor.
    @Modifying
    @Query("DELETE FROM Prescription p WHERE p.patient.id = :userId OR p.doctor.id = :userId")
    void deleteByPatientIdOrDoctorId(Long userId);
}
