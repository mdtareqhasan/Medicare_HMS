package com.medicare.hms.controller;

import com.medicare.hms.entity.BillingInvoice;
import com.medicare.hms.service.BillingService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/billing")
public class BillingController {

    @Autowired
    private BillingService billingService;

    // Returns all billing invoices.
    @GetMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('ACCOUNTANT')")
    public List<BillingInvoice> getInvoices() {
        return billingService.getAllInvoices();
    }

    // Creates an invoice by calculating the total charge for patient services.
    @PostMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('ACCOUNTANT')")
    public BillingInvoice createInvoice(@RequestParam Long patientId,
            @RequestParam(required = false) Long doctorId,
            @RequestParam BigDecimal doctorFee,
            @RequestParam BigDecimal labFee,
            @RequestParam BigDecimal pharmacyFee) {
        return billingService.createInvoice(patientId, doctorId, doctorFee, labFee, pharmacyFee);
    }

    // Marks an invoice as paid.
    @PutMapping("/{id}/pay")
    @PreAuthorize("hasRole('ADMIN') or hasRole('ACCOUNTANT')")
    public ResponseEntity<Map<String, String>> markPaid(@PathVariable Long id) {
        billingService.markPaid(id);
        return ResponseEntity.ok(Map.of("message", "Invoice marked as paid"));
    }
}
