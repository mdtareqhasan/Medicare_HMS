package com.medicare.hms.repository;

import com.medicare.hms.entity.MedicalRecord;
import com.medicare.hms.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MedicalRecordRepository extends JpaRepository<MedicalRecord, Long> {
    // Finds records by patient.
    List<MedicalRecord> findByPatient(User patient);

    // Finds records by doctor.
    List<MedicalRecord> findByDoctor(User doctor);

    // Deletes all records where the user is patient or doctor.
    @Modifying
    @Query("DELETE FROM MedicalRecord m WHERE m.patient.id = :userId OR m.doctor.id = :userId")
    void deleteByPatientIdOrDoctorId(Long userId);
}
