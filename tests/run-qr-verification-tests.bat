@echo off
echo ================================================================================
echo QUENCH RBAC - Enhanced QR Verification & Scan Test Runner
echo ================================================================================
echo.

REM Check if Node.js is available
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

echo Node.js version:
node --version
echo.

REM Install required dependencies if not available
echo Checking dependencies...
echo.

REM Check if axios is available
node -e "require('axios')" 2>nul
if %errorlevel% neq 0 (
    echo Installing axios...
    npm install axios
    if %errorlevel% neq 0 (
        echo ERROR: Failed to install axios
        pause
        exit /b 1
    )
)

REM Check if chalk is available  
node -e "require('chalk')" 2>nul
if %errorlevel% neq 0 (
    echo Installing chalk...
    npm install chalk
    if %errorlevel% neq 0 (
        echo ERROR: Failed to install chalk
        pause
        exit /b 1
    )
)

echo Dependencies ready!
echo.

REM Set environment variables if not set
if "%BACKEND_URL%"=="" set BACKEND_URL=https://quench-rbac-backend-production.up.railway.app
if "%FRONTEND_URL%"=="" set FRONTEND_URL=https://quench-rbac-frontend.vercel.app

echo Configuration:
echo   Backend URL: %BACKEND_URL%
echo   Frontend URL: %FRONTEND_URL%
echo.

echo Starting Enhanced QR Verification Tests...
echo ================================================================================
echo.

REM Run the test
node qr_test_verify_scan.js

echo.
echo ================================================================================
echo Test execution completed.

REM Check exit code
if %errorlevel% equ 0 (
    echo ✅ ALL TESTS PASSED!
    echo.
    echo The enhanced QR verification system is working correctly.
    echo You can now:
    echo   1. Generate QR codes in the admin panel
    echo   2. Test scanning with the URLs provided above
    echo   3. Verify the 3-second countdown and auto-redirect functionality
) else (
    echo ❌ SOME TESTS FAILED!
    echo.
    echo Please review the test output above for details.
    echo Check the backend and frontend deployment status.
)

echo.
echo Press any key to exit...
pause >nul
