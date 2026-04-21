# Frontend Migration Summary (Supabase → Axios + Spring Boot)

## What Was Created

Your frontend has been successfully set up for migration from Supabase to Axios with Spring Boot backend.

### New Files Structure
```
src/api/
├── axiosInstance.ts              # Configured Axios with JWT interceptors
├── authService.ts                 # Login/Register API calls
├── appointmentService.ts          # Appointment API calls
├── useAuthQueries.ts              # React Query hooks for auth
├── useAppointmentQueries.ts       # React Query hooks for appointments
├── index.ts                       # Central export for all API functions
├── EXAMPLES.tsx                   # Code examples for all features
├── MIGRATION_GUIDE.md             # Detailed migration instructions
├── QUICK_REFERENCE.md             # Quick API reference

src/providers/
└── AppProviders.tsx               # React Query configuration wrapper

Root files:
├── FRONTEND_SETUP.md              # Complete setup checklist
├── .env.example                   # Environment variables template
├── install-dependencies.bat       # Windows dependency installer
└── install-dependencies.sh        # Mac/Linux dependency installer
```

## Key Files Explained

### 1. **axiosInstance.ts** (The Heart)
- Pre-configured Axios instance with JWT token handling
- Automatically adds `Authorization: Bearer <token>` header
- Auto-logs out user on 401 (unauthorized)
- Base URL from environment variables

### 2. **authService.ts** (Authentication)
- Direct API functions for login/register
- Token storage in localStorage
- User session management

### 3. **appointmentService.ts** (Business Logic)
- CRUD operations for appointments
- Doctor schedule queries
- Status updates and cancellations

### 4. **useAuthQueries.ts** (React Query - Auth)
- `useLogin()` - Login mutation
- `useRegister()` - Registration mutation
- `useLogout()` - Logout mutation
- `useCurrentUser()` - Current user query

### 5. **useAppointmentQueries.ts** (React Query - Appointments)
- `useMyAppointments()` - Fetch patient's appointments
- `useDoctorSchedule()` - Fetch doctor's schedule
- `useAllAppointments()` - Fetch all appointments (admin)
- `useBookAppointment()` - Book appointment mutation
- `useUpdateAppointmentStatus()` - Update status mutation
- `useCancelAppointment()` - Cancel appointment mutation

## Quick Start

### Step 1: Install Dependencies
```bash
# Windows
./install-dependencies.bat

# Mac/Linux
bash install-dependencies.sh

# Or manually
npm install axios
```

### Step 2: Create `.env` File
```bash
cp .env.example .env
```

### Step 3: Update Main Entry
In `src/main.tsx`, wrap your app with QueryClient:
```typescript
import { AppProviders } from './providers/AppProviders.tsx';

createRoot(document.getElementById('root')!).render(
  <AppProviders>
    <App />
  </AppProviders>
);
```

### Step 4: Test Login
```typescript
import { useLogin } from '@/api/useAuthQueries';

// In your login component
const loginMutation = useLogin();
await loginMutation.mutateAsync({ username, password });
```

### Step 5: Check Token
- Open browser DevTools
- Go to Storage → Local Storage
- Look for `authToken` entry
- Should contain JWT starting with `eyJ...`

## How It Works

```
User Action
    ↓
React Hook (e.g., useMyAppointments)
    ↓
React Query Cache Check
    ↓
If Cache Valid → Return Cached Data
If Cache Invalid → Call API Service
    ↓
Axios Instance
    ↓
Add JWT Token to Headers (Interceptor)
    ↓
Send Request to Spring Boot
    ↓
Spring Boot Validates Token
    ↓
Process Request with User Context
    ↓
Return Response
    ↓
React Query Updates Cache
    ↓
Component Re-renders with New Data
```

## Authentication Flow

### 1. Login
```typescript
const { mutateAsync: login } = useLogin();
const response = await login({ username, password });
// Token automatically saved to localStorage
// User data saved to localStorage
```

