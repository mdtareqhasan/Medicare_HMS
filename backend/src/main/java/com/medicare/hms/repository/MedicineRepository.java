package com.medicare.hms.repository;

import com.medicare.hms.entity.Medicine;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MedicineRepository extends JpaRepository<Medicine, Long> {
    // Finds medicines whose stock quantity is below the given threshold.
    List<Medicine> findByStockQuantityLessThan(Integer threshold);
}
