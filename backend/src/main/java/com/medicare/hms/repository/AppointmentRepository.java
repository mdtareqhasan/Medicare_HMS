package com.medicare.hms.repository;

import com.medicare.hms.entity.Appointment;
import com.medicare.hms.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface AppointmentRepository extends JpaRepository<Appointment, Long> {
    List<Appointment> findByPatient(User patient);

    List<Appointment> findByDoctor(User doctor);

    List<Appointment> findByAppointmentDateBetween(LocalDateTime start, LocalDateTime end);

    List<Appointment> findByDoctorAndAppointmentDateBetween(User doctor, LocalDateTime start, LocalDateTime end);

    List<Appointment> findByPatientAndAppointmentDateBetween(User patient, LocalDateTime start, LocalDateTime end);
}