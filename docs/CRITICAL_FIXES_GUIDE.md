# Health Hub HMS - CRITICAL FIXES GUIDE

## URGENT: CRITICAL ISSUE #1 - Missing ObjectMapper Bean

### Problem
```
NoSuchBeanDefinitionException: No qualifying bean of type 'com.fasterxml.jackson.databind.ObjectMapper'
```

### Location
- **File**: `backend/src/main/java/com/medicare/hms/service/PrescriptionService.java`
- **Line**: 46
- **Issue**: `@Autowired private ObjectMapper objectMapper;` has no bean definition

### Solution

**Option 1: Add to SecurityConfig.java** (Recommended)

Edit `backend/src/main/java/com/medicare/hms/security/SecurityConfig.java`:

```java
package com.medicare.hms.security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import com.fasterxml.jackson.databind.ObjectMapper;
// ... other imports ...

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {
    
    // ... existing code ...
    
    @Bean
    public ObjectMapper objectMapper() {
        ObjectMapper objectMapper = new ObjectMapper();
        // Optional: Additional configuration
        objectMapper.findAndRegisterModules();
        return objectMapper;
    }
    
    // ... rest of existing code ...
}
```

**Option 2: Create New Configuration Class**

Create new file: `backend/src/main/java/com/medicare/hms/config/JacksonConfig.java`:

```java
package com.medicare.hms.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class JacksonConfig {
    
    @Bean
    public ObjectMapper objectMapper() {
        ObjectMapper objectMapper = new ObjectMapper();
        objectMapper.findAndRegisterModules();
        return objectMapper;
    }
}
```

### Verification
After fix, run:
```bash
mvn clean compile
```

The `PrescriptionService` should now compile without errors.

---

## CRITICAL ISSUE #2 - Database Schema Mismatches

### Problem
Database schema doesn't match JPA entities, causing data loss and mapping failures.

### Missing Columns

**File**: `database/medicare_schema.sql`

**Issue 1: Missing 'link' in notifications table**
```sql
-- CURRENT (INCOMPLETE)
CREATE TABLE notifications (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT,
    type ENUM('INFO', 'WARNING', 'ERROR') DEFAULT 'INFO',
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- SHOULD BE
CREATE TABLE notifications (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT,
    type VARCHAR(50),  -- Changed from ENUM to VARCHAR
    is_read BOOLEAN DEFAULT FALSE,
    link VARCHAR(255),  -- ADDED THIS LINE
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);
```

**Issue 2: Missing emergency contact fields in profiles table**
```sql
-- CURRENT (INCOMPLETE)
CREATE TABLE profiles (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    first_name VARCHAR(50),
    last_name VARCHAR(50),
    phone VARCHAR(20),
    address TEXT,
    date_of_birth DATE,
    gender ENUM('MALE', 'FEMALE', 'OTHER'),
    avatar VARCHAR(255),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- SHOULD BE
CREATE TABLE profiles (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    first_name VARCHAR(50),
    last_name VARCHAR(50),
    phone VARCHAR(20),
    address TEXT,
    date_of_birth DATE,
    gender ENUM('MALE', 'FEMALE', 'OTHER'),
    avatar VARCHAR(255),
    blood_group VARCHAR(10),  -- ADDED
    emergency_name VARCHAR(100),  -- ADDED
    emergency_phone VARCHAR(20),  -- ADDED
    emergency_relation VARCHAR(50),  -- ADDED
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

**Issue 3: Wrong medicines field type**
```sql
-- CURRENT (NOT IDEAL)
prescriptions table: medicines TEXT

-- SHOULD BE
prescriptions table: medicines JSON  -- Better for JSON storage
```

### SQL Migration

**Create Migration File**: `database/migration_fix_schema.sql`

```sql
-- Fix missing link column in notifications
ALTER TABLE notifications ADD COLUMN link VARCHAR(255);

