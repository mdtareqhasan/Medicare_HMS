package com.medicare.hms.service;

import com.medicare.hms.entity.BillingInvoice;
import com.medicare.hms.entity.User;
import com.medicare.hms.repository.BillingInvoiceRepository;
import com.medicare.hms.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
public class BillingService {

    @Autowired
    private BillingInvoiceRepository billingInvoiceRepository;

    @Autowired
    private UserRepository userRepository;

    public List<BillingInvoice> getAllInvoices() {
        return billingInvoiceRepository.findAll();
    }

    public BillingInvoice createInvoice(Long patientId, Long doctorId, BigDecimal doctorFee, BigDecimal labFee,
            BigDecimal pharmacyFee) {
        User patient = userRepository.findById(patientId).orElseThrow(() -> new RuntimeException("Patient not found"));
        User doctor = doctorId == null ? null : userRepository.findById(doctorId).orElse(null);

        BigDecimal total = doctorFee.add(labFee).add(pharmacyFee);

        BillingInvoice invoice = new BillingInvoice();
        invoice.setInvoiceNumber(generateInvoiceNumber());
        invoice.setPatient(patient);
        invoice.setDoctor(doctor);
        invoice.setDoctorFee(doctorFee);
        invoice.setLabFee(labFee);
        invoice.setPharmacyFee(pharmacyFee);
        invoice.setTotalAmount(total);
        invoice.setStatus("PENDING");
        invoice.setCreatedAt(LocalDateTime.now());
        invoice.setUpdatedAt(LocalDateTime.now());

        return billingInvoiceRepository.save(invoice);
    }

    public BillingInvoice markPaid(Long invoiceId) {
        BillingInvoice invoice = billingInvoiceRepository.findById(invoiceId)
                .orElseThrow(() -> new RuntimeException("Invoice not found"));
        invoice.setStatus("PAID");
        invoice.setUpdatedAt(LocalDateTime.now());
        return billingInvoiceRepository.save(invoice);
    }

    private String generateInvoiceNumber() {
        String prefix = "INV-";
        String uuid = UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        return prefix + uuid;
    }
}
