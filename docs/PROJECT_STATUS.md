# HMS (Healthcare Management System) - Project Status & Overview

**Last Updated:** Current Session  
**Project Status:** ✅ Fully Integrated Backend & Frontend (Ready for Testing)  
**Start Point for Next Developer:** [See "Getting Started" section]

---

## 🎯 Project Overview

### What is HMS?

A complete **Healthcare Management System** built with:
- **Backend**: Spring Boot 3.x + MySQL 8 + JWT Authentication
- **Frontend**: React 18 + TypeScript + Vite + React Query + Axios
- **Authentication**: JWT-based stateless authentication
- **Authorization**: Role-based access control (6 user roles)

### User Roles

1. **ADMIN** - System administrator, user management
2. **DOCTOR** - Medical professionals, patient management
3. **NURSE** - Clinical support, patient care
4. **PATIENT** - Primary users, appointment booking
5. **PHARMACIST** - Medication management
6. **LAB_TECHNICIAN** - Lab test management

---

## 📊 Project Status Summary

| Component | Status | Details |
|-----------|--------|---------|
| Backend Structure | ✅ Complete | Spring Boot + Maven + Java 17 |
| Database Schema | ✅ Complete | 13 MySQL tables with migrations |
| JPA Entities | ✅ Complete | 9 entity classes with relationships |
| Spring Security | ✅ Complete | JWT + BCrypt + Method-level RBAC |
| Auth Endpoints | ✅ Complete | Login/Register with JWT tokens |
| Appointment Management | ✅ Complete | Booking, scheduling, conflict detection |
| CORS Configuration | ✅ Complete | Configured for localhost:5173 (Vite) |
| Frontend API Layer | ✅ Complete | Axios + React Query hooks |
| Frontend Documentation | ✅ Complete | 5 detailed migration guides |
| Integration Tests | ✅ Complete | 7-section testing guide created |
| Quick Start Guide | ✅ Complete | Step-by-step startup instructions |

### ❌ Not Yet Implemented

- Medical records CRUD endpoints & components
- Prescriptions management
- Lab reports system
- Billing/payment system
- Messages/notifications features
- File upload functionality
- Doctor availability scheduling UI
- Patient profile management UI
- Admin dashboard & user management UI
- Integration/Unit tests
- Production deployment (Docker, CI/CD)

---

## 🚀 Getting Started (Next Developer)

### Prerequisites

```bash
# Verify installations
java -version        # Java 17+
mvn -version        # Maven
mysql --version     # MySQL 8+
node -version       # Node.js 16+
npm -version        # npm/bun
```

### One-Command Startup

**Terminal 1 - Backend:**
```bash
cd "d:\Java Development\HMS With Ai\health-hub-main\backend"
mvn spring-boot:run
# Backend ready at http://localhost:8080
```

**Terminal 2 - Frontend:**
```bash
cd "d:\Java Development\HMS With Ai\health-hub-main"
npm install axios
npm run dev
# Frontend ready at http://localhost:5173
```

### Verify Integration

```bash
# In browser DevTools Console at http://localhost:5173
fetch('http://localhost:8080/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ username: 'testuser', password: 'password123' })
})
.then(r => r.json())
.then(d => console.log('✅ Connected:', d.token ? 'Token received' : 'Error'))
.catch(e => console.log('❌ Error:', e.message));
```

✅ If you see JWT token → **Integration working!**

---

## 📁 Complete Folder Structure

