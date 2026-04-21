# Frontend-Backend Integration Testing Guide

## Pre-Integration Checklist

### Backend Requirements
- [ ] Spring Boot application built and running
- [ ] MySQL database created and migrations applied
- [ ] Backend server running on `http://localhost:8080`
- [ ] All endpoints accessible via Postman/Swagger UI

### Frontend Requirements  
- [ ] React project setup complete
- [ ] Axios installed (`npm install axios`)
- [ ] Environment file created (`.env` from `.env.example`)
- [ ] `src/api/` folder with new services created
- [ ] App wrapped with `<AppProviders>`

---

## Step 1: Verify Backend is Running

### Test 1.1: Backend Health Check
```bash
# Terminal
curl http://localhost:8080/swagger-ui/index.html
```

**Expected:** Swagger UI page loads (or check http://localhost:8080/api/auth/login returns 405 Method Not Allowed)

### Test 1.2: Check Available Endpoints
```bash
# Terminal
curl -X OPTIONS http://localhost:8080/api/auth/login -v
```

**Expected Headers in Response:**
```
Access-Control-Allow-Origin: http://localhost:5173
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS, PATCH
```

---

## Step 2: Test Authentication Flow

### Test 2.1: Register New User

**Using Postman or curl:**

```bash
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "password123"
  }'
```

**Expected Response:**
```json
{
  "message": "User registered successfully!"
}
```

### Test 2.2: Login User

```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "password123"
  }'
```

**Expected Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "type": "Bearer",
  "id": 1,
  "username": "testuser",
  "email": "test@example.com",
  "role": "PATIENT"
}
```

**Copy the token value for next tests**

### Test 2.3: Use Token in Request

```bash
# Replace YOUR_TOKEN with actual token from above
curl -X GET http://localhost:8080/api/appointments/my \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

**Expected Response:**
```json
[]  // Empty array or list of appointments
```

---

## Step 3: Frontend Integration Tests

### Test 3.1: Run Frontend Development Server

```bash
# Terminal in frontend directory
npm run dev
```

**Expected:** Vite dev server running on `http://localhost:5173`

### Test 3.2: Open Browser DevTools

1. Open `http://localhost:5173`
2. Press `F12` to open DevTools
3. Go to **Network** tab
4. Go to **Storage → Local Storage → http://localhost:5173**

### Test 3.3: Test Login from React

**Create test component:**
```typescript
// src/pages/TestPage.tsx
import { useLogin } from '@/api/useAuthQueries';
import { useState } from 'react';

export function TestPage() {
  const [result, setResult] = useState('');
  const loginMutation = useLogin();

  const handleTest = async () => {
    try {
      const response = await loginMutation.mutateAsync({
        username: 'testuser',
        password: 'password123'
      });
      setResult(JSON.stringify(response, null, 2));
    } catch (error: any) {
      setResult('Error: ' + error.message);
    }
  };

  return (
    <div>
      <button onClick={handleTest}>Test Login</button>
      <pre>{result}</pre>
    </div>
  );
}
```

### Test 3.4: Verify Token Storage

**After clicking "Test Login":**

1. Check **Storage → Local Storage → http://localhost:5173**
2. Look for `authToken` entry
3. Value should start with `eyJ...`

### Test 3.5: Check Network Request

1. In DevTools **Network** tab
2. Look for `LOGIN` request (or `/api/auth/login`)
3. Click on it
4. Go to **Headers** tab
5. Scroll to "Response Headers"
6. Check for CORS headers:
   - `access-control-allow-origin: http://localhost:5173`
   - `access-control-allow-credentials: true`

---

## Step 4: API Endpoint Testing

### Test 4.1: GET Appointments

**React Hook:**
```typescript
import { useMyAppointments } from '@/api/useAppointmentQueries';

function TestAppointments() {
  const { data, isLoading, error } = useMyAppointments();
  
  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  
  return <div>Appointments: {JSON.stringify(data)}</div>;
}
```

**Expected:** Empty array `[]` on first call

### Test 4.2: POST Book Appointment

**First, create doctor user:**

