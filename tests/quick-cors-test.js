// Quick CORS Fix Verification Script
// Run this AFTER updating Vercel environment variables

console.log("🔍 CORS Fix Verification Test");
console.log("=====================================");

// Test the production endpoints
const BACKEND_URL = "https://quench-rbac-backend-production.up.railway.app/api";
const FRONTEND_URL = "https://quench-rbac-frontend-7007f4nez-phani2603s-projects.vercel.app";

async function quickTest() {
  console.log("\n1. Testing Backend Health...");
  try {
    const healthResponse = await fetch(`${BACKEND_URL}/health`);
    const healthData = await healthResponse.json();
    console.log(`✅ Backend Health: ${healthResponse.status} - ${healthData.message}`);
  } catch (error) {
    console.log(`❌ Backend Health Error: ${error.message}`);
  }

  console.log("\n2. Testing Login Endpoint...");
  try {
    const loginResponse = await fetch(`${BACKEND_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@quench.com',
        password: 'QuenchAdmin2024!'
      }),
    });
    
    if (loginResponse.ok) {
      const loginData = await loginResponse.json();
      console.log(`✅ Login Test: SUCCESS - User: ${loginData.user.email} (${loginData.user.role})`);
    } else {
      const errorData = await loginResponse.json();
      console.log(`❌ Login Test: ${loginResponse.status} - ${errorData.message}`);
    }
  } catch (error) {
    console.log(`❌ Login Test Error: ${error.message}`);
  }

  console.log("\n3. Testing Frontend Access...");
  try {
    const frontendResponse = await fetch(FRONTEND_URL);
    console.log(`✅ Frontend Access: ${frontendResponse.status} - ${frontendResponse.statusText}`);
  } catch (error) {
    console.log(`❌ Frontend Access Error: ${error.message}`);
  }

  console.log("\n=====================================");
  console.log("📋 NEXT STEPS:");
  console.log("1. If all tests pass, try logging in at:");
  console.log(`   ${FRONTEND_URL}/login`);
  console.log("2. Use credentials: admin@quench.com / QuenchAdmin2024!");
  console.log("3. If login still fails, check browser console for CORS errors");
}

// Run the test
if (typeof window === 'undefined') {
  // Node.js environment
  const fetch = require('node-fetch');
  quickTest();
} else {
  // Browser environment
  quickTest();
}

module.exports = { quickTest };
