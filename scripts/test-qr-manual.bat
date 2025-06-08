@echo off
echo Testing QR Code Verification Route...
echo Backend URL: https://quench-rbac-backend-production.up.railway.app
echo.
echo Testing route: /api/qrcodes/verify/test-code-123
echo.
curl -X GET "https://quench-rbac-backend-production.up.railway.app/api/qrcodes/verify/test-code-123" -H "Content-Type: application/json" -H "User-Agent: QR-Test-Script"
echo.
echo.
echo Test completed.
pause
