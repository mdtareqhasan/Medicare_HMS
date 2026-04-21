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

    public List<Medicine> getAllMedicines() {
        return medicineRepository.findAll();
    }

    public Medicine getMedicine(Long id) {
        return medicineRepository.findById(id).orElseThrow(() -> new RuntimeException("Medicine not found"));
    }

    public Medicine addMedicine(Medicine medicine) {
        return medicineRepository.save(medicine);
    }

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

    public void deleteMedicine(Long id) {
        medicineRepository.deleteById(id);
    }

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

    public List<Medicine> getLowStockMedicines() {
        return medicineRepository.findByStockQuantityLessThan(10);
    }
}