-- Change notification type from ENUM to VARCHAR
ALTER TABLE notifications MODIFY COLUMN type VARCHAR(50);

-- Add missing blood_group column to profiles
ALTER TABLE profiles ADD COLUMN blood_group VARCHAR(10);

-- Add emergency contact fields to profiles
ALTER TABLE profiles ADD COLUMN emergency_name VARCHAR(100);
ALTER TABLE profiles ADD COLUMN emergency_phone VARCHAR(20);
ALTER TABLE profiles ADD COLUMN emergency_relation VARCHAR(50);

-- Update medicines field type (if using MySQL 5.7.8+)
ALTER TABLE prescriptions MODIFY COLUMN medicines JSON;
```

### Execute Migration
```bash
mysql -u root -p medicare_hms < database/migration_fix_schema.sql
```

---

## IMPORTANT ISSUE #1 - Missing AppointmentService Methods

### Problem
The following methods are referenced but incomplete/missing:
- `isDoctorAvailable()`
- `hasConflictingAppointment()`
- `hasPatientConflictingAppointment()`
- `getAppointments()`
- `getDisplayName()`

### Solution

Edit: `backend/src/main/java/com/medicare/hms/service/AppointmentService.java`

Add these methods at the end of the class:

```java
private boolean isDoctorAvailable(User doctor, LocalDateTime appointmentDateTime) {
    java.time.DayOfWeek dayOfWeek = appointmentDateTime.getDayOfWeek();
    java.time.LocalTime time = appointmentDateTime.toLocalTime();
    
    List<DoctorAvailability> availabilities = doctorAvailabilityRepository.findByDoctor(doctor);
    
    for (DoctorAvailability availability : availabilities) {
        if (availability.getDayOfWeek().name().equals(dayOfWeek.name())) {
            boolean withinWorkHours = (time.isAfter(availability.getStartTime()) || time.equals(availability.getStartTime()))
                    && (time.isBefore(availability.getEndTime()) || time.equals(availability.getEndTime()));
            
            if (!withinWorkHours) {
                return false;
            }
            
            // Check break time
            if (availability.getBreakStart() != null && availability.getBreakEnd() != null) {
                boolean inBreak = (time.isAfter(availability.getBreakStart()) || time.equals(availability.getBreakStart()))
                        && (time.isBefore(availability.getBreakEnd()) || time.equals(availability.getBreakEnd()));
                if (inBreak) {
                    return false;
                }
            }
            
            return availability.getIsAvailable();
        }
    }
    
    return false;
}

private boolean hasConflictingAppointment(User doctor, LocalDateTime appointmentDateTime) {
    LocalDateTime startBuffer = appointmentDateTime.minusMinutes(30);
    LocalDateTime endBuffer = appointmentDateTime.plusMinutes(30);
    
    List<Appointment> existingAppointments = appointmentRepository
            .findByDoctorAndAppointmentDateBetween(doctor, startBuffer, endBuffer);
    
    return !existingAppointments.isEmpty();
}

private boolean hasPatientConflictingAppointment(User patient, LocalDateTime appointmentDateTime) {
    LocalDateTime startBuffer = appointmentDateTime.minusMinutes(30);
    LocalDateTime endBuffer = appointmentDateTime.plusMinutes(30);
    
    List<Appointment> existingAppointments = appointmentRepository
            .findByPatientAndAppointmentDateBetween(patient, startBuffer, endBuffer);
    
    return !existingAppointments.isEmpty();
}

private String getDisplayName(User user) {
    if (user.getProfile() != null) {
        String firstName = user.getProfile().getFirstName() != null ? user.getProfile().getFirstName() : "";
        String lastName = user.getProfile().getLastName() != null ? user.getProfile().getLastName() : "";
        String fullName = (firstName + " " + lastName).trim();
        return fullName.isEmpty() ? user.getUsername() : fullName;
    }
    return user.getUsername();
}