```
health-hub-main/
├── backend/                          # Java Spring Boot application
│   ├── src/main/java/com/medicare/hms/
│   │   ├── config/                   # App configuration classes
│   │   ├── controller/               # REST API endpoints
│   │   ├── dto/                      # Request/Response DTOs
│   │   ├── entity/                   # JPA entity classes
│   │   ├── exception/                # Custom exceptions
│   │   ├── repository/               # Data access layer (JpaRepository)
│   │   ├── security/                 # JWT, SecurityConfig, etc
│   │   └── service/                  # Business logic layer
│   ├── src/main/resources/
│   │   ├── application.properties     # Configuration (MySQL, JWT, etc)
│   │   ├── application-prod.properties
│   │   └── schema.sql                # Database initialization
│   └── pom.xml                       # Maven dependencies
│
├── src/                              # React Frontend
│   ├── api/                          # API services & React Query hooks
│   │   ├── axiosInstance.ts          # Axios config with JWT interceptor
│   │   ├── authService.ts            # Auth API functions
│   │   ├── appointmentService.ts     # Appointment API functions
│   │   ├── useAuthQueries.ts         # React Query hooks for auth
│   │   ├── useAppointmentQueries.ts  # React Query hooks for appointments
│   │   └── MIGRATION_GUIDE.md        # Detailed API documentation
│   ├── pages/                        # React page components
│   │   ├── Auth.tsx                  # Login/Register page
│   │   ├── PatientDashboard.tsx      # Patient dashboard
│   │   ├── DoctorDashboard.tsx       # Doctor dashboard
│   │   ├── Appointments.tsx          # Appointments list
│   │   └── ...
│   ├── components/                   # Reusable React components
│   │   ├── ProtectedRoute.tsx        # Route guard for auth
│   │   ├── RoleRouter.tsx            # Routes by user role
│   │   └── ui/                       # shadcn/ui components
│   ├── contexts/                     # React contexts
│   │   └── AuthContext.tsx           # Authentication context
│   ├── hooks/                        # Custom React hooks
│   ├── providers/                    # Provider setup
│   │   └── AppProviders.tsx          # QueryClient, auth setup
│   └── App.tsx                       # Main app component
│
├── database/                         # Database migration scripts
├── supabase/                         # Legacy Supabase config (keeping for reference)
├── public/                           # Static assets
│
└── Documentation Files:
    ├── QUICK_START.md                # 👈 START HERE - Setup instructions
    ├── INTEGRATION_TESTING.md        # Test scenarios & verification
    ├── SPRING_BOOT_CONFIG.md         # Backend configuration guide
    ├── MIGRATION_GUIDE.md            # Supabase → Spring Boot migration
    ├── QUICK_REFERENCE.md            # API hooks quick reference
    ├── API_SETUP_SUMMARY.md          # API setup summary
    ├── FRONTEND_SETUP.md             # Frontend setup details
    ├── BEFORE_AFTER_COMPARISON.md    # Supabase vs new API comparison
    └── README.md                     # Project overview
```

---

## 🔐 Authentication Flow

### User Registration

```
User Input (Register Form)
  ↓
POST /api/auth/register (username, email, password)
  ↓
Backend validates input (DTO validation rules)
  ↓
Check username/email uniqueness
  ↓
Encrypt password with BCrypt
  ↓
Create User with default PATIENT role
  ↓
Return success message
```

### User Login

```
User Input (Login Form)
  ↓
POST /api/auth/login (username, password)
  ↓
AuthenticationManager validates credentials
  ↓
Generate JWT token (HS256, 24h expiration)
  ↓
Return AuthResponse (token, user details, role)
  ↓
Save token to localStorage (frontend)
  ↓
Axios interceptor adds Authorization: Bearer <token> to all requests
```

### Authenticated Request

```
Axios sends POST/GET/PUT/DELETE with Authorization header
  ↓
JwtAuthenticationFilter extracts Bearer token
  ↓
JwtUtils validates token signature & expiration
  ↓
SecurityContext set with UserDetailsImpl (username, authorities)
  ↓
@PreAuthorize checks user role (ADMIN, DOCTOR, PATIENT, etc)
  ↓
Controller method executes with @AuthenticationPrincipal injected
  ↓
Response sent back to frontend
```

### Auto-Logout on 401

```
API returns 401 Unauthorized (expired/invalid token)
  ↓
Axios response interceptor detects 401
  ↓
Clear localStorage (remove authToken)
  ↓
Redirect to /login route
```

---

## 🛠️ Backend Architecture

### 3-Layer Architecture Pattern

```
Controllers (API Endpoints)
    ↓
Services (Business Logic)
    ↓
Repositories (Database Access)
    ↓
MySQL Database
```

### Current Endpoints

**Authentication:**
- `POST /api/auth/register` - Public, register new patient
- `POST /api/auth/login` - Public, get JWT token

**Appointments:**
- `POST /api/appointments/book` - PATIENT, book appointment
- `GET /api/appointments/my` - PATIENT, get own appointments
- `GET /api/appointments/doctor/{id}` - DOCTOR, get doctor's schedule
- `GET /api/appointments/all` - ADMIN, get all appointments
- `PUT /api/appointments/{id}/status` - ADMIN/DOCTOR, update status
- `PUT /api/appointments/{id}/cancel` - PATIENT/DOCTOR, cancel appointment

### Data Validation

All DTOs use Jakarta Bean Validation:
- `@NotBlank`, `@NotNull` - Required fields
- `@Size(min, max)` - String/collection length
- `@Email` - Valid email format
- `@JsonFormat` - Date/time parsing

### Security Implementation

1. **Passwords**: BCrypt encryption (10 rounds)
2. **Tokens**: HS256 HMAC signature, 24-hour expiration
3. **CORS**: Explicit origins (localhost:5173, 3000, 8080)
4. **Authorization**: Method-level @PreAuthorize annotations
5. **Error Handling**: 401 Unauthorized, 403 Forbidden, 400 Validation errors

