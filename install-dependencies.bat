@echo off
REM install-dependencies.bat
REM Run this script to install missing dependencies for the frontend

echo Installing Axios for HTTP requests...
call npm install axios

echo.
echo ✅ All dependencies installed!
echo.
echo Next steps:
echo 1. Create .env file in project root (copy from .env.example)
echo 2. Update VITE_API_BASE_URL to your Spring Boot server URL
echo 3. Review src\api\MIGRATION_GUIDE.md for migration instructions
echo 4. Check src\api\EXAMPLES.tsx for usage examples
echo.
echo To start the development server:
echo npm run dev
pause