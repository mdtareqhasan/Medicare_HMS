package com.medicare.hms.repository;

import com.medicare.hms.entity.TestReport;
import com.medicare.hms.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TestReportRepository extends JpaRepository<TestReport, Long> {
    List<TestReport> findByLabTest_Id(Long labTestId);

    List<TestReport> findByPatient(User patient);

    List<TestReport> findByStatus(com.medicare.hms.entity.TestStatus status);

    List<TestReport> findByDoctor(User doctor);
}
