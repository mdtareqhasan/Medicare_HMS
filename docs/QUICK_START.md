# Quick Start: Running Backend & Frontend

## Prerequisites

- ✅ Java 17+ installed (`java -version`)
- ✅ Maven installed (`mvn -version`)
- ✅ MySQL 8+ running with `medicare_hms` database
- ✅ Node.js 16+ (`node -version`)
- ✅ npm/bun (`npm -version`)

---

## Part 1: Backend Setup (Spring Boot + MySQL)

### 1.1: Verify MySQL Database

```bash
# Windows: Open Command Prompt and login to MySQL
mysql -u root -p

# Inside MySQL shell (use your actual password)
CREATE DATABASE IF NOT EXISTS medicare_hms;
USE medicare_hms;
SHOW TABLES;  # Should show empty or existing tables
EXIT;
```

### 1.2: Build Backend

Before you build the backend, ensure Cloudinary credentials are available via environment variables or `application.properties`:
```
cloudinary.cloud_name=your_cloud_name
cloudinary.api_key=your_api_key
cloudinary.api_secret=your_api_secret
```

```bash
# Navigate to backend directory
cd "d:\Java Development\HMS With Ai\health-hub-main"

# Build project with Maven
mvn clean install -DskipTests

# On Windows, if Maven command not found, use
mvnw.cmd clean install -DskipTests

# Expected output: BUILD SUCCESS
```

### 1.3: Run Spring Boot Server

```bash
# Option 1: Using Maven
mvn spring-boot:run

# Option 2: Using Java directly (after build)
java -jar target/hms-backend-1.0.0.jar

# Expected Output:
# Started Application in X seconds
# Tomcat started on port(s): 8080
# Ready to accept requests
```

### 1.4: Verify Backend is Running

```bash
# In new terminal, while backend is running
curl http://localhost:8080/api/auth/login

# Expected: 405 Method Not Allowed (because we used GET instead of POST)
# This means server is running and route exists
```

✅ **Backend Ready** - Server running on `http://localhost:8080`

---

## Part 2: Frontend Setup (React + Vite)

### 2.1: Install Dependencies

```bash
# Navigate to frontend directory (same as backend directory)
cd "d:\Java Development\HMS With Ai\health-hub-main"

# Install dependencies
npm install
# or if using bun
bun install

# Install Axios if not already in package.json
npm install axios

# Expected output: added XX packages
```

### 2.2: Create Environment File

```bash
# Copy template
copy .env.example .env

# Edit .env file and ensure:
VITE_API_BASE_URL=http://localhost:8080
```

**File location:** `d:\Java Development\HMS With Ai\health-hub-main\.env`

**Contents:**
```env
VITE_API_BASE_URL=http://localhost:8080
VITE_APP_NAME=Healthcare Management System
```

### 2.3: Start Development Server

```bash
# While backend is still running, start frontend
npm run dev

# Expected output:
# VITE v5.x.x  ready in XXX ms
# ➜  Local:   http://localhost:5173/
# ➜  press h to show help
```

✅ **Frontend Ready** - App running on `http://localhost:5173`

---

## Part 3: Quick Integration Test

### 3.1: Open Application in Browser

1. Open browser and navigate to: `http://localhost:5173`
2. Press `F12` to open DevTools
3. Go to **Console** tab

### 3.2: Test Login via Browser Console

Copy-paste into Browser Console:

```javascript
// Test login endpoint
fetch('http://localhost:8080/api/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    username: 'testuser',
    password: 'password123'
  })
})
.then(r => r.json())
.then(data => {
  console.log('Response:', data);
  if (data.token) {
    localStorage.setItem('authToken', data.token);
    console.log('✅ Token saved to localStorage');
  }
})
.catch(e => console.error('❌ Error:', e));
```

### 3.3: Verify Token in Storage

In DevTools Console, paste:

```javascript
// Check localStorage
console.log('Token:', localStorage.getItem('authToken'));

// Check if it's valid (should start with eyJ)
if (localStorage.getItem('authToken')?.startsWith('eyJ')) {
  console.log('✅ Token format is valid');
}
```

✅ **Integration Working** - Frontend and Backend communicating

---

## Part 4: Common Startup Commands

### Quick Reference

```bash
# Terminal 1: Start Backend
cd "d:\Java Development\HMS With Ai\health-hub-main"
mvn spring-boot:run

# Terminal 2: Start Frontend
cd "d:\Java Development\HMS With Ai\health-hub-main"
npm run dev

# Access Application
# Frontend: http://localhost:5173
# Backend API: http://localhost:8080/api
# Swagger UI: http://localhost:8080/swagger-ui.html
```

### Separate Terminals

```bash
# Create 3 terminals:

# Terminal 1: MySQL (if not running as service)
mysql -u root -p

# Terminal 2: Backend
mvn spring-boot:run

# Terminal 3: Frontend
npm run dev
```

---

## Part 5: Stop Servers

### Stop Backend
```bash
# In backend terminal, press Ctrl+C
# Expected output: Shutting down daemon daemon
```

### Stop Frontend
```bash
# In frontend terminal, press Ctrl+C
# Expected output: ^C
```

---

## Troubleshooting Startup

### Backend Issues

| Issue | Solution |
|-------|----------|
| Port 8080 already in use | `netstat -ano \| findstr :8080` then kill process |
| Database connection error | Check MySQL is running, credentials in `application.properties` |
| Build fails | Run `mvn clean install -DskipTests` |
| Maven not found | Add Maven to PATH or use `mvnw.cmd` |

### Frontend Issues

| Issue | Solution |
|-------|----------|
| Port 5173 unavailable | Check `npm run dev` output, use different port with `--port` |
| Module not found | Run `npm install` again |
| Axios not installed | Run `npm install axios` |
| 404 on components | Check imports, verify file paths correct |

---

## Verify Everything Works

### Checklist

- [ ] Backend running on port 8080 (`http://localhost:8080/swagger-ui.html` loads)
- [ ] Frontend running on port 5173 (`http://localhost:5173` loads)
- [ ] Database has tables (`SHOW TABLES` in MySQL)
- [ ] Login returns JWT token (test in DevTools Console)
- [ ] Token saved to localStorage
- [ ] No CORS errors in Console

### Quick Verification Script

In browser console:

```javascript
// 1. Check if backend is accessible
fetch('http://localhost:8080/api/auth/login', {method: 'HEAD'})
  .then(() => console.log('✅ Backend accessible'))
  .catch(() => console.log('❌ Backend not accessible'));

// 2. Check localStorage
console.log('✅ Frontend running at:',  window.location.origin);
console.log('Token in storage:', !!localStorage.getItem('authToken'));

// 3. Check environment variable loaded
console.log('API URL will be:', import.meta.env.VITE_API_BASE_URL);
```

---

## Summary

| Component | URL | Port | Status |
|-----------|-----|------|--------|
| React Frontend | http://localhost:5173 | 5173 | ✅ Running |
| Spring Boot API | http://localhost:8080 | 8080 | ✅ Running |
| MySQL Database | localhost:3306 | 3306 | ✅ Running |
| Swagger UI | http://localhost:8080/swagger-ui.html | 8080 | ✅ Available |

---

## Next Steps

After both systems are running:

1. **Register user** via `/api/auth/register`
2. **Login** and get JWT token
3. **Test endpoints** in Swagger UI or DevTools Console
4. **Build React components** using React Query hooks
5. **Test end-to-end** login → dashboard flow

See `INTEGRATION_TESTING.md` for detailed test scenarios.
