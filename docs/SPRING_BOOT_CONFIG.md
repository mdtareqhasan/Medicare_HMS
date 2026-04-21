# Spring Boot Configuration for React Frontend Integration

## Overview
This document explains the setup for integrating your React frontend (running on Vite at localhost:5173) with your Spring Boot backend with proper DTO validation, CORS configuration, and JWT authentication.

---

## 1. DTOs with Validation

All DTOs now include proper validation annotations that match your React frontend expectations.

### LoginRequest DTO
```java
@Data
@NotBlank(message = "Username is required")
@Size(min = 3, max = 20, message = "Username must be between 3 and 20 characters")
private String username;

@NotBlank(message = "Password is required")
@Size(min = 6, max = 40, message = "Password must be between 6 and 40 characters")
private String password;
```

**React Call:**
```typescript
const { mutateAsync: login } = useLogin();
await login({ username: 'john_doe', password: 'password123' });
```

### SignupRequest DTO
```java
@NotBlank(message = "Username is required")
@Size(min = 3, max = 20)
private String username;

@NotBlank(message = "Email is required")
@Email(message = "Email should be valid")
private String email;

@NotBlank(message = "Password is required")
@Size(min = 6, max = 40)
private String password;
```

### AuthResponse DTO
Returned exactly as your React frontend expects:
```java
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "type": "Bearer",
  "id": 1,
  "username": "john_doe",
  "email": "john@example.com",
  "role": "PATIENT"
}
```

### AppointmentRequest DTO
```java
@NotNull(message = "Doctor ID is required")
private Long doctorId;

@NotNull(message = "Appointment date is required")
@JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
private LocalDateTime appointmentDate;

@Size(max = 500)
private String notes;
```

**React Call:**
```typescript
const { mutateAsync: book } = useBookAppointment();
await book({
  doctorId: 5,
  appointmentDate: '2026-04-15T10:30:00',
  notes: 'Checkup'
});
```

---

## 2. CORS Configuration

CORS is now centrally configured in `SecurityConfig.java` instead of using `@CrossOrigin` on individual controllers.

### Allowed Origins
```java
configuration.setAllowedOrigins(Arrays.asList(
    "http://localhost:5173",    // Vite dev server (primary)
    "http://localhost:3000",    // Alternative port
    "http://localhost:8080"     // Same origin
));
```

### Allowed Methods
```
GET, POST, PUT, DELETE, OPTIONS, PATCH
```

### Allowed Headers
```
Authorization
Content-Type
Accept
Origin
X-Requested-With
Access-Control-Request-Method
Access-Control-Request-Headers
```

### Exposed Headers
```
Authorization
X-Total-Count
```

### How It Works

1. Browser sends preflight request (OPTIONS) before actual request
2. Spring Boot returns CORS headers
3. Browser allows the actual request to proceed

**Example Request Flow:**

```
1. React sends: POST /api/auth/login
   Headers: {
     'Content-Type': 'application/json',
     'Authorization': 'Bearer <token>'
   }

2. Axios interceptor adds token to Authorization header

3. Browser sees cross-origin request, sends preflight:
   OPTIONS /api/auth/login
   Origin: http://localhost:5173

4. Spring Boot CORS filter approves and returns:
   Access-Control-Allow-Origin: http://localhost:5173
   Access-Control-Allow-Methods: POST
   Access-Control-Allow-Headers: Authorization, Content-Type

5. Browser sends actual POST request

6. Spring Security validates JWT token

7. Request processed with authenticated user context
```

---

## 3. Controller Updates

### Using @AuthenticationPrincipal

All endpoints now use `@AuthenticationPrincipal` to get the current user from JWT:

```java
@PostMapping("/book")
@PreAuthorize("hasRole('PATIENT')")
public ResponseEntity<?> bookAppointment(
        @Valid @RequestBody AppointmentRequest request,
        @AuthenticationPrincipal UserDetailsImpl currentUser) {
    // currentUser contains: id, username, email, role, authorities
    // No need to parse from SecurityContextHolder
}
```