```bash
# Backend - register as ADMIN first to create doctor
# Then manually update database:
UPDATE users SET role = 'DOCTOR' WHERE id = 2;
```

**React Code:**
```typescript
import { useBookAppointment } from '@/api/useAppointmentQueries';

function TestBook() {
  const bookMutation = useBookAppointment();

  const handleBook = async () => {
    try {
      const result = await bookMutation.mutateAsync({
        doctorId: 2,  // ID of doctor user
        appointmentDate: new Date(2026, 3, 15, 10, 30).toISOString(),
        notes: 'Test appointment'
      });
      console.log('Booked:', result);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  return <button onClick={handleBook}>Book Appointment</button>;
}
```

**Expected:** New appointment returned with status SCHEDULED

---

## Step 5: Error Handling Tests

### Test 5.1: Invalid Credentials

```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "wrong",
    "password": "wrong"
  }'
```

**Expected:** 400 Bad Request with error message

### Test 5.2: Validation Error

```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "ab",
    "password": "short"
  }'
```

**Expected:** 400 with validation error

### Test 5.3: Missing Token

```bash
curl -X GET http://localhost:8080/api/appointments/my
```

**Expected:** 401 Unauthorized

### Test 5.4: Invalid Token

```bash
curl -X GET http://localhost:8080/api/appointments/my \
  -H "Authorization: Bearer invalid_token_here"
```

**Expected:** 401 Unauthorized

### Test 5.5: Expired/Old Token

After token expires (24 hours), any request will return 401, and frontend will auto-logout.

---

## Step 6: CORS Testing

### Test 6.1: Preflight Request

**DevTools → Network → Headers:**

For any POST/PUT request, look for TWO requests:
1. **OPTIONS** request (preflight)
2. **POST/PUT** request (actual)

**OPTIONS response should have:**
```
access-control-allow-origin: http://localhost:5173
access-control-allow-methods: GET, POST, PUT, DELETE, OPTIONS, PATCH
access-control-allow-headers: authorization, content-type, ...
```

### Test 6.2: CORS Error (Wrong Origin)

**If you try accessing from different origin:**
```javascript
// In browser console at some other site
fetch('http://localhost:8080/api/appointments/my', {
  headers: { 'Authorization': 'Bearer token' }
})
```

**Expected Error:**
```
Access to XMLHttpRequest at 'http://localhost:8080/api/appointments/my' 
from origin 'https://example.com' has been blocked by CORS policy
```

---

## Step 7: Role-Based Access Control Testing

### Test 7.1: Patient Accessing Doctor Endpoint

**As PATIENT user:**
```typescript
import { useAllAppointments } from '@/api/useAppointmentQueries';

function TestAdminAccess() {
  const { data, error } = useAllAppointments();
  
  // error will contain 403 Forbidden
  return <div>Error: {error?.message}</div>;
}
```

**Expected:** 403 Forbidden

### Test 7.2: Doctor Accessing Own Schedule

**As DOCTOR user:**
```typescript
const { data: schedule } = useDoctorSchedule(doctorId);
// Should work and return appointments
```

**Expected:** Returns doctor's appointments

---

## Integration Test Checklist

### ✅ Complete Integration Test

Create this comprehensive test component:

```typescript
// src/pages/IntegrationTest.tsx
import { useState } from 'react';
import { useLogin, useCurrentUser } from '@/api/useAuthQueries';
import { useMyAppointments, useBookAppointment } from '@/api/useAppointmentQueries';

export function IntegrationTest() {
  const [testLog, setTestLog] = useState<string[]>([]);
  const loginMutation = useLogin();
  const currentUserQuery = useCurrentUser();
  const appointmentsQuery = useMyAppointments();
  const bookMutation = useBookAppointment();

  const addLog = (message: string) => {
    setTestLog(prev => [`[${new Date().toLocaleTimeString()}] ${message}`, ...prev]);
  };

  const runTests = async () => {
    try {
      // Test 1: Login
      addLog('🔄 Testing login...');
      const loginResponse = await loginMutation.mutateAsync({
        username: 'testuser',
        password: 'password123'
      });
      addLog(`✅ Login successful: ${loginResponse.username}`);
      addLog(`✅ Token stored: ${localStorage.getItem('authToken')?.substring(0, 20)}...`);

      // Test 2: Get Current User
      addLog('🔄 Testing current user...');
      const user = currentUserQuery.data;
      if (user) {
        addLog(`✅ Current user: ${user.username} (${user.role})`);
      }

      // Test 3: Get Appointments
      addLog('🔄 Fetching appointments...');
      const appointments = appointmentsQuery.data;
      addLog(`✅ Found ${appointments?.length || 0} appointments`);

      // Test 4: Book Appointment
      addLog('🔄 Testing appointment booking...');
      try {
        const newApt = await bookMutation.mutateAsync({
          doctorId: 2,
          appointmentDate: new Date(2026, 3, 15, 10, 30).toISOString(),
          notes: 'Integration test'
        });
        addLog(`✅ Appointment booked: ID ${newApt.id}`);
      } catch (error: any) {
        addLog(`ℹ️ Booking failed (expected if no doctor): ${error.message}`);
      }

      addLog('✅ All tests completed');
    } catch (error: any) {
      addLog(`❌ Error: ${error.message}`);
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1>Frontend-Backend Integration Test</h1>
      <button onClick={runTests} style={{ padding: '10px 20px', fontSize: '16px' }}>
        Run Tests
      </button>
      <div style={{ marginTop: '20px', maxHeight: '500px', overflow: 'auto', border: '1px solid #ccc', padding: '10px' }}>
        {testLog.map((log, i) => (
          <div key={i} style={{ fontFamily: 'monospace', marginBottom: '5px' }}>
            {log}
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## Troubleshooting Common Issues

### Issue: CORS Error

**Symptom:**
```
Access to XMLHttpRequest at 'http://localhost:8080/api/auth/login' 
from origin 'http://localhost:5173' has been blocked by CORS policy
```

**Solutions:**
1. Check backend is running on :8080
2. Verify `localhost:5173` is in `corsConfigurationSource()`
3. Check response headers in DevTools → Network
4. Restart Spring Boot if you modified SecurityConfig

### Issue: 401 on All Requests After Login

**Symptom:** Login works, but subsequent requests return 401

**Solutions:**
1. Check `authToken` in localStorage
2. Check Authorization header in Network tab DevTools
3. Verify JWT secret in backend matches
4. Check token expiration time

### Issue: 404 on Endpoints

**Symptom:** No Route Matches endpoint

**Solutions:**
1. Verify endpoint path matches exactly (case-sensitive)
2. Check @RequestMapping path
3. Verify method matches (GET vs POST)
4. Check @PreAuthorize conditions

### Issue: Blank Form/No Data

**Symptom:** useQuery hook returns undefined data

**Solutions:**
1. Check `isLoading` state
2. Check `error` state for details
3. Verify token is valid
4. Check browser console for errors
5. Check Network tab for API response

### Issue: Form Submission Fails

**Symptom:** Button click does nothing or shows network error

**Solutions:**
1. Check input validation (5-20 chars, valid email)
2. Check console for error messages
3. Verify API endpoint exists
4. Check user permissions (role-based)
5. Verify request body format matches DTO

---

## Success Criteria

✅ **All tests pass if:**
- Login returns JWT token
- Token stored in localStorage
- Authorization header sent with requests
- CORS headers present in responses
- Appointments fetched successfully
- Unauthorized requests return 401
- Forbidden requests return 403
- Validation errors return 400
- Error responses in consistent format

---

## Next Steps After Integration

1. ✅ Complete integration tests
2. → Build patient dashboard
3. → Build doctor schedule view
4. → Build admin management panel
5. → Add notifications
6. → Performance optimization
7. → Deploy to production

---

## Support

If tests fail, check:
1. Backend logs: `java -jar backend.jar`
2. Browser console: F12 → Console tab
3. Network requests: F12 → Network tab
4. Database: Verify user record exists
5. Configuration files: Check endpoints and secrets

**Common LOG locations:**
- Backend: Spring Boot console output
- Frontend: Browser console (F12)
- Network: DevTools Network tab (F12)