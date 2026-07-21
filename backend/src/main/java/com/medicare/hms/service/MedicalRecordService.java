package com.medicare.hms.service;

import com.medicare.hms.entity.Appointment;
import com.medicare.hms.entity.MedicalRecord;
import com.medicare.hms.entity.User;
import com.medicare.hms.repository.MedicalRecordRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class MedicalRecordService {

    @Autowired
    private MedicalRecordRepository medicalRecordRepository;

    // Creates a medical record from appointment, doctor, patient, and visit notes.
    public MedicalRecord createMedicalRecord(Appointment appointment, User doctor, User patient, String diagnosis,
            String prescription, String notes) {
        MedicalRecord record = new MedicalRecord();
        record.setAppointment(appointment);
        record.setDoctor(doctor);
        record.setPatient(patient);
        record.setDiagnosis(diagnosis);
        record.setPrescription(prescription);
        record.setNotes(notes);
        record.setRecordDate(LocalDateTime.now());
        record.setCreatedAt(LocalDateTime.now());
        record.setUpdatedAt(LocalDateTime.now());
        return medicalRecordRepository.save(record);
    }

    // Returns medical records for a patient.
    public List<MedicalRecord> getMedicalRecordsForPatient(User patient) {
        return medicalRecordRepository.findByPatient(patient);
    }

    // Returns medical records created by a doctor.
    public List<MedicalRecord> getMedicalRecordsForDoctor(User doctor) {
        return medicalRecordRepository.findByDoctor(doctor);
    }
}
