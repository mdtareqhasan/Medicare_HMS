# Frontend Migration Guide: Supabase → Axios + Spring Boot

## Overview
This guide explains how to migrate your React frontend from Supabase to Axios for API calls with Spring Boot backend.

## What's Changed

### Before (Supabase)
```typescript
import { supabase } from '@/integrations/supabase/client';

const { data, error } = await supabase
  .from('appointments')
  .select('*')
  .eq('patient_id', userId);
```

### After (Axios + TanStack Query)
```typescript
import { useMyAppointments } from '@/api/useAppointmentQueries';

const { data: appointments, isLoading, error } = useMyAppointments();
```

## Setup Instructions

### 1. Install Dependencies
If not already installed, add axios to your project:
```bash
npm install axios
```

### 2. Environment Configuration
Create a `.env` file in your project root (copy from `.env.example`):
```
VITE_API_BASE_URL=http://localhost:8080/api
```

For production, update this to your Spring Boot server URL.

### 3. Update Your App Structure

The `src/api/` folder now contains:
- **axiosInstance.ts** - Configured Axios instance with JWT token handling
- **authService.ts** - Auth API calls (login, register, logout)
- **appointmentService.ts** - Appointment API calls
- **useAuthQueries.ts** - React Query hooks for auth
- **useAppointmentQueries.ts** - React Query hooks for appointments
- **EXAMPLES.tsx** - Usage examples

## How JWT Token Works

### Automatic Token Handling
When you call `authService.login()`, the JWT token is automatically:
1. Returned in the response
2. Stored in `localStorage` as `authToken`
3. Included in every subsequent API request via the request interceptor

### Manual Token Management
```typescript
// Get token
const token = localStorage.getItem('authToken');

// Clear token (on logout)
localStorage.removeItem('authToken');

// Set token manually
localStorage.setItem('authToken', 'your-jwt-token');
```

### Request Flow
```
1. User calls API via hook/service
   ↓
2. Axios interceptor adds token to Authorization header: Bearer <token>
   ↓
3. Spring Boot receives request with token
   ↓
4. Spring Security validates token
   ↓
5. Request processed with user context
```

## Migration Examples

### Example 1: Login
**Old (Supabase):**
```typescript
const { data, error } = await supabase.auth.signInWithPassword({
  email,
  password,
});
```

**New (Axios):**
```typescript
import { useLogin } from '@/api/useAuthQueries';

const loginMutation = useLogin();
const result = await loginMutation.mutateAsync({ username, password });
```

### Example 2: Fetch Appointments
**Old (Supabase):**
```typescript
const { data: appointments } = await supabase
  .from('appointments')
  .select('*')
  .eq('patient_id', userId);
```

**New (Axios):**
```typescript
import { useMyAppointments } from '@/api/useAppointmentQueries';

const { data: appointments, isLoading, error } = useMyAppointments();
```

### Example 3: Book Appointment
**Old (Supabase):**
```typescript
const { data } = await supabase
  .from('appointments')
  .insert([{
    patient_id: userId,
    doctor_id: doctorId,
    appointment_date: date,
  }]);
```

**New (Axios):**
```typescript
import { useBookAppointment } from '@/api/useAppointmentQueries';

const bookAppointmentMutation = useBookAppointment();
const newAppointment = await bookAppointmentMutation.mutateAsync({
  doctorId,
  appointmentDate: date,
});
```

## React Query (TanStack Query) Overview

### Key Concepts

#### 1. Queries (Data Fetching)
Used for fetching data that doesn't change often:
```typescript
const { data, isLoading, error, refetch } = useMyAppointments();
```

#### 2. Mutations (Create/Update/Delete)
Used for modifying data:
```typescript
const bookMutation = useBookAppointment();

bookMutation.mutate(
  { doctorId: 5, appointmentDate: '2026-04-15T10:00:00' },
  {
    onSuccess: () => console.log('Success!'),
    onError: (error) => console.error(error),
  }
);
```

#### 3. Query Invalidation
Automatically refetch data after mutations:
```typescript
// After booking an appointment, automatically refetch:
queryClient.invalidateQueries({ queryKey: appointmentKeys.myAppointments });
```

