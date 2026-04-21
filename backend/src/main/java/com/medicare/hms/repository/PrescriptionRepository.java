package com.medicare.hms.repository;

import com.medicare.hms.entity.Prescription;
import com.medicare.hms.entity.User;
import com.medicare.hms.entity.PrescriptionStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PrescriptionRepository extends JpaRepository<Prescription, Long> {
    List<Prescription> findByPatient(User patient);

    List<Prescription> findByDoctor(User doctor);

    List<Prescription> findByStatus(PrescriptionStatus status);
}
