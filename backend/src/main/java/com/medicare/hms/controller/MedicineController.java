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

    @GetMapping
    @PreAuthorize("hasRole('PHARMACIST') or hasRole('ADMIN')")
    public List<Medicine> getAll() {
        return medicineService.getAllMedicines();
    }

    @GetMapping("/low-stock")
    @PreAuthorize("hasRole('PHARMACIST') or hasRole('ADMIN')")
    public List<Medicine> getLowStock() {
        return medicineService.getLowStockMedicines();
    }

    @PostMapping
    @PreAuthorize("hasRole('PHARMACIST') or hasRole('ADMIN')")
    public Medicine createMedicine(@RequestBody Medicine medicine) {
        return medicineService.addMedicine(medicine);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('PHARMACIST') or hasRole('ADMIN')")
    public Medicine updateMedicine(@PathVariable Long id, @RequestBody Medicine medicine) {
        return medicineService.updateMedicine(id, medicine);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('PHARMACIST') or hasRole('ADMIN')")
    public ResponseEntity<?> deleteMedicine(@PathVariable Long id) {
        medicineService.deleteMedicine(id);
        return ResponseEntity.ok(Map.of("message", "Deleted"));
    }

    @PostMapping("/{id}/dispense")
    @PreAuthorize("hasRole('PHARMACIST') or hasRole('ADMIN')")
    public Medicine dispense(@PathVariable Long id, @RequestParam Integer quantity) {
        return medicineService.dispenseMedicine(id, quantity);
    }
}
