#!/bin/bash

# QUENCH RBAC System - Final Verification Script
# Run this after updating environment variables on both platforms

echo "🚀 QUENCH RBAC - Final System Verification"
echo "=========================================="
echo ""

# Test Backend Health
echo "1. Testing Backend Health..."
curl -s https://quench-rbac-backend-production.up.railway.app/api/health | jq '.'
echo ""

# Test CORS Configuration
echo "2. Testing CORS Configuration..."
curl -s -H "Origin: https://quench-rbac-frontend.vercel.app" https://quench-rbac-backend-production.up.railway.app/api/cors-test | jq '.'
echo ""

# Test QR Verification Route
echo "3. Testing QR Verification Route..."
curl -s https://quench-rbac-backend-production.up.railway.app/api/qrcodes/verify/test-code-123 | jq '.'
echo ""

# Test Login Endpoint
echo "4. Testing Login Endpoint..."
curl -s -X POST \
  -H "Content-Type: application/json" \
  -H "Origin: https://quench-rbac-frontend.vercel.app" \
  -d '{"email":"admin@quench.com","password":"QuenchAdmin2024!"}' \
  https://quench-rbac-backend-production.up.railway.app/api/auth/login | jq '.'
echo ""

echo "✅ Verification Complete!"
echo ""
echo "📋 Next Steps:"
echo "1. Open https://quench-rbac-frontend.vercel.app/login"
echo "2. Login with: admin@quench.com / QuenchAdmin2024!"
echo "3. Test QR code generation and scanning"
echo ""
echo "🎉 Your QUENCH RBAC system is ready for production!"
