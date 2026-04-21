package com.medicare.hms.repository;

import com.medicare.hms.entity.BillingInvoice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface BillingInvoiceRepository extends JpaRepository<BillingInvoice, Long> {
    BillingInvoice findTopByOrderByIdDesc();
}
