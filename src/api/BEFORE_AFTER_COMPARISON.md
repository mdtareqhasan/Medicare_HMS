# Side-by-Side Comparison: Supabase vs Axios

## 1. Authentication

### Login - OLD (Supabase)
```typescript
import { supabase } from '@/integrations/supabase/client';

const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password123'
});

if (error) {
  console.error('Login failed:', error.message);
} else {
  // Store session
  const session = data.session;
  localStorage.setItem('token', session?.access_token);
  navigate('/dashboard');
}
```

### Login - NEW (Axios)
```typescript
import { useLogin } from '@/api/useAuthQueries';

const loginMutation = useLogin();

try {
  const response = await loginMutation.mutateAsync({
    username: 'john_doe',
    password: 'password123'
  });
  // Token automatically stored in localStorage
  navigate('/dashboard');
} catch (error) {
  console.error('Login failed:', error.message);
}
```

---

## 2. Fetching Data

### Get Appointments - OLD (Supabase)
```typescript
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

function AppointmentsList() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const { data, error } = await supabase
          .from('appointments')
          .select('*, doctor:doctor_id(*), patient:patient_id(*)')
          .eq('patient_id', userId);

        if (error) throw error;
        setAppointments(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAppointments();
  }, []); // No dependency handling, must manually refetch

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      {appointments.map(apt => (
        <div key={apt.id}>{apt.doctor.username}</div>
      ))}
    </div>
  );
}
```

### Get Appointments - NEW (Axios)
```typescript
import { useMyAppointments } from '@/api/useAppointmentQueries';

function AppointmentsList() {
  const { data: appointments, isLoading, error } = useMyAppointments();

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      {appointments?.map(apt => (
        <div key={apt.id}>{apt.doctor.username}</div>
      ))}
    </div>
  );
}
```

**Much cleaner!** ✨

---

## 3. Creating Data

### Book Appointment - OLD (Supabase)
```typescript
import { supabase } from '@/integrations/supabase/client';

async function bookAppointment(doctorId, date) {
  try {
    const { data, error } = await supabase
      .from('appointments')
      .insert([
        {
          patient_id: currentUserId,
          doctor_id: doctorId,
          appointment_date: date,
          status: 'SCHEDULED'
        }
      ])
      .select();

    if (error) throw error;

    // Manually refetch appointments
    setAppointments([...appointments, data[0]]);
    setShowBookingModal(false);
    
    return data[0];
  } catch (error) {
    console.error('Failed to book:', error.message);
  }
}
```

### Book Appointment - NEW (Axios)
```typescript
import { useBookAppointment } from '@/api/useAppointmentQueries';

function BookingModal() {
  const bookMutation = useBookAppointment();

  const handleBook = async (doctorId, date) => {
    try {
      const appointment = await bookMutation.mutateAsync({
        doctorId,
        appointmentDate: date
      });
      // React Query automatically updates cache
      setShowBookingModal(false);
    } catch (error) {
      console.error('Failed to book:', error.message);
    }
  };
}
```

---

## 4. Updating Data

### Update Status - OLD (Supabase)
```typescript
const { data, error } = await supabase
  .from('appointments')
  .update({ status: 'COMPLETED' })
  .eq('id', appointmentId)
  .select();

if (error) {
  console.error('Update failed:', error.message);
} else {
  // Manually update local state
  setAppointments(
    appointments.map(apt => 
      apt.id === appointmentId 
        ? { ...apt, status: 'COMPLETED' }
        : apt
    )
  );
}
```

### Update Status - NEW (Axios)
```typescript
const updateMutation = useUpdateAppointmentStatus();

const handleComplete = async (appointmentId) => {
  await updateMutation.mutateAsync({
    appointmentId,
    status: 'COMPLETED'
  });
  // React Query automatically updates cache
};
```

---

## 5. Real-time Subscriptions

### Listen to Changes - OLD (Supabase)
```typescript
useEffect(() => {
  const subscription = supabase
    .channel('appointments')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'appointments' },
      (payload) => {
        console.log('Change in appointments', payload);
        // Manually handle the change
        setAppointments(prev => [...prev, payload.new]);
      }
    )
    .subscribe();

  return () => subscription.unsubscribe();
}, []);
```