**Benefits:**
- Cleaner code
- Type-safe user object
- Better testability
- Explicit dependency

### Remove @CrossOrigin

All controllers now use a single CORS configuration, so `@CrossOrigin(origins = "*")` is removed:

**Before:**
```java
@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
public class AuthController { ... }
```

**After:**
```java
@RestController
public class AuthController { ... }
```

### Standardized Error Responses

All endpoints now return consistent error format:

```java
Map<String, String> error = new HashMap<>();
error.put("error", e.getMessage());
return ResponseEntity.badRequest().body(error);
```

---

## 4. Cloudinary File Upload Integration

To support profile pictures, lab reports, and other files we added Cloudinary.

### Backend Configuration

1. **pom.xml** dependency:
    ```xml
    <dependency>
        <groupId>com.cloudinary</groupId>
        <artifactId>cloudinary-http5</artifactId>
        <version>1.30.0</version>
    </dependency>
    ```
2. **application.properties** (values loaded from environment):
    ```properties
    cloudinary.cloud_name=${CLOUDINARY_CLOUD_NAME}
    cloudinary.api_key=${CLOUDINARY_API_KEY}
    cloudinary.api_secret=${CLOUDINARY_API_SECRET}
    ```
3. **CloudinaryConfig.java** bean to initialize the SDK:
    ```java
    @Configuration
    public class CloudinaryConfig {
        @Value("${cloudinary.cloud_name}")
        private String cloudName;
        @Value("${cloudinary.api_key}")
        private String apiKey;
        @Value("${cloudinary.api_secret}")
        private String apiSecret;

        @Bean
        public Cloudinary cloudinary() {
            Map<String,String> config = new HashMap<>();
            config.put("cloud_name", cloudName);
            config.put("api_key", apiKey);
            config.put("api_secret", apiSecret);
            return new Cloudinary(config);
        }
    }
    ```
4. **CloudinaryService** encapsulates the upload logic:
    ```java
    public String uploadFile(MultipartFile file, String folderName) throws IOException {
        Map<?,?> result = cloudinary.uploader().upload(file.getBytes(),
                ObjectUtils.asMap("folder", folderName));
        return result.get("secure_url").toString();
    }
    ```

### Controllers Using Cloudinary

- `FileUploadController` exposes a generic `/api/v1/upload` endpoint for authenticated users. It validates file type (images or PDF) and size before delegating to service.
- `ProfileController` now has a `PUT /api/profile/avatar` route; it uploads the file and stores the returned URL in the `avatar` column of the `profiles` table (mapped to `avatarUrl` field).
- `LabReportController` provides `POST /api/lab/reports` for lab technicians; the file URL is stored in the `lab_reports.file_path` column (mapped to `fileUrl`).

---

## 5. Google OAuth2 Login

We’ve added OAuth2 login support using Google to give users password‑less access.

### Dependencies & Properties

* `spring-boot-starter-oauth2-client` in `pom.xml`.
* Add in `application.properties`:
  ```properties
  spring.security.oauth2.client.registration.google.client-id=YOUR_GOOGLE_CLIENT_ID_HERE
  spring.security.oauth2.client.registration.google.client-secret=YOUR_GOOGLE_CLIENT_SECRET_HERE
  spring.security.oauth2.client.registration.google.scope=openid,profile,email
  ```

### Security Configuration

`SecurityConfig` permits `/oauth2/**` and configures the OAuth2 login handler:
```java
.oauth2Login(oauth -> oauth
        .successHandler(oAuth2LoginSuccessHandler));
```

The handler (`OAuth2LoginSuccessHandler`) checks for an existing user by email, creates a new `PATIENT` user and profile if necessary (saving the Google picture URL), then generates a JWT and redirects to the frontend:
```
http://localhost:5173?token=<jwt>
```

### Frontend Changes

* Login page contains a "Continue with Google" button that navigates to
  `http://localhost:8080/oauth2/authorization/google`.
