# 🏥 Health Hub Hospital Management System (HMS)

A production-ready **full-stack Hospital Management System** for managing patients, doctors, appointments, prescriptions, lab tests, billing, and staff coordination. Built with **React 18 + TypeScript** (frontend) and **Spring Boot 3.2** (backend), powered by **MySQL 8+**.

---

## 📋 Table of Contents
- [Features](#-features)
- [System Architecture](#-system-architecture)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Quick Start](#-quick-start)
- [Setup Instructions](#-setup-instructions)
- [API Overview](#-api-overview)
- [User Roles & Permissions](#-user-roles--permissions)
- [Key Issues & Fixes](#-key-issues--fixes)
- [Testing](#-testing)
- [Troubleshooting](#-troubleshooting)

---

## ✨ Features

### Core Features
- ✅ **User Management**: 6 role-based access levels (Admin, Doctor, Nurse, Patient, Pharmacist, Lab Technician)
- ✅ **Authentication**: JWT token-based with Spring Security
- ✅ **Patient Management**: Complete patient profiles with medical history
- ✅ **Doctor Management**: Doctor profiles, credentials, and availability
- ✅ **Appointments**: Booking, rescheduling, cancellation with conflict detection
- ✅ **Prescriptions**: Doctor prescriptions with pharmacy management
- ✅ **Laboratory**: Test requests and report management
- ✅ **Billing**: Invoice generation and payment tracking
- ✅ **Notifications**: System notifications and alerts
- ✅ **Responsive UI**: Modern, mobile-friendly interface

### Currently In Progress
- 🔄 Medical Records CRUD UI
- 🔄 Prescriptions Management UI
- 🔄 Lab Reports System UI
- 🔄 Billing/Payment UI
- 🔄 Messages/Notifications UI
- 🔄 Admin Dashboard Analytics
- 🔄 Unit/Integration Tests
- 🔄 Production Deployment (Docker, CI/CD)

---

## 🏗️ System Architecture

```
┌─────────────────────┐
│  React 18 Frontend  │
│  (localhost:5173)   │
└──────────┬──────────┘
           │ HTTP/REST
           │ Axios + React Query
           ▼
┌─────────────────────┐
│ Spring Boot Backend │
│ (localhost:8080)    │
└──────────┬──────────┘
           │ JDBC/JPA
           ▼
    ┌─────────────┐
    │   MySQL 8   │
    │  Database   │
    └─────────────┘
```

---

## 🛠️ Tech Stack

| Layer | Technologies |
|-------|---------------|
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui, TanStack Query, Axios |
| **Backend** | Spring Boot 3.2, Java 17+, Spring Security, JWT, Spring Data JPA |
| **Database** | MySQL 8+, Hibernate ORM |
| **DevOps** | Maven, npm/bun, VSCode |
| **UI Components** | shadcn/ui, Radix UI |

---

## 📁 Project Structure

```
health-hub-main/
├── backend/                        # Spring Boot Backend
│   ├── src/main/java/
│   │   └── com/medicare/hms/
│   │       ├── controller/         # 8 REST Controllers
│   │       ├── service/            # Business Logic
│   │       ├── entity/             # JPA Entities (13+ tables)
│   │       ├── repository/         # Spring Data JPA Repos
│   │       ├── dto/                # Request/Response DTOs
│   │       ├── security/           # JWT, SecurityConfig
│   │       ├── config/             # Spring Configurations
│   │       └── exception/          # Custom Exceptions
│   ├── src/main/resources/
│   │   └── application.properties  # DB & JWT Configuration
│   └── pom.xml                     # Maven Dependencies
│
├── src/                            # React Frontend
│   ├── api/                        # Axios API Services + React Query Hooks
│   ├── components/
│   │   ├── appointments/           # Appointment Components
│   │   ├── patients/               # Patient Components
│   │   ├── users/                  # User Management Components
│   │   ├── ui/                     # shadcn/ui Components
│   │   ├── AppSidebar.tsx
│   │   ├── DashboardLayout.tsx
│   │   └── ...
│   ├── pages/                      # Full Page Components
│   │   ├── Auth.tsx
│   │   ├── Index.tsx
│   │   ├── PatientDashboard.tsx
│   │   ├── DoctorDashboard.tsx
│   │   ├── Appointments.tsx
│   │   ├── Patients.tsx
│   │   └── ...
│   ├── contexts/                   # React Context (AuthContext)
│   ├── hooks/                      # Custom React Hooks
│   ├── lib/                        # Utilities (pdfUtils, utils)
│   ├── providers/                  # React Query + App Providers
│   └── main.tsx                    # App Entry Point
│
├── database/
│   ├── medicare_schema.sql         # Database Schema (13+ tables)
│   └── dummy_data.sql              # Sample Test Data
│
├── public/                         # Static Assets
├── package.json                    # Frontend Dependencies
├── pom.xml                         # Backend Dependencies
├── vite.config.ts                  # Vite Configuration
├── tailwind.config.ts              # Tailwind CSS Configuration
├── tsconfig.json                   # TypeScript Configuration
└── README.md                       # This File
```

---

## 🚀 Quick Start

### Prerequisites
- **Node.js** 16+ or **Bun**
- **Java** 17+ (OpenJDK or Oracle JDK)
- **Maven** 3.8+
- **MySQL** 8+ (with Workbench or CLI)
- **Git**

### Option 1: Automated Setup (Recommended)
```bash
# Backend Setup
cd backend
mvn clean install
mvn spring-boot:run
# Backend runs on http://localhost:8080

# Frontend Setup (in another terminal)
npm install
npm run dev
# Frontend runs on http://localhost:5173
```

### Option 2: Step-by-Step Manual Setup
See [Quick Start Guide](QUICK_START.md) for detailed instructions.

### Default Test Credentials
```
Admin Account:
  Email: admin@hms.com
  Password: admin123

Doctor Account:
  Email: doctor@hms.com
  Password: doctor123

Patient Account:
  Email: patient@hms.com
  Password: patient123
```

---

## 📋 Setup Instructions

### 1. Database Setup

#### Option A: Using MySQL CLI
```bash
mysql -u root -p
CREATE DATABASE medicare_hms;
USE medicare_hms;
source database/medicare_schema.sql;
source database/dummy_data.sql;  # Optional: Load sample data
```

#### Option B: Using MySQL Workbench
1. Open MySQL Workbench
2. Connect to your MySQL server
3. File → Open SQL Script → Select `database/medicare_schema.sql`
4. Execute the script
5. Repeat for `database/dummy_data.sql`

#### Database Configuration
Edit `backend/src/main/resources/application.properties`:
```properties
# MySQL Configuration
spring.datasource.url=jdbc:mysql://localhost:3306/medicare_hms
spring.datasource.username=your_mysql_user
spring.datasource.password=your_mysql_password
spring.datasource.driver-class-name=com.mysql.cj.jdbc.Driver

# JPA/Hibernate Configuration
spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=true
spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.MySQL8Dialect
spring.jpa.properties.hibernate.format_sql=true

# JWT Configuration
jwt.secret=your_secret_key_here_min_32_characters
jwt.expiration=86400000  # 24 hours in milliseconds

# Server Configuration
server.port=8080
server.servlet.context-path=/api
```

### 2. Backend Setup (Spring Boot)

#### Using IDE (Recommended)
1. Open your IDE (IntelliJ IDEA, Eclipse, VS Code)
2. Import `backend/` as Maven project
3. Right-click project → Run As → Maven Build → Goals: `spring-boot:run`
4. Backend starts on `http://localhost:8080`

#### Using Maven CLI
```bash
cd backend
mvn clean install
mvn spring-boot:run
```

#### Using IDE Run/Debug Button
- Open `backend/src/main/java/com/medicare/hms/Application.java`
- Click the Run button in your IDE

### 3. Frontend Setup (React)

#### Install Dependencies
```bash
npm install
# or if using Bun:
bun install
```

#### Start Development Server
```bash
npm run dev
# Frontend runs on http://localhost:5173
```

#### Build for Production
```bash
npm run build
# Creates optimized build in `dist/` directory
```

---

## 📡 API Overview

### Base URL
```
http://localhost:8080/api
```

### Main Controllers & Endpoints

| Controller | Endpoints | Methods |
|------------|-----------|---------|
| **AuthController** | `/auth/register`, `/auth/login`, `/auth/logout` | POST |
| **UserController** | `/users`, `/users/{id}`, `/users/role/{role}` | GET, POST, PUT, DELETE |
| **PatientController** | `/patients`, `/patients/{id}`, `/patients/search` | GET, POST, PUT, DELETE |
| **DoctorController** | `/doctors`, `/doctors/{id}`, `/doctors/specialty/{specialty}` | GET, POST, PUT, DELETE |
| **AppointmentController** | `/appointments`, `/appointments/{id}`, `/appointments/doctor/{id}` | GET, POST, PUT, DELETE, PATCH |
| **PrescriptionController** | `/prescriptions`, `/prescriptions/{id}`, `/prescriptions/patient/{id}` | GET, POST, PUT, DELETE |
| **LabReportController** | `/lab-reports`, `/lab-reports/{id}`, `/lab-reports/patient/{id}` | GET, POST, PUT, DELETE |
| **BillingController** | `/billing`, `/billing/{id}`, `/billing/patient/{id}` | GET, POST, PUT, DELETE |

### Example API Calls

#### User Login
```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "doctor@hms.com",
  "password": "doctor123"
}

Response:
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "name": "Dr. John Smith",
    "email": "doctor@hms.com",
    "role": "DOCTOR"
  }
}
```

#### Get All Appointments
```bash
GET /api/appointments
Authorization: Bearer <token>

Response:
[
  {
    "id": 1,
    "patientId": 2,
    "doctorId": 1,
    "appointmentDate": "2024-05-15T10:00:00",
    "status": "CONFIRMED",
    "notes": "Regular checkup"
  },
  ...
]
```

See [SPRING_BOOT_CONFIG.md](SPRING_BOOT_CONFIG.md) for detailed API documentation and examples.

---

## 👥 User Roles & Permissions

| Role | Permissions |
|------|-------------|
| **Admin** | Manage all users, view reports, system settings |
| **Doctor** | Manage own patients, create prescriptions, view appointments |
| **Nurse** | Assist doctors, manage patient records |
| **Patient** | View own records, book appointments, view prescriptions |
| **Pharmacist** | Manage prescriptions, dispense medicines |
| **Lab Technician** | Create lab reports, manage test results |

---

## ⚠️ Key Issues & Fixes

### Critical Issue: Missing ObjectMapper Bean
**Problem**: Application won't start - `NoSuchBeanDefinitionException`

**Location**: `backend/src/main/java/com/medicare/hms/service/PrescriptionService.java`

**Solution**: Add this bean to `SecurityConfig.java`:
```java
@Bean
public ObjectMapper objectMapper() {
    return new ObjectMapper();
}
```

**Reference**: See [CRITICAL_FIXES_GUIDE.md](CRITICAL_FIXES_GUIDE.md) for all critical fixes.

### Important Issues
1. ⚠️ Missing AppointmentController endpoints (GET /my, GET /doctor/{id}, PUT /{id}/status)
2. ⚠️ Circular dependency between User and Profile entities
3. ⚠️ ProfileService implementation incomplete
4. ⚠️ Inconsistent role-based access control naming

See [PROJECT_STATUS.md](PROJECT_STATUS.md) for full status and [PROJECT_ANALYSIS_REPORT.md](PROJECT_ANALYSIS_REPORT.md) for detailed issues.

---

## 🧪 Testing

### Run Tests
```bash
# Frontend Tests
npm run test

# Backend Tests
cd backend
mvn test
```

### API Testing
1. Use **Postman** or **Insomnia** to test API endpoints
2. Use **React Query DevTools** to inspect frontend queries
3. Use **MySQL CLI** to verify database operations

See [INTEGRATION_TESTING.md](INTEGRATION_TESTING.md) for comprehensive testing procedures.

---

## 🔧 Troubleshooting

### Backend Issues

**Issue**: Spring Boot won't start
```
Solution:
1. Check if port 8080 is already in use: netstat -ano | findstr :8080
2. Verify MySQL is running and accessible
3. Check application.properties for correct database credentials
4. Run: mvn clean install
```

**Issue**: Database connection error
```
Solution:
1. Verify MySQL is running: mysql -u root -p (enter password)
2. Check if database exists: SHOW DATABASES;
3. Check credentials in application.properties
4. Ensure mysql-connector-java dependency is in pom.xml
```

**Issue**: JWT token expired
```
Solution:
Adjust jwt.expiration in application.properties (default: 24 hours)
```

### Frontend Issues

**Issue**: npm dependencies won't install
```bash
Solution:
1. Clear node_modules: rm -rf node_modules
2. Clear cache: npm cache clean --force
3. Reinstall: npm install
```

**Issue**: CORS errors in console
```
Solution:
Check CORS configuration in backend SecurityConfig.java
Ensure frontend URL (http://localhost:5173) is whitelisted
```

**Issue**: API calls failing with 401 Unauthorized
```
Solution:
1. Check if token is saved in localStorage
2. Verify JWT token hasn't expired
3. Check Authorization header format: "Bearer <token>"
4. Login again to get new token
```

---

## 📚 Documentation Files

### Essential Reading (Start Here)
- [QUICK_START.md](QUICK_START.md) - Quick setup guide
- [PROJECT_STATUS.md](PROJECT_STATUS.md) - Current project status

### Reference Documentation
- [SPRING_BOOT_CONFIG.md](SPRING_BOOT_CONFIG.md) - Backend configuration details
- [INTEGRATION_TESTING.md](INTEGRATION_TESTING.md) - Testing procedures
- [CRITICAL_FIXES_GUIDE.md](CRITICAL_FIXES_GUIDE.md) - Critical bug fixes

### Code Examples
- `src/api/EXAMPLES.tsx` - API usage examples
- `src/api/QUICK_REFERENCE.md` - Quick API reference
- `src/api/COMPONENT_EXAMPLES.tsx` - Component usage

---

## 🤝 Contributing

1. Create a feature branch: `git checkout -b feature/your-feature`
2. Commit changes: `git commit -m "Add your feature"`
3. Push to branch: `git push origin feature/your-feature`
4. Open a Pull Request

---

## 📝 License

This project is proprietary and intended for healthcare institution use only.

---

## 📧 Support

For issues, questions, or suggestions, please refer to:
	```bash
	npm install
	```
- Configure environment variables:
	- Copy `.env.example` to `.env` and set API base URL, etc.
- Run the frontend:
	```bash
	npm run dev
	```
- Open [http://localhost:5173](http://localhost:5173) in your browser

---

## Usage Guide
- **Login/Register:** Use the login page to access the system. Roles: admin, doctor, patient, nurse.
- **Dashboard:** See quick stats and navigation.
- **Patients:** Add, edit, view, and manage patients.
- **Doctors:** Add, edit, view, and manage doctors. Set availability.
- **Appointments:** Book, reschedule, cancel, and complete appointments. Doctors can write prescriptions.
- **Prescriptions:** Doctors can prescribe; patients can view their prescriptions.
- **Laboratory:** Manage lab tests and reports.
- **Billing:** View and manage invoices.
- **Notifications:** Receive system notifications.

---

## API Overview
- All API endpoints are under `/api/`
- JWT authentication required for protected routes
- See `src/api/appointmentService.ts`, `authService.ts`, etc. for usage

---

## Testing
- Backend: Use Postman or curl to test API endpoints
- Frontend: Use the UI or write integration tests
- See `INTEGRATION_TESTING.md` for detailed test cases

---

## Troubleshooting
- **CORS Error:** Ensure backend has `@CrossOrigin` enabled
- **Database Connection:** Check MySQL credentials and running status
- **Token Issues:** Ensure JWT is stored in localStorage and sent in headers
- **Build Errors:** Run `npm install` and `npm run build` in frontend
- **Backend Errors:** Check logs in your IDE or terminal

---

## Contributing
1. Fork the repo
2. Create a new branch (`git checkout -b feature/your-feature`)
3. Commit your changes
4. Push to your fork and open a Pull Request

---

## License
This project is licensed under the MIT License.
- Tailwind CSS