### Listen to Changes - NEW (Axios)
```typescript
// For real-time updates, use WebSockets or polling:

// Option 1: Polling (auto-refetch every 5 seconds)
const { data } = useQuery({
  queryKey: ['appointments'],
  queryFn: fetchAppointments,
  refetchInterval: 5000 // 5 seconds
});

// Option 2: Manual refetch
const { refetch } = useMyAppointments();
const handleRefresh = () => refetch();

// Option 3: Implement WebSockets for true real-time (coming soon)
```

---

## 6. Error Handling

### OLD (Supabase)
```typescript
const { data, error } = await supabase
  .from('appointments')
  .select('*');

if (error) {
  // No standardized error format
  console.error('Code:', error.code);
  console.error('Message:', error.message);
}
```

### NEW (Axios)
```typescript
try {
  const response = await appointmentService.getMyAppointments();
} catch (error) {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    const message = error.response?.data?.message;
    
    if (status === 401) {
      // Auto-logged out and redirected
    } else if (status === 400) {
      // Validation error
      console.error('Validation:', message);
    }
  }
}
```

---

## 7. Token Management

### OLD (Supabase)
```typescript
// Token managed by Supabase automatically
// But you need to handle it manually for API calls:

const token = (await supabase.auth.getSession()).data.session?.access_token;

const response = await fetch('/api/endpoint', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

### NEW (Axios)
```typescript
// Token automatically added to all requests via interceptor
const { data } = await appointmentService.getMyAppointments();
// No manual header management needed!

// Token stored in localStorage:
const token = localStorage.getItem('authToken');

// Automatically added to all Axios requests
```

---

## 8. File Upload

### OLD (Supabase)
```typescript
const { data, error } = await supabase.storage
  .from('documents')
  .upload(`users/${userId}/${file.name}`, file);

if (error) throw error;

const { data: publicUrl } = supabase.storage
  .from('documents')
  .getPublicUrl(data.path);
```

### NEW (Axios)
```typescript
// Still being implemented with Spring Boot
// Will use multipart/form-data:

const formData = new FormData();
formData.append('file', file);

const response = await axiosInstance.post(
  '/documents/upload',
  formData,
  { headers: { 'Content-Type': 'multipart/form-data' } }
);
```

---

## Summary Table

| Feature | Supabase | Axios |
|---------|----------|-------|
| **Setup** | Complex initialization | Simple config file |
| **Authentication** | Built-in auth system | Spring Security + JWT |
| **Queries** | `.from().select()` | Service function calls |
| **Mutations** | `.insert().update().delete()` | Service mutations |
| **Caching** | Manual state management | React Query auto-handles |
| **Refetching** | Manual imperative | React Query declarative |
| **Real-time** | Built-in subscriptions | Polling/WebSockets (custom) |
| **Errors** | Custom error objects | Standard HTTP status codes |
| **Token Management** | Automatic but needs manual passing | Automatic interceptor |
| **Type Safety** | Good with generated types | Good with custom interfaces |
| **Learning Curve** | Medium | Low to Medium |
| **Backend Control** | Limited (managed service) | Full control (Spring Boot) |

---

## Migration Checklist

- [ ] Remove all `import { supabase }` statements
- [ ] Replace `supabase.auth` with `useLogin`, `useRegister`
- [ ] Replace `supabase.from().select()` with API service calls
- [ ] Replace `supabase.from().insert()` with mutation hooks
- [ ] Add `<AppProviders>` wrapper to app
- [ ] Create `.env` file with API URL
- [ ] Test login with new auth flow
- [ ] Verify JWT token in localStorage
- [ ] Test fetch queries
- [ ] Test mutations (create/update/delete)
- [ ] Remove `src/integrations/supabase` folder
- [ ] Delete unused Supabase dependencies from package.json

---

## Key Takeaways

1. **Simpler API calls** - Service functions + hooks instead of chained methods
2. **Better caching** - React Query handles it automatically
3. **Type safety** - Custom interfaces instead of auto-generated types
4. **More control** - Backend logic in Spring Boot, not Supabase rules
5. **Easier testing** - Mock services instead of mock Supabase
6. **Standard patterns** - Follows REST + JWT conventions

The new system is **more explicit, more testable, and more scalable** for enterprise applications. 🚀