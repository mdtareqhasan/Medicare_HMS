package com.medicare.hms.service;

import com.medicare.hms.entity.*;
import com.medicare.hms.repository.AppointmentRepository;
import com.medicare.hms.repository.DoctorAvailabilityRepository;
import com.medicare.hms.repository.UserRepository;
import com.medicare.hms.security.UserDetailsImpl;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class AppointmentService {

    @Autowired
    private AppointmentRepository appointmentRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private DoctorAvailabilityRepository doctorAvailabilityRepository;

    @Autowired
    private MedicalRecordService medicalRecordService;

    @Autowired
    private NotificationService notificationService;

    public Appointment bookAppointment(Long doctorId, Long patientId, LocalDateTime appointmentDate, String notes,
            UserDetailsImpl currentUser) {
        if (appointmentDate.isBefore(LocalDateTime.now())) {
            throw new RuntimeException("Cannot book appointment in the past");
        }

        User current = userRepository.findByUsername(currentUser.getUsername())
                .orElseThrow(() -> new RuntimeException("Current user not found"));

        User patient;
        if (patientId != null) {
            patient = userRepository.findById(patientId)
                    .orElseThrow(() -> new RuntimeException("Patient not found"));
            if (!patient.getRole().equals(UserRole.PATIENT)) {
                throw new RuntimeException("Selected user is not a patient");
            }

            // only doctors/admin/nurses can book on behalf of others
            boolean isDoctorOrAdminOrNurse = current.getRole() == UserRole.DOCTOR
                    || current.getRole() == UserRole.ADMIN || current.getRole() == UserRole.NURSE;
            if (!isDoctorOrAdminOrNurse) {
                throw new RuntimeException("Only doctors, nurses or admin can book for other patients");
            }
        } else {
            if (current.getRole() != UserRole.PATIENT) {
                throw new RuntimeException("Patient ID is required for non-patient users");
            }
            patient = current;
        }

        if (current.getRole() == UserRole.PATIENT && patientId != null && !patient.getId().equals(current.getId())) {
            throw new RuntimeException("Patients can only book appointments for themselves");
        }

        User doctor = userRepository.findById(doctorId)
                .orElseThrow(() -> new RuntimeException("Doctor not found"));

        if (!doctor.getRole().equals(UserRole.DOCTOR)) {
            throw new RuntimeException("Selected user is not a doctor");
        }

        if (!isDoctorAvailable(doctor, appointmentDate)) {
            throw new RuntimeException("Doctor is not available at this time");
        }

        if (hasConflictingAppointment(doctor, appointmentDate)) {
            throw new RuntimeException("Doctor has a conflicting appointment");
        }

        // check patient conflicts
        if (hasPatientConflictingAppointment(patient, appointmentDate)) {
            throw new RuntimeException("You already have an appointment around this time");
        }

        Appointment appointment = new Appointment();
        appointment.setPatient(patient);
        appointment.setDoctor(doctor);
        appointment.setAppointmentDate(appointmentDate);
        appointment.setStatus(AppointmentStatus.UPCOMING);
        appointment.setNotes(notes);
        appointment.setCreatedAt(LocalDateTime.now());

        return appointmentRepository.save(appointment);
    }

    public Appointment rescheduleAppointment(Long appointmentId, LocalDateTime newDate) {
        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new RuntimeException("Appointment not found"));

        if (newDate.isBefore(LocalDateTime.now())) {
            throw new RuntimeException("Cannot reschedule to past time");
        }

        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        User currentUser = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        boolean isAdmin = currentUser.getRole() == UserRole.ADMIN;
        boolean isDoctor = currentUser.getRole() == UserRole.DOCTOR
                && appointment.getDoctor().getId().equals(currentUser.getId());
        boolean isPatient = currentUser.getRole() == UserRole.PATIENT
                && appointment.getPatient().getId().equals(currentUser.getId());

        if (!isAdmin && !isDoctor && !isPatient) {
            throw new RuntimeException("You can only reschedule your own appointment");
        }

        if (!isDoctorAvailable(appointment.getDoctor(), newDate)) {
            throw new RuntimeException("Doctor is not available at the selected time");
        }

        if (hasConflictingAppointment(appointment.getDoctor(), newDate)) {
            throw new RuntimeException("Doctor has a conflicting appointment");
        }

        appointment.setAppointmentDate(newDate);
        appointment.setStatus(AppointmentStatus.RESCHEDULED);
        appointment.setUpdatedAt(LocalDateTime.now());
        Appointment saved = appointmentRepository.save(appointment);

        String patientName = getDisplayName(appointment.getPatient());
        String doctorName = getDisplayName(appointment.getDoctor());
        String formattedDate = newDate.toString();

        notificationService.createNotification(appointment.getDoctor().getUsername(),
                "Appointment rescheduled",
                String.format("Appointment with %s rescheduled to %s", patientName, formattedDate),
                "info",
                "/dashboard/appointments");

        notificationService.createNotification(appointment.getPatient().getUsername(),
                "Appointment rescheduled",
                String.format("Appointment with Dr. %s rescheduled to %s", doctorName, formattedDate),
                "info",
                "/dashboard/appointments");

        return saved;
    }

    public Appointment completeAppointment(Long appointmentId, String diagnosis, String prescription, String notes,
            String followUpDate) {
        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new RuntimeException("Appointment not found"));

        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        User currentUser = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (currentUser.getRole() != UserRole.DOCTOR || !appointment.getDoctor().getId().equals(currentUser.getId())) {
            throw new RuntimeException("Only the assigned doctor can complete this appointment");
        }

        if (diagnosis == null || diagnosis.isBlank()) {
            throw new RuntimeException("Diagnosis is required to complete appointment");
        }

        if (followUpDate != null && !followUpDate.isBlank()) {
            notes = (notes == null ? "" : notes + "\n") + "Follow-up: " + followUpDate;
        }

        appointment.setStatus(AppointmentStatus.COMPLETED);
        appointment.setUpdatedAt(LocalDateTime.now());
        Appointment saved = appointmentRepository.save(appointment);

        medicalRecordService.createMedicalRecord(appointment, appointment.getDoctor(), appointment.getPatient(),
                diagnosis, prescription, notes);

        String doctorName = getDisplayName(appointment.getDoctor());
        notificationService.createNotification(appointment.getPatient().getUsername(),
                "Appointment completed",
                String.format("Dr. %s completed your appointment and created prescription.", doctorName),
                "success",
                "/dashboard/patients");

        return saved;
    }

    private String getDisplayName(User user) {
        if (user == null)
            return "Unknown";
        if (user.getProfile() != null) {
            String firstName = user.getProfile().getFirstName();
            String lastName = user.getProfile().getLastName();
            if (firstName != null && !firstName.isBlank()) {
                return firstName + (lastName != null && !lastName.isBlank() ? " " + lastName : "");
            }
        }
        return user.getUsername();
    }

    public List<String> getAvailableSlots(Long doctorId, LocalDate date) {
        User doctor = userRepository.findById(doctorId)
                .orElseThrow(() -> new RuntimeException("Doctor not found"));

        List<DoctorAvailability> availabilities = doctorAvailabilityRepository
                .findByDoctorAndIsAvailable(doctor, true);

        String javaDay = date.getDayOfWeek().name();
        List<DoctorAvailability> dayAvail = availabilities.stream()
                .filter(a -> a.getDayOfWeek() != null && a.getDayOfWeek().name().equalsIgnoreCase(javaDay))
                .collect(Collectors.toList());

        if (dayAvail.isEmpty()) {
            return new ArrayList<>();
        }

        DoctorAvailability availability = dayAvail.get(0);
        if (availability.getStartTime() == null || availability.getEndTime() == null
                || !availability.getIsAvailable()) {
            return new ArrayList<>();
        }

        int slotDuration = Optional.ofNullable(availability.getSlotDuration()).orElse(30);
        LocalDateTime start = LocalDateTime.of(date, availability.getStartTime());
        LocalDateTime end = LocalDateTime.of(date, availability.getEndTime());

        LocalDateTime breakStart = availability.getBreakStart() != null
                ? LocalDateTime.of(date, availability.getBreakStart())
                : null;
        LocalDateTime breakEnd = availability.getBreakEnd() != null ? LocalDateTime.of(date, availability.getBreakEnd())
                : null;

        List<LocalDateTime> doctorAppts = appointmentRepository.findByDoctorAndAppointmentDateBetween(
                doctor,
                LocalDateTime.of(date, LocalTime.MIN),
                LocalDateTime.of(date, LocalTime.MAX))
                .stream()
                .filter(a -> a.getStatus() != AppointmentStatus.CANCELLED)
                .map(Appointment::getAppointmentDate)
                .collect(Collectors.toList());

        List<String> slots = new ArrayList<>();
        LocalDateTime current = start;

        while (!current.plusMinutes(slotDuration).isAfter(end)) {
            final LocalDateTime slotStart = current;
            final LocalDateTime slotEnd = current.plusMinutes(slotDuration);

            boolean inBreak = false;
            if (breakStart != null && breakEnd != null) {
                if ((slotStart.isAfter(breakStart) || slotStart.isEqual(breakStart)) && slotStart.isBefore(breakEnd))
                    inBreak = true;
                if ((slotEnd.isAfter(breakStart) || slotEnd.isEqual(breakStart)) && slotEnd.isBefore(breakEnd))
                    inBreak = true;
            }

            boolean conflict = doctorAppts.stream().anyMatch(appt -> {
                LocalDateTime apptStart = appt;
                LocalDateTime apptEnd = appt.plusMinutes(slotDuration);
                return !apptEnd.isBefore(slotStart) && !apptStart.isAfter(slotEnd);
            });

            if (!inBreak && !conflict && !current.isBefore(LocalDateTime.now())) {
                slots.add(current.toLocalTime().toString());
            }

            current = current.plusMinutes(slotDuration);
        }

        return slots;
    }

    private boolean hasPatientConflictingAppointment(User patient, LocalDateTime appointmentDate) {
        LocalDateTime startRange = appointmentDate.minusMinutes(30);
        LocalDateTime endRange = appointmentDate.plusMinutes(30);

        List<Appointment> conflictingAppointments = appointmentRepository
                .findByPatientAndAppointmentDateBetween(patient, startRange, endRange);

        return conflictingAppointments.stream().anyMatch(a -> a.getStatus() != AppointmentStatus.CANCELLED);
    }

    public List<Appointment> getDoctorSchedule(Long doctorId) {
        User doctor = userRepository.findById(doctorId)
                .orElseThrow(() -> new RuntimeException("Doctor not found"));

        return appointmentRepository.findByDoctor(doctor);
    }

    public List<Appointment> getAppointments(UserDetailsImpl currentUser) {
        User user = userRepository.findByUsername(currentUser.getUsername())
                .orElseThrow(() -> new RuntimeException("Current user not found"));

        if (user.getRole() == UserRole.ADMIN || user.getRole() == UserRole.NURSE) {
            return appointmentRepository.findAll();
        } else if (user.getRole() == UserRole.DOCTOR) {
            return appointmentRepository.findByDoctor(user);
        } else if (user.getRole() == UserRole.PATIENT) {
            return appointmentRepository.findByPatient(user);
        }
        return new ArrayList<>();
    }

    public List<Appointment> getPatientAppointments() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        User patient = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Patient not found"));

        return appointmentRepository.findByPatient(patient);
    }

    public List<Appointment> getPatientAppointments(Long patientId) {
        User patient = userRepository.findById(patientId)
                .orElseThrow(() -> new RuntimeException("Patient not found"));
        return appointmentRepository.findByPatient(patient);
    }

    public List<Appointment> getAllAppointments() {
        return appointmentRepository.findAll();
    }

    public Appointment updateAppointmentStatus(Long appointmentId, AppointmentStatus status) {
        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new RuntimeException("Appointment not found"));

        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        User currentUser = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        boolean isAdmin = currentUser.getRole() == UserRole.ADMIN;
        boolean isDoctor = currentUser.getRole() == UserRole.DOCTOR
                && appointment.getDoctor().getId().equals(currentUser.getId());
        boolean isPatient = currentUser.getRole() == UserRole.PATIENT
                && appointment.getPatient().getId().equals(currentUser.getId());

        if (status == AppointmentStatus.COMPLETED) {
            if (!isDoctor) {
                throw new RuntimeException("Only doctor can complete the appointment");
            }
        } else if (status == AppointmentStatus.CANCELLED) {
            if (!isAdmin && !isDoctor && !isPatient) {
                throw new RuntimeException("You can only cancel your own appointments");
            }
        } else if (status == AppointmentStatus.RESCHEDULED || status == AppointmentStatus.UPCOMING) {
            if (!isAdmin && !isDoctor && !isPatient) {
                throw new RuntimeException("You can only reschedule your own appointments");
            }
        } else if (status == AppointmentStatus.SCHEDULED) {
            if (!isAdmin && !isDoctor && !isPatient) {
                throw new RuntimeException("Unauthorized status change");
            }
        }

        appointment.setStatus(status);
        appointment.setUpdatedAt(LocalDateTime.now());
        return appointmentRepository.save(appointment);
    }

    public Appointment cancelAppointment(Long appointmentId, User currentUser) {
        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new RuntimeException("Appointment not found"));

        boolean isAdmin = currentUser.getRole() == UserRole.ADMIN;
        boolean isDoctor = currentUser.getRole() == UserRole.DOCTOR
                && appointment.getDoctor().getId().equals(currentUser.getId());
        boolean isPatient = currentUser.getRole() == UserRole.PATIENT
                && appointment.getPatient().getId().equals(currentUser.getId());

        if (!isAdmin && !isDoctor && !isPatient) {
            throw new RuntimeException("You can only cancel your own appointments");
        }

        if (appointment.getStatus() != AppointmentStatus.UPCOMING
                && appointment.getStatus() != AppointmentStatus.RESCHEDULED) {
            throw new RuntimeException("Only upcoming or rescheduled appointments can be cancelled");
        }

        appointment.setStatus(AppointmentStatus.CANCELLED);
        appointment.setUpdatedAt(LocalDateTime.now());
        Appointment saved = appointmentRepository.save(appointment);

        String formattedDate = appointment.getAppointmentDate().toString();
        String patientName = getDisplayName(appointment.getPatient());
        String doctorName = getDisplayName(appointment.getDoctor());

        if (isPatient || isAdmin) {
            notificationService.createNotification(appointment.getDoctor().getUsername(),
                    "Appointment cancelled",
                    String.format("%s cancelled the appointment with %s on %s", patientName, doctorName, formattedDate),
                    "warning",
                    "/dashboard/appointments");
        }

        if (isDoctor || isAdmin) {
            notificationService.createNotification(appointment.getPatient().getUsername(),
                    "Appointment cancelled",
                    String.format("%s cancelled the appointment with %s on %s", doctorName, patientName, formattedDate),
                    "warning",
                    "/dashboard/appointments");
        }

        return saved;
    }

    private boolean isDoctorAvailable(User doctor, LocalDateTime appointmentDate) {
        DayOfWeek dayOfWeek = DayOfWeek.valueOf(appointmentDate.getDayOfWeek().name());
        LocalTime appointmentTime = appointmentDate.toLocalTime();

        List<DoctorAvailability> availabilities = doctorAvailabilityRepository
                .findByDoctorAndIsAvailable(doctor, true);

        // If doctor has no availability records defined, they are not available
        if (availabilities.isEmpty()) {
            return false;
        }

        for (DoctorAvailability availability : availabilities) {
            if (!availability.getDayOfWeek().equals(dayOfWeek))
                continue;
            if (availability.getStartTime() == null || availability.getEndTime() == null)
                continue;
            if (appointmentTime.isBefore(availability.getStartTime())
                    || appointmentTime.isAfter(availability.getEndTime())) {
                continue;
            }

            if (availability.getBreakStart() != null && availability.getBreakEnd() != null) {
                if (!appointmentTime.isBefore(availability.getBreakStart())
                        && appointmentTime.isBefore(availability.getBreakEnd())) {
                    continue;
                }
            }

            return true;
        }

        return false;
    }

    private boolean hasConflictingAppointment(User doctor, LocalDateTime appointmentDate) {
        int slotDuration = getSlotDurationForDoctor(doctor, appointmentDate);
        LocalDateTime startRange = appointmentDate.minusMinutes(slotDuration);
        LocalDateTime endRange = appointmentDate.plusMinutes(slotDuration);

        List<Appointment> conflictingAppointments = appointmentRepository
                .findByDoctorAndAppointmentDateBetween(doctor, startRange, endRange);

        return conflictingAppointments.stream()
                .anyMatch(a -> a.getStatus() != AppointmentStatus.CANCELLED);
    }

    private int getSlotDurationForDoctor(User doctor, LocalDateTime appointmentDate) {
        DayOfWeek dayOfWeek = DayOfWeek.valueOf(appointmentDate.getDayOfWeek().name());
        List<DoctorAvailability> availabilities = doctorAvailabilityRepository
                .findByDoctorAndIsAvailable(doctor, true);

        for (DoctorAvailability availability : availabilities) {
            if (availability.getDayOfWeek().equals(dayOfWeek)) {
                return Optional.ofNullable(availability.getSlotDuration()).orElse(30);
            }
        }
        return 30;
    }
}