### 2. Every API Request
```
Request Header:
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 3. Backend Validation
```java
// Spring Security validates token via JwtAuthenticationFilter
// If valid → Continue with request in authenticated context
// If invalid/expired → Return 401 → Frontend auto-logs out
```

### 4. Logout
```typescript
authService.logout();
// Clears localStorage
// Clears React Query cache
// User redirected to login
```

## Before & After Comparison

| Feature | Before (Supabase) | After (Axios) |
|---------|------------------|---------------|
| HTTP Client | Supabase Client | Axios |
| Auth | Supabase Auth | JWT + Spring Security |
| Token Storage | Browser Storage | localStorage |
| Token Sending | Auto (built-in) | Axios Interceptor |
| Caching | Limited | TanStack Query |
| CRUD Pattern | `.from().select()` | Service functions + hooks |

## Migration Checklist

- [ ] Install Axios
- [ ] Create `.env` file
- [ ] Wrap app with `<AppProviders>`
- [ ] Test login endpoint
- [ ] Check token in localStorage
- [ ] Update auth pages to use new hooks
- [ ] Update appointment pages to use new hooks
- [ ] Remove Supabase imports
- [ ] Test all CRUD operations
- [ ] Test role-based access
- [ ] Run full integration test

## API Endpoints Reference

### Auth
```
POST   /api/auth/login              # Returns JWT
POST   /api/auth/register           # Create account
```

### Appointments (Patients)
```
POST   /api/appointments/book       # Book appointment
GET    /api/appointments/my         # Get my appointments
PUT    /api/appointments/{id}/cancel
```

### Appointments (Doctors)
```
GET    /api/appointments/doctor/{doctorId}  # My schedule
PUT    /api/appointments/{id}/cancel
```

### Appointments (Admin)
```
GET    /api/appointments/all       # All appointments
PUT    /api/appointments/{id}/status
```

## Troubleshooting

| Problem | Solution |
|---------|----------|
| "Cannot find module @/api" | Run `npm install` and check tsconfig paths |
| "401 on all requests" | Check token in localStorage via DevTools |
| "CORS Error" | Ensure Spring Boot has @CrossOrigin on controllers |
| "Token lost on refresh" | Token persists in localStorage automatically |
| "Old Supabase queries still running" | Search project for "supabase" and remove imports |

## Documentation Files

1. **FRONTEND_SETUP.md** - Detailed setup steps with verification
2. **MIGRATION_GUIDE.md** - Complete before/after examples
3. **QUICK_REFERENCE.md** - API hooks and services reference
4. **EXAMPLES.tsx** - Runnable code examples
5. **This file** - Overview and quick start

## Next Steps

1. ✅ Complete setup from FRONTEND_SETUP.md
2. → Migrate Auth pages (Login, Register)
3. → Migrate Patient Dashboard (Appointments list)
4. → Migrate Doctor Dashboard (Schedule view)
5. → Migrate Admin Dashboard (Manage all appointments)
6. → Add notifications/error handling
7. → Performance optimization
8. → Deploy to production

## Performance Tips

1. **Keep staleTime reasonable** - 5 mins is good default
2. **Invalidate only affected queries** - Not all queries
3. **Use optimistic updates** - Update UI before server response
4. **Lazy load components** - Code split large features
5. **Monitor Network tab** - Ensure no duplicate requests

## Security Notes

- JWT tokens stored in localStorage (accessible to XSS)
- Consider moving to httpOnly cookies for production
- Always validate input on backend (enforced in Spring Boot)
- CORS enabled for frontend origin(s) only
- Passwords hashed with BCrypt (Spring Security)

## Support

For detailed information, see:
- React Query docs: https://tanstack.com/query/latest
- Axios docs: https://axios-http.com
- Spring Security docs: https://spring.io/projects/spring-security

For issues with specific components, check EXAMPLES.tsx for usage patterns.

---

**Status**: Ready to use! Your frontend is now configured to work with Spring Boot backend via Axios + React Query. 🚀