@echo off
echo Starting Medicare Cure Hub Project...

:: Start Backend in a new window
start cmd /k "cd backend && mvn spring-boot:run"

:: Start Frontend in another window
start cmd /k "npm run dev"

echo Both processes are starting. Please wait...