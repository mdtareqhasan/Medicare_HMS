package com.medicare.hms.repository;

import com.medicare.hms.entity.DoctorAvailability;
import com.medicare.hms.entity.DayOfWeek;
import com.medicare.hms.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DoctorAvailabilityRepository extends JpaRepository<DoctorAvailability, Long> {
    List<DoctorAvailability> findByDoctor(User doctor);

    List<DoctorAvailability> findByDoctorAndIsAvailable(User doctor, Boolean isAvailable);

    Optional<DoctorAvailability> findByDoctorAndDayOfWeek(User doctor, DayOfWeek dayOfWeek);

    void deleteByDoctor(User doctor);
}