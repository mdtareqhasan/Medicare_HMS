package com.medicare.hms.repository;

import com.medicare.hms.entity.Appointment;
import com.medicare.hms.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface AppointmentRepository extends JpaRepository<Appointment, Long> {
    // Finds records by patient.
    List<Appointment> findByPatient(User patient);

    // Finds records by doctor.
    List<Appointment> findByDoctor(User doctor);

    // Finds records by appointment date between.
    List<Appointment> findByAppointmentDateBetween(LocalDateTime start, LocalDateTime end);

    // Finds records by doctor and appointment date between.
    List<Appointment> findByDoctorAndAppointmentDateBetween(User doctor, LocalDateTime start, LocalDateTime end);

    // Finds records by patient and appointment date between.
    List<Appointment> findByPatientAndAppointmentDateBetween(User patient, LocalDateTime start, LocalDateTime end);

    // Deletes all appointments where the user is patient or doctor.
    @Modifying
    @Query("DELETE FROM Appointment a WHERE a.patient.id = :userId OR a.doctor.id = :userId")
    void deleteByPatientIdOrDoctorId(Long userId);
}