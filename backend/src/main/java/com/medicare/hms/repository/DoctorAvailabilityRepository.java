package com.medicare.hms.repository;

import com.medicare.hms.entity.DoctorAvailability;
import com.medicare.hms.entity.DayOfWeek;
import com.medicare.hms.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DoctorAvailabilityRepository extends JpaRepository<DoctorAvailability, Long> {
    // Finds records by doctor.
    List<DoctorAvailability> findByDoctor(User doctor);

    // Finds records by doctor and is available.
    List<DoctorAvailability> findByDoctorAndIsAvailable(User doctor, Boolean isAvailable);

    // Finds records by doctor and day of week.
    Optional<DoctorAvailability> findByDoctorAndDayOfWeek(User doctor, DayOfWeek dayOfWeek);

    // Deletes all availability records for a doctor.
    void deleteByDoctor(User doctor);

    // Deletes all availability records by doctor id.
    @Modifying
    @Query("DELETE FROM DoctorAvailability d WHERE d.doctor.id = :doctorId")
    void deleteByDoctorId(Long doctorId);
}