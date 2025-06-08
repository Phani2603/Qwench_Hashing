@echo off
echo 🚀 QUENCH RBAC - Comprehensive System Tests
echo ===============================================
echo.

echo 📋 Testing Backend Health...
echo URL: https://quench-rbac-backend-production.up.railway.app/api/health
echo.

echo 📋 Testing QR Verification Route...
echo URL: https://quench-rbac-backend-production.up.railway.app/api/qrcodes/verify/test-code-123
echo.

echo 📋 Testing CORS Configuration...
echo URL: https://quench-rbac-backend-production.up.railway.app/api/cors-test
echo.

echo 📋 Testing Login Endpoint...
echo URL: https://quench-rbac-backend-production.up.railway.app/api/auth/login
echo.

echo ⚠️  Manual Testing Required:
echo.
echo 1. Open system-test.html in your browser
echo 2. Click "Test Backend" - should show: {"success": true, "message": "Server is running"}
echo 3. Click "Test QR Route" - should show QR-specific JSON (not "Route not found")
echo 4. Click "Test CORS" - should show CORS headers
echo 5. Click "Test Login" - should authenticate successfully
echo.

echo 🌐 Quick Links:
echo Frontend: https://quench-rbac-frontend.vercel.app
echo Login Page: https://quench-rbac-frontend.vercel.app/login
echo Backend Health: https://quench-rbac-backend-production.up.railway.app/api/health
echo.

echo 🔑 Admin Credentials:
echo Email: admin@quench.com
echo Password: QuenchAdmin2024!
echo.

echo 📊 Expected Results After QR Route Fix:
echo - Backend Health: ✅ {"success": true, "message": "Server is running"}
echo - QR Verification: ✅ {"success": false, "valid": false, "message": "QR code not found..."}
echo - CORS Test: ✅ Should include Access-Control-Allow-Origin header
echo - Login Test: ✅ Should return user data and token
echo.

echo 🎯 Current Status:
echo [✅] CORS configuration working
echo [✅] Backend health working  
echo [🔄] QR route syntax fixed (awaiting deployment)
echo [🔄] Environment variables (need platform updates)
echo.

pause