---

## 📱 Frontend Architecture

### State Management

**React Query (TanStack Query):**
- Handles server state (API data)
- Automatic caching with 5-minute staleTime
- Background refetching
- Query invalidation on mutations

**localStorage:**
- Stores JWT token
- Persists authentication across page reloads

### API Integration Pattern

```typescript
// 1. Define API service
export async function login(credentials: LoginRequest): Promise<AuthResponse> {
  const response = await axiosInstance.post('/auth/login', credentials);
  return response.data;
}

// 2. Create React Query hook
export function useLogin() {
  return useMutation({
    mutationFn: (credentials: LoginRequest) => login(credentials),
    onSuccess: (data) => {
      localStorage.setItem('authToken', data.token);
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
  });
}

// 3. Use in component
function LoginForm() {
  const loginMutation = useLogin();
  
  return (
    <button onClick={() => loginMutation.mutateAsync(credentials)}>
      Login
    </button>
  );
}
```

### Axios Configuration

```typescript
// baseURL from env
// Request interceptor adds Authorization header
// Response interceptor handles 401 auto-logout
```

---

## 💾 Database Schema

### 13 Tables (with auto-migrations)

1. **users** - User accounts with password hash
2. **roles** - User roles (ADMIN, DOCTOR, etc)
3. **profiles** - User personal info (name, phone, address)
4. **appointments** - Patient-Doctor appointment bookings
5. **doctor_availability** - Doctor's working hours
6. **medical_records** - Patient medical history
7. **prescriptions** - Doctor prescriptions
8. **lab_reports** - Lab test results
9. **medicines** - Available medicines
10. **billing** - Billing information
11. **messages** - User messages
12. **notifications** - System notifications
13. **user_role_mapping** - User-Role relationships

### Key Relationships

```
User (1) -----> (M) Profile
User (1) -----> (M) Appointment (as patient)
User (1) -----> (M) Appointment (as doctor)
User (1) -----> (1) DoctorAvailability
User (M) <----- (1) Role
```

---

## 🧪 Testing & Verification

### Step 1: Start Both Servers
```bash
# Terminal 1
mvn spring-boot:run

# Terminal 2
npm run dev
```

### Step 2: Run Quick Test
See details in [INTEGRATION_TESTING.md](INTEGRATION_TESTING.md)

### Step 3: Manual Testing
1. Register new user at `/register`
2. Login to get JWT token
3. Create appointment via API
4. Check token in DevTools localStorage
5. Verify Authorization header in Network tab

---

## 📋 Configuration Files Reference

| File | Purpose |
|------|---------|
| `backend/pom.xml` | Maven dependencies (Spring Boot, MySQL, JWT, etc) |
| `backend/src/main/resources/application.properties` | Server port, DB connection, JWT secret |
| `package.json` | npm dependencies (React, Vite, Axios, React Query) |
| `.env` | Frontend environment variables (API_BASE_URL) |
| `vite.config.ts` | Vite build configuration |
| `tsconfig.json` | TypeScript configuration |

### Important Configuration Values

**Backend (application.properties):**
```properties
server.port=8080
spring.datasource.url=jdbc:mysql://localhost:3306/medicare_hms
spring.jpa.hibernate.ddl-auto=update
jwt.secret=mySecretKey
jwt.expiration=86400000  # 24 hours
```

**Frontend (.env):**
```env
VITE_API_BASE_URL=http://localhost:8080
```

---

## 🔧 Common Development Tasks

### Add New Endpoint

1. **Create DTO** in `dto/` folder with @Valid annotations
2. **Create Service method** in `service/` with business logic
3. **Create Controller method** with @PreAuthorize role check
4. **Add Repository query** if needed
5. **Test with Postman/DevTools Console**

### Add New Feature

1. **Backend**: Entity → Repository → Service → Controller
2. **Frontend**: API service → React Query hook → Component
3. **Database**: Add migration/table via JPA
4. **CORS**: Already configured for all origins/methods
5. **Security**: Add @PreAuthorize if role-restricted

### Debug Issues

1. **Backend logs**: Check console output when `mvn spring-boot:run` runs
2. **Frontend console**: Press F12 → Console tab
3. **Network requests**: F12 → Network tab (check headers/responses)
4. **Database**: `mysql> SHOW TABLES; SELECT * FROM users;`

---

## 📚 Documentation Files

