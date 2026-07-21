# Medicare Cure Hub — Database Schema

**Source of truth:** JPA entities (`ddl-auto=update`)  
**Database:** MySQL `medicare_hms`  
**SQL schema file:** `medicare_schema.sql` (reference only — may lag behind entities)

---

## 1. `users`

Stores all user accounts (ADMIN, DOCTOR, NURSE, PATIENT, PHARMACIST, LAB_TECHNICIAN).

| Column      | Type                                                          | Constraints      |
|-------------|---------------------------------------------------------------|------------------|
| id          | BIGINT                                                        | PK, AUTO_INCREMENT |
| username    | VARCHAR(50)                                                   | UNIQUE, NOT NULL  |
| email       | VARCHAR(100)                                                  | UNIQUE, NOT NULL  |
| password    | VARCHAR(255)                                                  | NOT NULL          |
| role        | ENUM(ADMIN,DOCTOR,NURSE,PATIENT,PHARMACIST,LAB_TECHNICIAN)    | NOT NULL          |
| created_at  | TIMESTAMP                                                     |                  |
| updated_at  | TIMESTAMP                                                     |                  |

**Relationships:**
- `1:1` → `profiles` via `user_id`
- `1:N` → `appointments` as patient / doctor
- `1:N` → `medical_records` as patient / doctor
- `1:N` → `prescriptions` as patient / doctor
- `1:N` → `lab_reports` as patient / doctor
- `1:N` → `test_reports` as patient / doctor
- `1:N` → `billing_invoices` as patient / doctor
- `1:N` → `notifications` via `user_id`
- `1:N` → `doctor_availability` as doctor

---

## 2. `profiles`

Extended profile data for every user.

| Column                 | Type                        | Constraints                  |
|------------------------|-----------------------------|------------------------------|
| id                     | BIGINT                      | PK, AUTO_INCREMENT            |
| user_id                | BIGINT                      | FK → users(id), NOT NULL      |
| first_name             | VARCHAR(50)                 |                              |
| last_name              | VARCHAR(50)                 |                              |
| phone                  | VARCHAR(20)                 |                              |
| address                | TEXT                        |                              |
| date_of_birth          | DATE                        |                              |
| gender                 | ENUM(MALE,FEMALE,OTHER)     |                              |
| avatar                 | VARCHAR(255)                | Cloudinary URL               |
| blood_group            | VARCHAR(255)                |                              |
| emergency_name         | VARCHAR(255)                |                              |
| emergency_phone        | VARCHAR(255)                |                              |
| emergency_relation     | VARCHAR(255)                |                              |
| specialization         | VARCHAR(255)                | Doctor specialty             |
| degrees                | VARCHAR(255)                | e.g. MBBS, FCPS, MD          |
| education              | VARCHAR(255)                | Medical school               |
| experience_years       | INT                         |                              |
| experience_details     | TEXT                        |                              |
| insurance_provider     | VARCHAR(255)                | Patient insurance provider   |
| insurance_policy_number| VARCHAR(255)                | Patient insurance policy #   |

> **SQL schema discrepancy:** Missing columns `blood_group`, `emergency_name`, `emergency_phone`, `emergency_relation`, `insurance_provider`, `insurance_policy_number`. JPA will auto-add them.

---

## 3. `appointments`

Patient appointments with doctors.

| Column           | Type                                                         | Constraints                  |
|------------------|--------------------------------------------------------------|------------------------------|
| id               | BIGINT                                                       | PK, AUTO_INCREMENT            |
| patient_id       | BIGINT                                                       | FK → users(id), NOT NULL      |
| doctor_id        | BIGINT                                                       | FK → users(id), NOT NULL      |
| appointment_date | DATETIME                                                     | NOT NULL                      |
| status           | ENUM(SCHEDULED,UPCOMING,RESCHEDULED,COMPLETED,CANCELLED)     | DEFAULT 'SCHEDULED'           |
| notes            | TEXT                                                         |                              |
| created_at       | TIMESTAMP                                                    |                              |
| updated_at       | TIMESTAMP                                                    |                              |

---

## 4. `medical_records`

Diagnosis, prescription and visit notes per appointment.