public List<Appointment> getAppointments(UserDetailsImpl currentUser) {
    User user = userRepository.findByUsername(currentUser.getUsername())
            .orElseThrow(() -> new RuntimeException("User not found"));
    
    if (user.getRole() == UserRole.ADMIN) {
        return appointmentRepository.findAll();
    } else if (user.getRole() == UserRole.DOCTOR || user.getRole() == UserRole.NURSE) {
        return appointmentRepository.findByDoctor(user);
    } else if (user.getRole() == UserRole.PATIENT) {
        return appointmentRepository.findByPatient(user);
    }
    
    return new ArrayList<>();
}
```

---

## IMPORTANT ISSUE #2 - Missing Controller Endpoints

### Problem
Frontend expects these endpoints but they don't exist in backend.

### Solution

Edit: `backend/src/main/java/com/medicare/hms/controller/AppointmentController.java`

Replace the entire file with:

```java
package com.medicare.hms.controller;

import com.medicare.hms.dto.AppointmentRequest;
import com.medicare.hms.entity.Appointment;
import com.medicare.hms.entity.AppointmentStatus;
import com.medicare.hms.entity.User;
import com.medicare.hms.repository.UserRepository;
import com.medicare.hms.security.UserDetailsImpl;
import com.medicare.hms.service.AppointmentService;
import com.medicare.hms.dto.AppointmentResponse;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/appointments")
@CrossOrigin
public class AppointmentController {

    @Autowired
    private AppointmentService appointmentService;

    @Autowired
    private UserRepository userRepository;

    // All roles: Get filtered appointments
    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<AppointmentResponse>> getAppointments(
            @AuthenticationPrincipal UserDetailsImpl currentUser) {
        List<Appointment> appointments = appointmentService.getAppointments(currentUser);
        return ResponseEntity.ok(toDtoList(appointments));
    }

    // Patient: Get my appointments
    @GetMapping("/my")
    @PreAuthorize("hasAnyRole('PATIENT', 'DOCTOR', 'ADMIN')")
    public ResponseEntity<List<AppointmentResponse>> getMyAppointments(
            @AuthenticationPrincipal UserDetailsImpl currentUser) {
        List<Appointment> appointments = appointmentService.getAppointments(currentUser);
        return ResponseEntity.ok(toDtoList(appointments));
    }

    // Doctor: Get doctor's schedule
    @GetMapping("/doctor/{doctorId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'DOCTOR')")
    public ResponseEntity<List<AppointmentResponse>> getDoctorSchedule(
            @PathVariable Long doctorId) {
        User doctor = userRepository.findById(doctorId)
                .orElseThrow(() -> new RuntimeException("Doctor not found"));
        List<Appointment> appointments = appointmentService.getAppointmentsByDoctor(doctor);
        return ResponseEntity.ok(toDtoList(appointments));
    }

    // Get patient appointments (admin/doctor) or own (patient)
    @GetMapping("/patient/{patientId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'DOCTOR', 'NURSE', 'PATIENT')")
    public ResponseEntity<List<AppointmentResponse>> getPatientAppointments(
            @PathVariable Long patientId,
            @AuthenticationPrincipal UserDetailsImpl currentUser) {
        User patient = userRepository.findById(patientId)
                .orElseThrow(() -> new RuntimeException("Patient not found"));
        List<Appointment> appointments = appointmentService.getAppointmentsByPatient(patient);
        return ResponseEntity.ok(toDtoList(appointments));
    }

    // Admin: Get all appointments
    @GetMapping("/all")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<AppointmentResponse>> getAllAppointments() {
        List<Appointment> appointments = appointmentService.getAllAppointments();
        return ResponseEntity.ok(toDtoList(appointments));
    }

