package com.medicare.hms.repository;

import com.medicare.hms.entity.LabTest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface LabTestRepository extends JpaRepository<LabTest, Long> {
    // Finds a lab test by name without case sensitivity.
    java.util.Optional<LabTest> findByTestNameIgnoreCase(String testName);
}
