// Frontend API Connectivity Test Script
// This script tests the frontend's ability to communicate with the backend API

const API_BASE_URL = "https://quench-rbac-backend-production.up.railway.app/api";

async function testCORSConnection() {
  console.log("🔍 Testing CORS connection to backend...");
  console.log(`API Base URL: ${API_BASE_URL}`);
  
  try {
    const response = await fetch(`${API_BASE_URL}/cors-test`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    console.log(`✅ CORS Test Response Status: ${response.status}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log("✅ CORS Test Response:", data);
    } else {
      console.log("❌ CORS Test failed:", await response.text());
    }
  } catch (error) {
    console.error("❌ CORS Test Error:", error.message);
  }
}

async function testHealthEndpoint() {
  console.log("\n🔍 Testing health endpoint...");
  
  try {
    const response = await fetch(`${API_BASE_URL}/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    console.log(`✅ Health Check Response Status: ${response.status}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log("✅ Health Check Response:", data);
    } else {
      console.log("❌ Health Check failed:", await response.text());
    }
  } catch (error) {
    console.error("❌ Health Check Error:", error.message);
  }
}

async function testLoginEndpoint() {
  console.log("\n🔍 Testing login endpoint...");
  
  try {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@quench.com',
        password: 'QuenchAdmin2024!'
      }),
    });
    
    console.log(`✅ Login Test Response Status: ${response.status}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log("✅ Login Test Response:", {
        success: data.success,
        userEmail: data.user?.email,
        userRole: data.user?.role,
        tokenLength: data.token?.length
      });
    } else {
      const errorData = await response.json();
      console.log("❌ Login Test failed:", errorData);
    }
  } catch (error) {
    console.error("❌ Login Test Error:", error.message);
  }
}

async function runAllTests() {
  console.log("🚀 Starting Frontend API Connectivity Tests\n");
  
  await testHealthEndpoint();
  await testCORSConnection();
  await testLoginEndpoint();
  
  console.log("\n✨ All tests completed!");
}

// Run tests if this script is executed directly
if (typeof window === 'undefined') {
  // Node.js environment
  const fetch = require('node-fetch');
  runAllTests();
} else {
  // Browser environment
  runAllTests();
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { testCORSConnection, testHealthEndpoint, testLoginEndpoint, runAllTests };
}
