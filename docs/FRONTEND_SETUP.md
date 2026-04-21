# Frontend Setup Checklist

## Pre-Setup
- [ ] Spring Boot backend is running on `http://localhost:8080`
- [ ] MySQL database is running and populated with schema
- [ ] Backend API is accessible at `http://localhost:8080/api`

## Step 1: Install Dependencies
```bash
# Option A: Run batch file (Windows)
./install-dependencies.bat

# Option B: Run shell script (Mac/Linux)
bash install-dependencies.sh

# Option C: Manual install
npm install axios
```

## Step 2: Environment Configuration
```bash
# Copy the example env file
cp .env.example .env

# Edit .env and set the API base URL
# VITE_API_BASE_URL=http://localhost:8080/api
```

## Step 3: Verify Installation
Check `node_modules` contains:
- [ ] `axios`
- [ ] `@tanstack/react-query` (should already exist)

## Step 4: Update App Entry Point

### If using main.tsx:
```typescript
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { AppProviders } from "./providers/AppProviders.tsx";

createRoot(document.getElementById("root")!).render(
  <AppProviders>
    <App />
  </AppProviders>
);
```

## Step 5: Test Authentication
Create a simple test page:

```typescript
// pages/TestAuth.tsx
import { useLogin } from '@/api/useAuthQueries';

export function TestAuth() {
  const loginMutation = useLogin();

  return (
    <button 
      onClick={() => loginMutation.mutate({ 
        username: 'testuser', 
        password: 'password123' 
      })}
    >
      Test Login
    </button>
  );
}
```

1. Register a new user via `POST /api/auth/register`
2. Login via the test page
3. Check browser DevTools → Storage → Local Storage for `authToken`
4. Verify token is present in Network tab → Headers → Authorization

## Step 6: Update Existing Components
For each component using Supabase:

1. Remove: `import { supabase } from '@/integrations/supabase/client'`
2. Add: `import { useMyAppointments } from '@/api/useAppointmentQueries'`
3. Replace Supabase calls with hooks
4. Handle loading/error states

See `src/api/EXAMPLES.tsx` for examples.

## Step 7: Remove Old Supabase Code
```bash
# Optional: Keep the old integrations folder for reference
# But don't use it in active code

# Search for remaining Supabase imports:
grep -r "supabase" src --include="*.tsx" --include="*.ts"

# Replace each occurrence with appropriate API service/hook
```

## Step 8: Test the Application
1. [ ] npm run dev
2. [ ] Register new user
3. [ ] Login
4. [ ] Load appointments
5. [ ] Book appointment
6. [ ] Cancel appointment
7. [ ] Check admin view

## Verification Checklist

### Token in LocalStorage
- [ ] Login successful
- [ ] `localStorage.authToken` contains JWT
- [ ] Token starts with proper format

### API Requests
- [ ] Network tab shows requests to `http://localhost:8080/api`
- [ ] Authorization header present in requests: `Bearer <token>`
- [ ] 200/201 responses for successful requests
- [ ] 401 for unauthorized, redirects to login

### React Query Caching
- [ ] First load fetches data
- [ ] Second load uses cache (no API call for stale data within 5 mins)
- [ ] Mutations invalidate related queries
- [ ] Data refetches after mutations

## Troubleshooting Commands

```bash
# Clear all npm cache
npm cache clean --force

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Check for TypeScript errors
npm run build

# Run tests
npm test

# Development server with verbose output
npm run dev -- --debug
```

## Common Issues

| Issue | Solution |
|-------|----------|
| 404 /api/auth/login | Check Spring Boot is running on :8080 |
| CORS Error | Check @CrossOrigin in backend controllers |
| Token not persisting | Check localStorage is enabled in browser |
| Components not re-rendering | Ensure QueryClientProvider wraps app |
| Stale data shown | Reduce `staleTime` in Query configuration |

## Documentation
- [Migration Guide](./MIGRATION_GUIDE.md) - Detailed migration steps
- [Examples](./EXAMPLES.tsx) - Code examples for all features
- [API Services](./appointmentService.ts) - API service functions
- [React Query Hooks](./useAppointmentQueries.ts) - Available hooks

## Next Steps After Setup
1. ✅ User authentication working
2. → Implement patient dashboard
3. → Implement doctor schedule
4. → Implement admin management panel
5. → Add notifications/messages
6. → Deploy to production