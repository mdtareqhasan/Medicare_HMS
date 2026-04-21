package com.medicare.hms.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "billing_invoices")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class BillingInvoice {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String invoiceNumber;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "patient_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "password"})
    private User patient;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "doctor_id", nullable = true)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "password"})
    private User doctor;

    private BigDecimal doctorFee;
    private BigDecimal labFee;
    private BigDecimal pharmacyFee;
    private BigDecimal totalAmount;

    @Column(nullable = false)
    private String status; // PENDING, PAID, OVERDUE

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