| Column         | Type        | Constraints                     |
|----------------|-------------|----------------------------------|
| id             | BIGINT      | PK, AUTO_INCREMENT               |
| patient_id     | BIGINT      | FK → users(id), NOT NULL         |
| doctor_id      | BIGINT      | FK → users(id), NOT NULL         |
| appointment_id | BIGINT      | FK → appointments(id), NULLABLE  |
| diagnosis      | TEXT        |                                  |
| prescription   | TEXT        |                                  |
| notes          | TEXT        |                                  |
| record_date    | DATETIME    |                                  |
| created_at     | TIMESTAMP   |                                  |
| updated_at     | TIMESTAMP   |                                  |

> **SQL schema discrepancy:** Entity has `notes` column; SQL schema has `treatment` instead. JPA drives the real schema — `notes` is what exists.

---

## 5. `prescriptions`

Medication prescriptions issued by doctors.

| Column         | Type                                  | Constraints                     |
|----------------|---------------------------------------|----------------------------------|
| id             | BIGINT                                | PK, AUTO_INCREMENT               |
| patient_id     | BIGINT                                | FK → users(id), NOT NULL         |
| doctor_id      | BIGINT                                | FK → users(id), NOT NULL         |
| appointment_id | BIGINT                                | FK → appointments(id), NULLABLE  |
| medicines      | TEXT                                  | JSON string                      |
| notes          | TEXT                                  |                                  |
| status         | ENUM(PENDING,DISPENSED,CANCELLED)     | DEFAULT 'PENDING'                |
| created_at     | TIMESTAMP                             |                                  |
| updated_at     | TIMESTAMP                             |                                  |

> **SQL schema discrepancy:** Missing `appointment_id` column. JPA will auto-add it.

---

## 6. `medicines`

Pharmacy inventory.

| Column         | Type          | Constraints            |
|----------------|---------------|------------------------|
| id             | BIGINT        | PK, AUTO_INCREMENT     |
| name           | VARCHAR(255)  | NOT NULL               |
| generic_name   | VARCHAR(255)  | NOT NULL               |
| category       | VARCHAR(255)  |                        |
| price          | DECIMAL       | NOT NULL               |
| stock_quantity | INT           | NOT NULL               |
| expiry_date    | DATE          |                        |

> **SQL schema discrepancy:** Entity has `generic_name`, `category`, `expiry_date` (no `description`, no `created_at`). JPA drives the real schema.

---

## 7. `lab_tests`

Master list of available lab tests.

| Column      | Type          | Constraints        |
|-------------|---------------|--------------------|
| id          | BIGINT        | PK, AUTO_INCREMENT |
| test_name   | VARCHAR(255)  | NOT NULL           |
| description | TEXT          |                    |
| cost        | DECIMAL       | NOT NULL           |

> **SQL schema discrepancy:** Entire table missing from `medicare_schema.sql`. JPA creates it.

---

## 8. `test_reports`

Lab test results linked to a specific lab test type.

| Column      | Type                           | Constraints                     |
|-------------|--------------------------------|----------------------------------|
| id          | BIGINT                         | PK, AUTO_INCREMENT               |
| lab_test_id | BIGINT                         | FK → lab_tests(id), NOT NULL     |
| patient_id  | BIGINT                         | FK → users(id), NOT NULL         |
| doctor_id   | BIGINT                         | FK → users(id), NOT NULL         |
| result      | TEXT                           |                                  |
| result_url  | VARCHAR(255)                   |                                  |
| status      | ENUM(PENDING,IN_PROGRESS,COMPLETED) |                              |
| created_at  | TIMESTAMP                      |                                  |
| updated_at  | TIMESTAMP                      |                                  |

> **SQL schema discrepancy:** Entire table missing from `medicare_schema.sql`. JPA creates it.

---

## 9. `lab_reports`

Simplified lab reports (can exist without a `lab_tests` entry).

| Column     | Type          | Constraints                  |
|------------|---------------|------------------------------|
| id         | BIGINT        | PK, AUTO_INCREMENT            |
| patient_id | BIGINT        | FK → users(id), NOT NULL      |
| doctor_id  | BIGINT        | FK → users(id)               |
| test_name  | VARCHAR(100)  | NOT NULL                      |
| result     | TEXT          |                              |
| file_path  | VARCHAR(255)  |                              |
| test_date  | DATE          | NOT NULL                      |
| created_at | TIMESTAMP     |                              |
| updated_at | TIMESTAMP     |                              |

---

## 10. `billing_invoices`

Financial invoices per patient visit.

