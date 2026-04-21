package com.medicare.hms.repository;

import com.medicare.hms.entity.MedicalRecord;
import com.medicare.hms.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MedicalRecordRepository extends JpaRepository<MedicalRecord, Long> {
    List<MedicalRecord> findByPatient(User patient);

    List<MedicalRecord> findByDoctor(User doctor);
}
