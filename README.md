# 🏥 Medicare Cure Hub
### Production-Ready Hospital Management System

<p align="center">
  <img src="https://img.shields.io/badge/React_18-TypeScript-61DAFB?style=for-the-badge&logo=react&logoColor=white"/>
  <img src="https://img.shields.io/badge/Spring_Boot-3.2-6DB33F?style=for-the-badge&logo=springboot&logoColor=white"/>
  <img src="https://img.shields.io/badge/MySQL-8%2B-4479A1?style=for-the-badge&logo=mysql&logoColor=white"/>
  <img src="https://img.shields.io/badge/Groq_AI-CureBot-8B5CF6?style=for-the-badge"/>
  <img src="https://img.shields.io/badge/Auth-JWT-E11D48?style=for-the-badge"/>
  <img src="https://img.shields.io/badge/License-MIT-F59E0B?style=for-the-badge"/>
</p>

---

## 🖥️ Dashboard Overview

Real-time hospital metrics, appointment tracking, and analytics — available in **light** and **dark** mode.

<p align="center">
  <img src="screenshots/dashboard-light.png" width="48%" alt="Dashboard Light Mode"/>
  &nbsp;
  <img src="screenshots/dashboard-dark.png" width="48%" alt="Dashboard Dark Mode"/>
</p>

---

## ✨ Core Features

Everything a modern hospital needs — built in one system.

| Module | Description |
|---|---|
| 👥 **User Management** | Role-based access control for 6 user types with full CRUD |
| 🔐 **JWT Authentication** | Spring Security-powered token auth with session management |
| 🩺 **Patient Management** | Full profiles, medical history, prescriptions & lab reports |
| 👨‍⚕️ **Doctor Management** | Availability scheduling, appointment conflicts, specializations |
| 📅 **Appointments** | Book, reschedule, cancel with conflict detection & calendar view |
| 💊 **Pharmacy** | Prescriptions, dispensing workflow, and inventory tracking |
| 🧪 **Laboratory** | Lab test requests, sample tracking, and result submission |
| 🧾 **Billing** | Invoice generation, payment status tracking in BDT (৳) |
| 🤖 **CureBot AI** | Groq-powered chatbot for FAQs, appointments & lab explanations |

---

## 📸 Module Screenshots

A tour of the key modules in action.

### 👤 User Management

<p align="center">
  <img src="screenshots/user-management.png" width="90%" alt="User Management"/>
</p>

---

### 👨‍⚕️ Doctors &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; 📅 Book Appointment

<p align="center">
  <img src="screenshots/doctors.png" width="48%" alt="Doctors"/>
  &nbsp;
  <img src="screenshots/appointment-booking.png" width="48%" alt="Appointment Booking"/>
</p>

---

### 💊 Pharmacy &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; 🧪 Laboratory

<p align="center">
  <img src="screenshots/pharmacy.png" width="48%" alt="Pharmacy"/>
  &nbsp;
  <img src="screenshots/laboratory.png" width="48%" alt="Laboratory"/>
</p>

---

### 🧾 Billing & Invoicing &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; 📊 Analytics & Reports

<p align="center">
  <img src="screenshots/billing.png" width="48%" alt="Billing & Invoicing"/>
  &nbsp;
  <img src="screenshots/analytics.png" width="48%" alt="Analytics & Reports"/>
</p>

---

## 🤖 CureBot — AI Care Assistant

Powered by Groq's `llama-3.1-8b-instant` model — answers medical FAQs, booking guidance, and lab result explanations in real-time.

<p align="center">
  <img src="screenshots/curebot.png" width="55%" alt="CureBot AI Assistant"/>
</p>

| Feature | Description |
|---|---|
| 🔍 **Doctor Availability** | Real-time availability queries with database integration |
| 📋 **Appointment Guidance** | Step-by-step booking help and scheduling advice |
| 🧬 **Lab Result Explanations** | Plain-language breakdown of test results for patients |
| 💡 **Medical FAQ** | General medication info and symptom guidance |

---

## 🛠️ Tech Stack

Modern, production-grade technologies across the full stack.

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui, Radix UI |
| **Backend** | Spring Boot 3.2, Java 17, Spring Security, JWT, Spring Data JPA |
| **Database** | MySQL 8+, Hibernate ORM |
| **API Client** | Axios, TanStack Query |
| **AI Layer** | Groq API, llama-3.1-8b-instant, Spring RestTemplate |
| **Build Tools** | npm, Maven 3.9+ |

---

## 🚀 Quick Start

Get up and running in minutes.

### Prerequisites

```bash
# Required
Java 17+
Maven 3.9+
Node.js 18+
MySQL 8+

# Get free Groq API key at console.groq.com
```

### Backend

```bash
cd backend
mvn spring-boot:run
# Runs at http://localhost:8080
```

### Frontend

```bash
npm install
npm run dev
# Runs at http://localhost:5173
```

### Environment Config — `backend/src/main/resources/application.properties`

```properties
# MySQL
spring.datasource.url=jdbc:mysql://localhost:3306/medicare_hms?createDatabaseIfNotExist=true
spring.datasource.username=root
spring.datasource.password=your_mysql_password

# JWT
jwt.secret=replace_with_strong_secret_32_chars_minimum
jwt.expiration=86400000

# Groq AI
groq.api.key=your_groq_api_key_here
groq.model=llama-3.1-8b-instant
```

---

## 👥 User Roles & Permissions

Six distinct roles with carefully scoped access control.

| Role | Access |
|---|---|
| 👑 **Admin** | Full system access — users, doctors, patients, billing, analytics, and reports |
| 👨‍⚕️ **Doctor** | Assigned patients, appointments, prescriptions, lab report review |
| 🩺 **Nurse** | Patient and appointment workflow assistance |
| 🙋 **Patient** | Book appointments, view prescriptions, lab results, and medical history |
| 💊 **Pharmacist** | Medicine inventory management and prescription dispensing |
| 🧪 **Lab Staff** | Manage lab tests, process samples, and submit results |

---

## ⚠️ Known Issues & Fixes

> **Groq Model:** Use `llama-3.1-8b-instant` — the old `llama3-8b-8192` was retired in August 2025.

> **Backend Fix:** Add `@JsonIgnoreProperties(ignoreUnknown = true)` to all Groq response inner classes in `AIChatbotService.java`.

> **CureBot Connectivity:** If unreachable, verify backend internet access to `https://api.groq.com`.

> **Security:** Keep `application.properties` secrets out of git — add it to `.gitignore`.

---

## 📄 License

Released under the [MIT License](LICENSE).

---

<p align="center">
  🏥 <strong>Medicare Cure Hub</strong> — Hospital Management System
</p>