    // Create appointment (book new)
    @PostMapping
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN','ROLE_DOCTOR','ROLE_NURSE','ROLE_PATIENT')")
    public ResponseEntity<?> createAppointment(
            @Valid @RequestBody AppointmentRequest request,
            @AuthenticationPrincipal UserDetailsImpl currentUser) {
        try {
            Long patientId = request.getPatientId();
            if (currentUser.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_PATIENT"))) {
                patientId = currentUser.getId();
            }

            Appointment appointment = appointmentService.bookAppointment(request.getDoctorId(), patientId,
                    request.getAppointmentDate(), request.getNotes(), currentUser);

            return ResponseEntity.status(HttpStatus.CREATED).body(toDto(appointment));
        } catch (RuntimeException e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    // Patient/Doctor/Admin: Book an appointment
    @PostMapping("/book")
    @PreAuthorize("hasAnyAuthority('ROLE_PATIENT','ROLE_DOCTOR','ROLE_ADMIN')")
    public ResponseEntity<?> bookAppointment(
            @Valid @RequestBody AppointmentRequest request,
            @AuthenticationPrincipal UserDetailsImpl currentUser) {
        try {
            Appointment appointment = appointmentService.bookAppointment(
                    request.getDoctorId(),
                    request.getPatientId(),
                    request.getAppointmentDate(),
                    request.getNotes(),
                    currentUser);
            return ResponseEntity.status(HttpStatus.CREATED).body(toDto(appointment));
        } catch (RuntimeException e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    // Update appointment status
    @PutMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('ADMIN', 'DOCTOR', 'PATIENT')")
    public ResponseEntity<?> updateAppointmentStatus(
            @PathVariable Long id,
            @RequestParam String status,
            @AuthenticationPrincipal UserDetailsImpl currentUser) {
        try {
            Appointment appointment = appointmentService.updateAppointmentStatus(id, status, currentUser);
            return ResponseEntity.ok(toDto(appointment));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // Reschedule appointment
    @PatchMapping("/{id}/reschedule")
    @PreAuthorize("hasAnyRole('ADMIN', 'DOCTOR', 'PATIENT')")
    public ResponseEntity<?> rescheduleAppointment(
            @PathVariable Long id,
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal UserDetailsImpl currentUser) {
        try {
            LocalDateTime newDate = LocalDateTime.parse(body.get("new_date"));
            Appointment appointment = appointmentService.rescheduleAppointment(id, newDate);
            return ResponseEntity.ok(toDto(appointment));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // Delete appointment
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'DOCTOR', 'PATIENT')")
    public ResponseEntity<?> cancelAppointment(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetailsImpl currentUser) {
        try {
            appointmentService.cancelAppointment(id);
            return ResponseEntity.ok(Map.of("message", "Appointment cancelled"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    private AppointmentResponse toDto(Appointment appointment) {
        return new AppointmentResponse(
                appointment.getId(),
                appointment.getPatient().getId(),
                appointment.getPatient().getUsername(),
                appointment.getDoctor().getId(),
                appointment.getDoctor().getUsername(),
                appointment.getAppointmentDate(),
                appointment.getStatus().name().toLowerCase(),
                appointment.getNotes(),
                appointment.getCreatedAt());
    }

    private List<AppointmentResponse> toDtoList(List<Appointment> appointments) {
        return appointments.stream().map(this::toDto).toList();
    }
}
```

---

## IMPORTANT ISSUE #3 - Security Configuration Issues

### Problem
Hardcoded credentials and inconsistent security configuration.

### Solution 1: Use Environment Variables

Edit: `backend/src/main/resources/application.properties`

Replace with:
```properties
# Server Configuration
server.port=8080

# Database Configuration (use environment variables)
spring.datasource.url=${DB_URL:jdbc:mysql://localhost:3306/medicare_hms?createDatabaseIfNotExist=true&useSSL=false&allowPublicKeyRetrieval=true}
spring.datasource.username=${DB_USER:root}
spring.datasource.password=${DB_PASSWORD:root1234}
spring.datasource.driver-class-name=com.mysql.cj.jdbc.Driver

# JPA/Hibernate Configuration
spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=false
spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.MySQLDialect

# JWT Configuration
jwt.secret=${JWT_SECRET:9a4f2c8d3b7a1e5f9a4f2c8d3b7a1e5f9a4f2c8d3b7a1e5f9a4f2c8d3b7a1e5f}
jwt.expiration=${JWT_EXPIRATION:86400000}

# CORS Configuration
CORS_ALLOWED_ORIGINS=${CORS_ALLOWED_ORIGINS:http://localhost:5173,http://localhost:8080}

# Cloudinary Configuration
cloudinary.cloud_name=${CLOUDINARY_CLOUD_NAME:dlg2lxorm}
cloudinary.api_key=${CLOUDINARY_API_KEY:164228122174883}
cloudinary.api_secret=${CLOUDINARY_API_SECRET:ZppImxiNjE8lvUampEQ_EEIbGSA}

# Google OAuth2
spring.security.oauth2.client.registration.google.client-id=${GOOGLE_CLIENT_ID}
spring.security.oauth2.client.registration.google.client-secret=${GOOGLE_CLIENT_SECRET}
spring.security.oauth2.client.registration.google.scope=openid,profile,email

# Frontend URL
app.frontend.url=${FRONTEND_URL:http://localhost:5173}

# File Upload
spring.servlet.multipart.max-file-size=10MB
spring.servlet.multipart.max-request-size=10MB

# Logging
logging.level.org.springframework.web=INFO
logging.level.com.medicare.hms=DEBUG
```

### Solution 2: Fix JWT Secret Quality

The current secret contains invalid hex characters. Create a proper Base64-encoded secret:

```bash
# Generate a secure JWT secret (Linux/Mac)
openssl rand -base64 64

# Or use Java
echo $(java -cp .:/path/to/commons-codec.jar org.apache.commons.codec.binary.Base64.encodeBase64String(java.util.UUID.randomUUID().toString().getBytes()))
```

Use the generated secret:
```properties
jwt.secret=<generated-base64-string>
```

---

## Verification Checklist

After applying all fixes:

```bash
# 1. Clean and rebuild
mvn clean build

# 2. Run tests (if any)
mvn test

# 3. Start backend
mvn spring-boot:run

# 4. Check logs for these error messages - should not appear:
# - NoSuchBeanDefinitionException
# - SQLException (schema issues)
# - Method not found errors

# 5. Test API endpoints
curl -X GET http://localhost:8080/api/appointments \
  -H "Authorization: Bearer <token>"
```

---

## Additional Required Changes

### To AppointmentService.java - Add these method stubs

```java
public List<Appointment> getAppointmentsByDoctor(User doctor) {
    return appointmentRepository.findByDoctor(doctor);
}

public List<Appointment> getAppointmentsByPatient(User patient) {
    return appointmentRepository.findByPatient(patient);
}

public List<Appointment> getAllAppointments() {
    return appointmentRepository.findAll();
}

public Appointment updateAppointmentStatus(Long appointmentId, String status, UserDetailsImpl currentUser) {
    Appointment appointment = appointmentRepository.findById(appointmentId)
            .orElseThrow(() -> new RuntimeException("Appointment not found"));
    
    try {
        appointment.setStatus(AppointmentStatus.valueOf(status.toUpperCase()));
        appointment.setUpdatedAt(LocalDateTime.now());
        return appointmentRepository.save(appointment);
    } catch (IllegalArgumentException e) {
        throw new RuntimeException("Invalid appointment status: " + status);
    }
}

public void cancelAppointment(Long appointmentId) {
    Appointment appointment = appointmentRepository.findById(appointmentId)
            .orElseThrow(() -> new RuntimeException("Appointment not found"));
    
    appointment.setStatus(AppointmentStatus.CANCELLED);
    appointment.setUpdatedAt(LocalDateTime.now());
    appointmentRepository.save(appointment);
}
```

---

**Last Updated**: April 19, 2026
**Status**: READY FOR IMPLEMENTATION
