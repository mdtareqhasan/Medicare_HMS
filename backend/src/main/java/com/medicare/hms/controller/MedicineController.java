package com.medicare.hms.controller;

import com.medicare.hms.entity.Medicine;
import com.medicare.hms.service.MedicineService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/pharmacy")
public class MedicineController {

    @Autowired
    private MedicineService medicineService;

    // Returns all records for this resource.
    @GetMapping
    @PreAuthorize("hasRole('PHARMACIST') or hasRole('ADMIN')")
    public List<Medicine> getAll() {
        return medicineService.getAllMedicines();
    }

    // Returns medicines whose stock is below the low-stock threshold.
    @GetMapping("/low-stock")
    @PreAuthorize("hasRole('PHARMACIST') or hasRole('ADMIN')")
    public List<Medicine> getLowStock() {
        return medicineService.getLowStockMedicines();
    }

    // Adds a new medicine to the pharmacy inventory.
    @PostMapping
    @PreAuthorize("hasRole('PHARMACIST') or hasRole('ADMIN')")
    public Medicine createMedicine(@RequestBody Medicine medicine) {
        return medicineService.addMedicine(medicine);
    }

    // Updates an existing medicine inventory record.
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('PHARMACIST') or hasRole('ADMIN')")
    public Medicine updateMedicine(@PathVariable Long id, @RequestBody Medicine medicine) {
        return medicineService.updateMedicine(id, medicine);
    }

    // Deletes a medicine inventory record.
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('PHARMACIST') or hasRole('ADMIN')")
    public ResponseEntity<?> deleteMedicine(@PathVariable Long id) {
        medicineService.deleteMedicine(id);
        return ResponseEntity.ok(Map.of("message", "Deleted"));
    }

    // Dispenses medicine stock from inventory.
    @PostMapping("/{id}/dispense")
    @PreAuthorize("hasRole('PHARMACIST') or hasRole('ADMIN')")
    public Medicine dispense(@PathVariable Long id, @RequestParam Integer quantity) {
        return medicineService.dispenseMedicine(id, quantity);
    }
}
