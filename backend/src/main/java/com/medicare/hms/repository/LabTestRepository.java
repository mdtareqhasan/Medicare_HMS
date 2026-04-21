package com.medicare.hms.repository;

import com.medicare.hms.entity.LabTest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface LabTestRepository extends JpaRepository<LabTest, Long> {
    java.util.Optional<LabTest> findByTestNameIgnoreCase(String testName);
}