* After redirect the React app reads `?token` from the URL and stores it in
  `localStorage` before navigating to `/dashboard`.

### Database Behavior

If the Google email isn’t in `users`, a new record is created with
role `PATIENT`; the profile picture is stored in `profiles.avatar`.
Subsequent logins reuse that record.

### CORS & Redirects

CORS already allows `http://localhost:5173`, so the OAuth redirect succeeds
and the token is passed back without issues.

---

### Database Notes

- `profiles.avatar` holds the URL string (entity field `avatarUrl`).
- `lab_reports.file_path` holds the URL string (`LabReport.fileUrl`).

### Frontend Usage

A simple React component (`FileUpload.tsx`) uses the existing `axiosInstance` and `FormData` to POST to `/api/v1/upload`. Upon success the returned URL can be saved or displayed with a toast.

> See `src/components/FileUpload.tsx` for implementation.

Back to main document...

```

**React receives:**
```json
{
  "error": "Doctor is not available at this time"
}
```

---

## 4. JWT Token Flow

### How the Token Works

1. **User Logs In**
   ```
   POST /api/auth/login
   { "username": "john_doe", "password": "password123" }
   ↓
   Returns:
   {
     "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
     "type": "Bearer",
     "id": 1,
     "username": "john_doe",
     "role": "PATIENT"
   }
   ```

2. **React Stores Token**
   ```typescript
   localStorage.setItem('authToken', response.token);
   ```

3. **Axios Interceptor Adds Token**
   ```typescript
   // axiosInstance.ts
   config.headers.Authorization = `Bearer ${token}`;
   ```

4. **Spring Boot Validates Token**
   ```java
   // JwtAuthenticationFilter
   String token = parseJwt(request);  // Extract from Authorization header
   if (jwtUtils.validateJwtToken(token)) {
       UserDetails user = userDetailsService.loadUserByUsername(username);
       // Set authentication in context
   }
   ```

5. **Request Processed with User Context**
   ```java
   // Controller receives authenticated user
   @AuthenticationPrincipal UserDetailsImpl currentUser
   // currentUser is now available to the service
   ```

### Token Validation

**JWT consists of 3 parts:**
```
header.payload.signature

header: { "alg": "HS256", "typ": "JWT" }
payload: { "sub": "john_doe", "iat": 1234567890, "exp": 1234654290 }
signature: HMACSHA256(header.payload, secret_key)
```

**Validation Checks:**
- Signature valid (matches secret key)
- Token not expired
- Token not tampered with

**If Invalid:**
- Return 401 Unauthorized
- JwtAuthenticationEntryPoint intercepts
- Returns JSON error response
- Frontend auto-logs out and redirects

---

## 5. Security Configuration Details

### SecurityConfig Bean Chain

```java
@Configuration
@EnableMethodSecurity(prePostEnabled = true)  // Enable @PreAuthorize
public class SecurityConfig {
    
    // 1. Password Encoder
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
    
    // 2. CORS Configuration
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        // Configure allowed origins, methods, headers
    }
    
    // 3. Authentication Provider
    @Bean
    public DaoAuthenticationProvider authenticationProvider() {
        // User details + password encoder
    }
    
    // 4. Authentication Manager
    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) {
        // Core authentication mechanism
    }
    
    // 5. Security Filter Chain
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) {
        // CORS, CSRF, exceptions, session, authorization, filters
    }
}
```

### Filter Chain Execution

```
Request comes in
    ↓
CORS Filter (CorsConfigurationSource)
    ↓
CSRF Filter (disabled for stateless API)
    ↓
JWT Authentication Filter (JwtAuthenticationFilter)
    - Extracts token from Authorization header
    - Validates token
    - Sets user in SecurityContext
    ↓
Authorization Filter (@PreAuthorize)
    - Checks if user has required role
    ↓
Controller Method
    ↓
Service Layer (has access to current user)
    ↓
Response sent back with CORS headers
```

---

## 6. Testing the Setup

### Test 1: Check CORS Headers

**Browser DevTools → Network → any request:**
```
Request Headers:
  Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
  Content-Type: application/json
  Origin: http://localhost:5173