| Column         | Type            | Constraints                     |
|----------------|-----------------|----------------------------------|
| id             | BIGINT          | PK, AUTO_INCREMENT               |
| invoice_number | VARCHAR(50)     | UNIQUE                           |
| patient_id     | BIGINT          | FK → users(id), NOT NULL         |
| doctor_id      | BIGINT          | FK → users(id)                   |
| doctor_fee     | DECIMAL(10,2)   | DEFAULT 0                        |
| lab_fee        | DECIMAL(10,2)   | DEFAULT 0                        |
| pharmacy_fee   | DECIMAL(10,2)   | DEFAULT 0                        |
| total_amount   | DECIMAL(10,2)   | NOT NULL                         |
| status         | ENUM(PENDING,PAID,OVERDUE) | NOT NULL          |
| created_at     | TIMESTAMP       |                                  |
| updated_at     | TIMESTAMP       |                                  |

---

## 11. `notifications`

Push-style notifications for users.

| Column     | Type                           | Constraints                  |
|------------|--------------------------------|------------------------------|
| id         | BIGINT                         | PK, AUTO_INCREMENT            |
| user_id    | BIGINT                         | FK → users(id), NOT NULL      |
| title      | VARCHAR(255)                   |                              |
| message    | TEXT                           |                              |
| type       | ENUM(INFO,WARNING,ERROR)       | DEFAULT 'INFO'                |
| is_read    | BOOLEAN                        | DEFAULT FALSE                 |
| link       | VARCHAR(255)                   |                              |
| created_at | TIMESTAMP                      |                              |

---

## 12. `doctor_availability`

Weekly availability schedule for doctors.

| Column        | Type                                                | Constraints                 |
|---------------|-----------------------------------------------------|-----------------------------|
| id            | BIGINT                                              | PK, AUTO_INCREMENT           |
| doctor_id     | BIGINT                                              | FK → users(id), NOT NULL     |
| day_of_week   | ENUM(MONDAY,TUESDAY,WEDNESDAY,THURSDAY,FRIDAY,SATURDAY,SUNDAY) | NOT NULL    |
| start_time    | TIME                                                | NOT NULL                     |
| end_time      | TIME                                                | NOT NULL                     |
| break_start   | TIME                                                |                             |
| break_end     | TIME                                                |                             |
| slot_duration | INT                                                 | DEFAULT 30                   |
| is_available  | BOOLEAN                                             | DEFAULT TRUE                 |

---

## 13. `roles`

Legacy roles table (not actively used by the application).

| Column | Type          | Constraints          |
|--------|---------------|----------------------|
| id     | BIGINT        | PK, AUTO_INCREMENT    |
| name   | VARCHAR(50)   | UNIQUE, NOT NULL      |

---

## Relationship Map

```
users
 ├── profiles                          (1:1)
 ├── appointments                      (1:N as patient + 1:N as doctor)
 ├── medical_records                   (1:N as patient + 1:N as doctor)
 ├── prescriptions                     (1:N as patient + 1:N as doctor)
 ├── lab_reports                       (1:N as patient + 1:N as doctor)
 ├── test_reports                      (1:N as patient + 1:N as doctor)
 ├── billing_invoices                  (1:N as patient + 1:N as doctor)
 ├── notifications                     (1:N)
 └── doctor_availability               (1:N as doctor)

appointments
 ├── medical_records                   (1:N via appointment_id)
 └── prescriptions                     (1:N via appointment_id)

lab_tests
 └── test_reports                      (1:N via lab_test_id)
```

---

## Notable Entity–SQL Schema Discrepancies

| Table              | Entity-only columns (in DB via JPA)                        | SQL-schema-only columns (not in DB) |
|--------------------|------------------------------------------------------------|--------------------------------------|
| `profiles`         | `blood_group`, `emergency_*`, `insurance_*`               | (none)                               |
| `medical_records`  | `notes`                                                    | `treatment`                          |
| `prescriptions`    | `appointment_id`                                           | (none)                               |
| `medicines`        | `generic_name`, `category`, `expiry_date`                  | `description`, `created_at`          |
| `lab_tests`        | Entire table                                                | (none)                               |
| `test_reports`     | Entire table                                                | (none)                               |

The SQL schema file (`medicare_schema.sql`) is **not authoritative** — JPA entities define the actual database structure via `ddl-auto=update`.

---

## Removed Tables

- `chat_messages` — removed from entities, repositories, services, controllers, and SQL schema.
- `messages` — removed from `medicare_schema.sql`.
