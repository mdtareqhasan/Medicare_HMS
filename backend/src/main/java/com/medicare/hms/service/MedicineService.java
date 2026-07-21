package com.medicare.hms.service;

import com.medicare.hms.entity.Medicine;
import com.medicare.hms.repository.MedicineRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class MedicineService {

    @Autowired
    private MedicineRepository medicineRepository;

    // Returns every medicine in inventory.
    public List<Medicine> getAllMedicines() {
        return medicineRepository.findAll();
    }

    // Returns one medicine by id or fails if it does not exist.
    public Medicine getMedicine(Long id) {
        return medicineRepository.findById(id).orElseThrow(() -> new RuntimeException("Medicine not found"));
    }

    // Adds a medicine record to inventory.
    public Medicine addMedicine(Medicine medicine) {
        return medicineRepository.save(medicine);
    }

    // Updates an existing medicine inventory record.
    public Medicine updateMedicine(Long id, Medicine medicine) {
        Medicine existing = getMedicine(id);
        existing.setName(medicine.getName());
        existing.setGenericName(medicine.getGenericName());
        existing.setCategory(medicine.getCategory());
        existing.setPrice(medicine.getPrice());
        existing.setStockQuantity(medicine.getStockQuantity());
        existing.setExpiryDate(medicine.getExpiryDate());
        return medicineRepository.save(existing);
    }

    // Deletes a medicine inventory record.
    public void deleteMedicine(Long id) {
        medicineRepository.deleteById(id);
    }

    // Reduces medicine stock after validating enough quantity is available.
    public Medicine dispenseMedicine(Long id, Integer quantity) {
        if (quantity == null || quantity <= 0) {
            throw new IllegalArgumentException("Quantity must be positive");
        }

        Medicine medicine = getMedicine(id);
        if (medicine.getStockQuantity() == null || medicine.getStockQuantity() < quantity) {
            throw new RuntimeException("Insufficient stock");
        }
        medicine.setStockQuantity(medicine.getStockQuantity() - quantity);
        return medicineRepository.save(medicine);
    }

    // Returns low stock medicines data.
    public List<Medicine> getLowStockMedicines() {
        return medicineRepository.findByStockQuantityLessThan(10);
    }
}
