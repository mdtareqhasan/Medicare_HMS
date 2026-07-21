package com.medicare.hms.repository;

import com.medicare.hms.entity.BillingInvoice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

@Repository
public interface BillingInvoiceRepository extends JpaRepository<BillingInvoice, Long> {
    // Finds the most recently created invoice by id.
    BillingInvoice findTopByOrderByIdDesc();

    // Deletes all invoices where the user is patient or doctor.
    @Modifying
    @Query("DELETE FROM BillingInvoice b WHERE b.patient.id = :userId OR b.doctor.id = :userId")
    void deleteByPatientIdOrDoctorId(Long userId);
}