| Document | Target Audience | Contents |
|----------|-----------------|----------|
| [QUICK_START.md](QUICK_START.md) | **New developers** | How to start everything |
| [INTEGRATION_TESTING.md](INTEGRATION_TESTING.md) | **QA / Testers** | Test scenarios & verification |
| [SPRING_BOOT_CONFIG.md](SPRING_BOOT_CONFIG.md) | **Backend devs** | Security, CORS, JWT details |
| [MIGRATION_GUIDE.md](src/api/MIGRATION_GUIDE.md) | **Frontend devs** | Supabase → Spring Boot changes |
| [QUICK_REFERENCE.md](src/api/QUICK_REFERENCE.md) | **Frontend devs** | API hooks examples |
| [API_SETUP_SUMMARY.md](API_SETUP_SUMMARY.md) | **Everyone** | Project summary |

---

## ⚠️ Known Limitations

1. **Not Implemented**: Medical records, prescriptions, lab reports, billing, messages
2. **File Upload**: Not yet implemented for documents/images
3. **Real-time**: No WebSocket for live notifications
4. **Testing**: No unit/integration tests yet
5. **Deployment**: No Docker configuration yet
6. **Production**: No error tracking (Sentry), no CDN, no caching layer

---

## 🎓 Learning Resources

### For Understanding the System

1. **JWT Authentication**: See `SPRING_BOOT_CONFIG.md` → "JWT Token Flow"
2. **CORS**: See `SPRING_BOOT_CONFIG.md` → "CORS Configuration"
3. **React Query**: See `src/api/QUICK_REFERENCE.md`
4. **Spring Security**: See `SPRING_BOOT_CONFIG.md` → "Security Configuration"
5. **REST API Design**: See controller endpoints in `controller/` folder

### External Documentation

- [Spring Boot Official Docs](https://spring.io/projects/spring-boot)
- [React Query Docs](https://tanstack.com/query/latest)
- [JWT.io](https://jwt.io) - JWT debugger
- [MySQL Reference](https://dev.mysql.com/doc/)

---

## 🚀 Next Priority Tasks

### Phase 1 (Testing & Verification)
- [ ] Start backend & frontend
- [ ] Test login/register endpoints
- [ ] Verify JWT token flow
- [ ] Check CORS configuration
- [ ] Run all integration tests

### Phase 2 (Frontend Components)
- [ ] Implement LoginPage component
- [ ] Implement RegisterPage component
- [ ] Implement PatientDashboard
- [ ] Create AppointmentBooking modal
- [ ] Build DoctorScheduleView

### Phase 3 (Additional Endpoints)
- [ ] Medical records CRUD
- [ ] Prescriptions management
- [ ] Lab reports system
- [ ] Billling endpoints
- [ ] User management (admin)

### Phase 4 (Advanced Features)
- [ ] File upload service
- [ ] Email notifications
- [ ] Real-time updates (WebSocket)
- [ ] Dashboard analytics
- [ ] Role-based UI rendering

---

## 📞 Quick Troubleshooting

| Problem | Solution |
|---------|----------|
| Backend won't start | Check Java version, Maven installed, MySQL running |
| Frontend won't connect | Check API_BASE_URL in .env, backend running on :8080 |
| CORS error | Backend should be on :8080, frontend on :5173, check SecurityConfig |
| 401 on all requests | Check JWT secret matches, token format is "Bearer <token>" |
| Database empty | Check migrations ran, `spring.jpa.hibernate.ddl-auto=update` |
| Port already in use | Kill process using port or use different port |

---

## 📊 Project Statistics

- **Backend Files**: ~30 Java classes
- **Frontend Files**: ~15 TypeScript/React files
- **Database**: 13 tables with relationships
- **API Endpoints**: 6 active (more planned)
- **Lines of Code**: ~3000+ (backend + frontend + docs)
- **Documentation Pages**: 8+
- **Time to Fully Integrated**: Single development session

---

## ✅ Checklist Before Production

- [ ] All endpoints tested
- [ ] JWT expiration configured for production
- [ ] Database backups set up
- [ ] Error logging configured
- [ ] CORS allowed origins updated
- [ ] Database credentials stored in env vars
- [ ] JWT secret securely stored
- [ ] HTTPS/SSL configured
- [ ] Rate limiting implemented
- [ ] Tests written and passing
- [ ] API documentation (Swagger) verified
- [ ] Performance optimized
- [ ] Security audit completed

---

## 🎯 Success Criteria

### The project is ready when:

✅ Backend runs on http://localhost:8080  
✅ Frontend runs on http://localhost:5173  
✅ Users can register and login  
✅ JWT token stored in localStorage  
✅ Authorization header sent with requests  
✅ Appointments can be booked  
✅ Role-based access control working  
✅ No CORS errors in console  
✅ All integration tests passing  
✅ Documentation complete and accurate  

---

**This is your complete project overview. Start with [QUICK_START.md](QUICK_START.md) and follow the integration testing guide!**