## Error Handling

### Automatic Error Handling
- **401 Unauthorized**: User is logged out and redirected to `/login`
- **Network Errors**: Passed to component error handler
- **400 Bad Request**: Error message shown to user

### Manual Error Handling
```typescript
const { data, isLoading, error } = useMyAppointments();

if (error instanceof AxiosError) {
  console.error('Error:', error.response?.data?.message);
}
```

## Role-Based Access Control

The backend enforces RBAC, but you can check roles on the frontend:

```typescript
import { useCurrentUser } from '@/api/useAuthQueries';

function AdminPanel() {
  const { data: user } = useCurrentUser();

  if (user?.role !== 'ADMIN') {
    return <div>Access Denied</div>;
  }

  return <div>Admin Content</div>;
}
```

## Updating Existing Components

### Step 1: Remove Supabase Imports
```typescript
// Remove this:
import { supabase } from '@/integrations/supabase/client';
```

### Step 2: Add API Query Hooks
```typescript
// Add this:
import { useMyAppointments } from '@/api/useAppointmentQueries';
```

### Step 3: Update Component Logic
Replace direct Supabase calls with hooks:
```typescript
function AppointmentsPage() {
  const { data: appointments, isLoading, error } = useMyAppointments();

  if (isLoading) return <Spinner />;
  if (error) return <Error message={error.message} />;

  return (
    <AppointmentsList appointments={appointments} />
  );
}
```

## API Endpoints Reference

### Auth
- `POST /api/auth/login` - Login (returns JWT)
- `POST /api/auth/register` - Register new user

### Appointments
- `POST /api/appointments/book` - Book appointment (PATIENT)
- `GET /api/appointments/my` - Get my appointments (PATIENT)
- `GET /api/appointments/doctor/{id}` - Doctor schedule (DOCTOR)
- `GET /api/appointments/all` - All appointments (ADMIN)
- `PUT /api/appointments/{id}/status` - Update status (ADMIN)
- `PUT /api/appointments/{id}/cancel` - Cancel appointment (PATIENT/DOCTOR)

## Troubleshooting

### Problem: "401 Unauthorized on all requests"
**Solution**: Make sure token is stored in localStorage after login:
```typescript
const loginMutation = useLogin();
// This automatically stores the token
await loginMutation.mutateAsync({ username, password });
```

### Problem: "CORS Error"
**Solution**: Ensure Spring Boot has CORS enabled (it should by default with `@CrossOrigin`).

### Problem: "Token not sent to backend"
**Solution**: Check browser DevTools → Network → Headers. The Authorization header should be present.

### Problem: "Old Supabase queries still running"
**Solution**: Remove any remaining Supabase imports and replace with service functions:
```typescript
// Find and replace all instances of:
supabase.from(...).select(...)
// With the appropriate API service calls
```

## Next Steps

1. **Update Auth Pages** - Replace Supabase auth with `useLogin` and `useRegister`
2. **Update Dashboard** - Use new appointment hooks
3. **Update Forms** - Use mutations for create/update operations
4. **Test Auth Flow** - Login, check token in localStorage, verify requests include token
5. **Check Console Errors** - Fix any remaining Supabase-related imports

## Example: Complete Component Refactor

### Before (Supabase)
```typescript
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export function AppointmentsList() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAppointments = async () => {
      const { data } = await supabase
        .from('appointments')
        .select('*, patient:patient_id(username), doctor:doctor_id(username)')
        .eq('patient_id', userId);
      setAppointments(data);
      setLoading(false);
    };

    fetchAppointments();
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      {appointments.map(apt => (
        <div key={apt.id}>{apt.appointment_date}</div>
      ))}
    </div>
  );
}
```

### After (Axios)
```typescript
import { useMyAppointments } from '@/api/useAppointmentQueries';

export function AppointmentsList() {
  const { data: appointments, isLoading } = useMyAppointments();

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      {appointments?.map(apt => (
        <div key={apt.id}>{apt.appointmentDate}</div>
      ))}
    </div>
  );
}
```

Much simpler! ✨