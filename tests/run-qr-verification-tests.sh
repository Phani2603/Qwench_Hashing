#!/bin/bash

# QUENCH RBAC - Enhanced QR Verification Test Runner (Unix/Linux/Mac)
# This script runs the comprehensive QR verification tests

echo "=================================================================================="
echo "QUENCH RBAC - Enhanced QR Verification & Scan Test Runner"
echo "=================================================================================="
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ ERROR: Node.js is not installed or not in PATH"
    echo "Please install Node.js from https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js version:"
node --version
echo ""

# Install dependencies if needed
echo "🔧 Checking dependencies..."

if ! node -e "require('axios')" 2>/dev/null; then
    echo "📦 Installing axios..."
    npm install axios
    if [ $? -ne 0 ]; then
        echo "❌ ERROR: Failed to install axios"
        exit 1
    fi
fi

if ! node -e "require('chalk')" 2>/dev/null; then
    echo "📦 Installing chalk..."
    npm install chalk
    if [ $? -ne 0 ]; then
        echo "❌ ERROR: Failed to install chalk"
        exit 1
    fi
fi

echo "✅ Dependencies ready!"
echo ""

# Set environment variables if not set
export BACKEND_URL=${BACKEND_URL:-"https://quench-rbac-backend-production.up.railway.app"}
export FRONTEND_URL=${FRONTEND_URL:-"https://quench-rbac-frontend.vercel.app"}

echo "🔧 Configuration:"
echo "   Backend URL: $BACKEND_URL"
echo "   Frontend URL: $FRONTEND_URL"
echo ""

echo "🚀 Starting Enhanced QR Verification Tests..."
echo "=================================================================================="
echo ""

# Run the test
node qr_test_verify_scan.js

# Check exit code
if [ $? -eq 0 ]; then
    echo ""
    echo "=================================================================================="
    echo "✅ ALL TESTS PASSED!"
    echo ""
    echo "The enhanced QR verification system is working correctly."
    echo "You can now:"
    echo "  1. Generate QR codes in the admin panel"
    echo "  2. Test scanning with the URLs provided above"
    echo "  3. Verify the 3-second countdown and auto-redirect functionality"
    echo "=================================================================================="
else
    echo ""
    echo "=================================================================================="
    echo "❌ SOME TESTS FAILED!"
    echo ""
    echo "Please review the test output above for details."
    echo "Check the backend and frontend deployment status."
    echo "=================================================================================="
fi

echo ""
echo "Press Enter to exit..."
read
