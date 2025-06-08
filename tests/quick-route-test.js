// Quick backend route test
const axios = require('axios');

// Base URL
const API_BASE_URL = 'https://quench-rbac-backend-production.up.railway.app/api';

// Test a specific endpoint
async function testEndpoint(name, method, path, data = null) {
  console.log(`Testing ${name}...`);
  
  try {
    const config = {
      method,
      url: `${API_BASE_URL}${path}`,
      headers: { 'Content-Type': 'application/json' }
    };
    
    if (data) {
      config.data = data;
    }
    
    const response = await axios(config);
    console.log(`✅ Success (${response.status}): ${JSON.stringify(response.data).substring(0, 100)}...`);
    return response.data;
  } catch (error) {
    if (error.response) {
      console.log(`❌ Failed (${error.response.status}): ${JSON.stringify(error.response.data)}`);
    } else {
      console.log(`❌ Error: ${error.message}`);
    }
    return null;
  }
}

// Run tests
async function runQuickTests() {
  console.log('=== QUICK BACKEND ROUTE TEST ===');
  
  // Test health endpoint
  await testEndpoint('Health Endpoint', 'get', '/health');
  
  // Test auth login endpoint
  await testEndpoint('Login Endpoint', 'post', '/auth/login', {
    email: 'admin@quench.com',
    password: 'QuenchAdmin2024!'
  });
  
  // Test QR code verification endpoint
  await testEndpoint('QR Verification', 'get', '/qrcodes/verify/test-code');
  
  console.log('=== TEST COMPLETE ===');
}

runQuickTests().catch(console.error);