Response Headers:
  Access-Control-Allow-Origin: http://localhost:5173
  Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS, PATCH
  Access-Control-Allow-Headers: Authorization, Content-Type, Accept, Origin...
  Access-Control-Allow-Credentials: true
```

### Test 2: Invalid JWT

**If token is missing or invalid:**
```
Response:
{
  "status": 401,
  "error": "Unauthorized",
  "message": "Invalid or expired JWT"
}
```

Frontend interceptor handles this:
```typescript
if (error.response?.status === 401) {
    localStorage.removeItem('authToken');
    window.location.href = '/login';
}
```

### Test 3: Validation Error

**If DTO validation fails:**
```
POST /api/auth/login
{ "username": "ab", "password": "short" }

Response:
{
  "error": "Username must be between 3 and 20 characters"
}
```

### Test 4: Role-Based Access

**If user lacks required role:**
```
GET /api/admin/users  // User has PATIENT role

Response:
{
  "status": 403,
  "error": "Forbidden",
  "message": "Access Denied"
}
```

---

## 7. Production Configuration

For production, update these settings:

### 1. Allowed Origins
```java
configuration.setAllowedOrigins(Arrays.asList(
    "https://yourdomain.com",
    "https://www.yourdomain.com"
));
```

### 2. JWT Secret
```properties
# application.properties
jwt.secret=${JWT_SECRET}  # Set as environment variable
```

### 3. HTTPS
```java
configuration.setAllowCredentials(true);
// HTTPS enforced at reverse proxy/load balancer
```

### 4. Security Headers
Consider adding:
```java
http.headers(headers -> headers
    .contentSecurityPolicy("script-src 'self'")
    .and()
    .frameOptions().deny()
);
```

---

## 8. Troubleshooting

| Problem | Cause | Solution |
|---------|-------|----------|
| CORS error | Origin not in allowed list | Add origin to `corsConfigurationSource()` |
| 401 on login | Wrong credentials | Check username/password in database |
| 401 after login | Token not sent | Check Authorization header in DevTools |
| 403 Forbidden | User lacks role | Check user's role in database |
| Validation error | Invalid input | Check DTO field requirements |
| Token expired | Token older than expiration | User needs to re-login |
| Preflight fails | OPTIONS request blocked | Check allowed methods/headers |

---

## 9. Environment Variables

Create `.env` file in backend root:

```properties
# Database
DB_URL=jdbc:mysql://localhost:3306/medicare_hms
DB_USERNAME=root
DB_PASSWORD=password

# JWT
JWT_SECRET=your-very-long-secret-key-min-32-chars
JWT_EXPIRATION=86400000  # 24 hours in milliseconds

# Server
SERVER_PORT=8080
```

Or use `application.properties`:
```properties
jwt.secret=your-secret-key
jwt.expiration=86400000
```

---

## 10. Related Files

- [CORS Configuration](./src/main/java/com/medicare/hms/security/SecurityConfig.java) - Central CORS setup
- [JWT Filter](./src/main/java/com/medicare/hms/security/JwtAuthenticationFilter.java) - Token extraction and validation
- [JWT Utils](./src/main/java/com/medicare/hms/security/JwtUtils.java) - Token generation and parsing
- [DTOs](./src/main/java/com/medicare/hms/dto/) - Request/Response models
- [Controllers](./src/main/java/com/medicare/hms/controller/) - API endpoints
- [Application Properties](./src/main/resources/application.properties) - Configuration

---

## Summary

✅ **DTOs** with comprehensive validation annotations  
✅ **CORS** configured for Vite dev server and production  
✅ **JWT** token extraction and validation  
✅ **@AuthenticationPrincipal** for clean controller code  
✅ **Error handling** with consistent response format  
✅ **Role-based access control** via @PreAuthorize  
✅ **Stateless authentication** with JWT tokens  

Your frontend and backend are now properly integrated with enterprise-grade security! 🚀