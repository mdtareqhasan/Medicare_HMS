# Quick Reference: API Services & Hooks

## Authorization & Token Management

### Login
```typescript
import { useLogin } from '@/api/useAuthQueries';

const loginMutation = useLogin();

// Trigger login
await loginMutation.mutateAsync({
  username: 'john_doe',
  password: 'password123'
});

// States
loginMutation.isPending     // true while loading
loginMutation.isError       // true if error
loginMutation.data          // AuthResponse with token
loginMutation.error         // Error object
```

### Register
```typescript
import { useRegister } from '@/api/useAuthQueries';

const registerMutation = useRegister();

await registerMutation.mutateAsync({
  username: 'john_doe',
  email: 'john@example.com',
  password: 'password123'
});
```

### Get Current User
```typescript
import { useCurrentUser } from '@/api/useAuthQueries';

const { data: user } = useCurrentUser();
// Returns: { id, username, email, role, token, type }
```

### Logout
```typescript
import { useLogout } from '@/api/useAuthQueries';

const logoutMutation = useLogout();
await logoutMutation.mutateAsync();
```

---

## Appointments Management

### Get My Appointments (Patient)
```typescript
import { useMyAppointments } from '@/api/useAppointmentQueries';

const { data: appointments, isLoading, error } = useMyAppointments();
// Returns: Array of Appointment objects
```

### Get Doctor Schedule (Doctor)
```typescript
import { useDoctorSchedule } from '@/api/useAppointmentQueries';

const { data: schedule } = useDoctorSchedule(doctorId);
// Returns: Array of doctor's appointments
```

### Get All Appointments (Admin)
```typescript
import { useAllAppointments } from '@/api/useAppointmentQueries';

const { data: allAppointments } = useAllAppointments();
// Returns: All appointments in system
```

### Book Appointment (Patient)
```typescript
import { useBookAppointment } from '@/api/useAppointmentQueries';

const bookMutation = useBookAppointment();

const newAppointment = await bookMutation.mutateAsync({
  doctorId: 5,
  appointmentDate: '2026-04-15T10:30:00',
  notes: 'Regular checkup'
});

// Query cache automatically updates
```

### Update Status (Admin/Doctor)
```typescript
import { useUpdateAppointmentStatus } from '@/api/useAppointmentQueries';

const updateMutation = useUpdateAppointmentStatus();

await updateMutation.mutateAsync({
  appointmentId: 123,
  status: 'COMPLETED' // or 'SCHEDULED', 'CANCELLED'
});
```

### Cancel Appointment (Patient/Doctor)
```typescript
import { useCancelAppointment } from '@/api/useAppointmentQueries';

const cancelMutation = useCancelAppointment();

await cancelMutation.mutateAsync(appointmentId);
```

---

## File Upload

The generic upload endpoint returns a secure URL from Cloudinary.
It can be used for avatars, lab reports, etc.

```typescript
import axiosInstance from '@/api/axiosInstance';

async function uploadFile(file: File) {
  const form = new FormData();
  form.append('file', file);
  const res = await axiosInstance.post('/api/v1/upload', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data.url as string;
}
```

You can also use the `FileUpload` component from `src/components/FileUpload.tsx` which wraps this logic with loading state and toast notifications.

---

## Direct Service Calls (No React Hooks)

For non-React contexts or custom patterns:

```typescript
import { authService, appointmentService } from '@/api';

// Auth
await authService.login({ username, password });
await authService.register({ username, email, password });
await authService.logout();
const user = authService.getCurrentUser();
const token = authService.getToken();

// Appointments
await appointmentService.bookAppointment({ doctorId, appointmentDate, notes });
const myApts = await appointmentService.getMyAppointments();
const schedule = await appointmentService.getDoctorSchedule(doctorId);
const all = await appointmentService.getAllAppointments();
await appointmentService.updateAppointmentStatus(aptId, status);
await appointmentService.cancelAppointment(aptId);
```

---

## Data Types

### Appointment
```typescript
interface Appointment {
  id: number;
  patient: {
    id: number;
    username: string;
    email: string;
  };
  doctor: {
    id: number;
    username: string;
    email: string;
  };
  appointmentDate: string;        // ISO 8601 format
  status: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED';
  notes?: string;
  createdAt: string;
}
```

### AuthResponse
```typescript
interface AuthResponse {
  token: string;
  type: string;                    // 'Bearer'
  id: number;
  username: string;
  email: string;
  role: string;                    // 'ADMIN', 'DOCTOR', etc.
}
```

---

## Common Patterns

### Loading & Error States
```typescript
function AppointmentsList() {
  const { data, isLoading, error } = useMyAppointments();

  if (isLoading) return <Spinner />;
  if (error) return <ErrorMessage error={error} />;
  if (!data?.length) return <EmptyState />;

  return <List items={data} />;
}
```

### Mutations with Toast Notifications
```typescript
import { toast } from 'sonner';
import { useBookAppointment } from '@/api/useAppointmentQueries';

const bookMutation = useBookAppointment();

const handleBook = () => {
  bookMutation.mutate(
    { doctorId: 5, appointmentDate: date },
    {
      onSuccess: (data) => {
        toast.success(`Appointment booked for ${data.appointmentDate}`);
      },
      onError: (error) => {
        toast.error(`Failed to book: ${error.message}`);
      },
    }
  );
};
```

### Refetch on Demand
```typescript
const { data, refetch } = useMyAppointments();

const handleRefresh = () => {
  refetch();
};
```

### Manual Query Cache Updates
```typescript
import { useQueryClient } from '@tanstack/react-query';
import { appointmentKeys } from '@/api/useAppointmentQueries';

const queryClient = useQueryClient();

// Invalidate to force refetch
queryClient.invalidateQueries({ queryKey: appointmentKeys.myAppointments });

// Or update manually
queryClient.setQueryData(
  appointmentKeys.myAppointments,
  (old) => [...old, newAppointment]
);
```

---

## Headers & Configuration

### Automatic Headers (Axios Interceptor)
```
Authorization: Bearer <jwt-token>
Content-Type: application/json
```

### Bearer Token Format
The JWT token is sent as:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## Error Handling Details

### HTTP Status Codes
- **200** - Success
- **201** - Created
- **400** - Bad Request (validation error)
- **401** - Unauthorized (invalid token, auto-logout)
- **403** - Forbidden (insufficient permissions)
- **404** - Not Found
- **500** - Server Error

### Error Objects
```typescript
// Axios Error
import axios from 'axios';

try {
  // API call
} catch (error) {
  if (axios.isAxiosError(error)) {
    console.log('Status:', error.response?.status);
    console.log('Message:', error.response?.data?.message);
  }
}
```

---

## Caching & Stale Time

### Current Configuration
- **Stale Time**: 5 minutes (data is fresh for 5 mins)
- **Cache**: Indefinite (data kept unless invalidated)
- **Refetch**: On window focus, after mutations

### Adjust Per Query
```typescript
const { data } = useQuery({
  queryKey: ['key'],
  queryFn: fetchFn,
  staleTime: 1000 * 60 * 10,  // 10 minutes
  gcTime: 1000 * 60 * 15,     // 15 minutes
});
```

---

## Checklist for Using API

- [ ] Import hooks from `@/api`
- [ ] Handle `isLoading` and `error` states
- [ ] Use `mutateAsync` for sequential operations
- [ ] Use `mutate` for fire-and-forget operations
- [ ] Check `isPending` while mutation is running
- [ ] Clear sensitive data on logout
- [ ] Verify Bearer token in Network tab
- [ ] Test role-based access with different users