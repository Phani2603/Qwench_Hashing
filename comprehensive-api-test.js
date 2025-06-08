// Comprehensive API Testing Script
// Run this in browser console or with Node.js

const BACKEND_URL = 'https://quench-rbac-backend-production.up.railway.app/api';

async function runAllTests() {
  console.log('🚀 QUENCH RBAC - Comprehensive API Tests');
  console.log('==========================================');
  
  const results = {
    health: null,
    cors: null,
    qrVerification: null,
    login: null
  };

  // Test 1: Backend Health
  console.log('\n1️⃣ Testing Backend Health...');
  try {
    const response = await fetch(`${BACKEND_URL}/health`);
    const data = await response.json();
    results.health = {
      status: response.status,
      data: data,
      success: response.ok
    };
    
    if (response.ok) {
      console.log('✅ Health Check: PASSED');
      console.log(`   Status: ${response.status}`);
      console.log(`   Message: ${data.message}`);
    } else {
      console.log('❌ Health Check: FAILED');
      console.log(`   Status: ${response.status}`);
    }
  } catch (error) {
    console.log('❌ Health Check: ERROR');
    console.log(`   Error: ${error.message}`);
    results.health = { error: error.message };
  }

  // Test 2: CORS Configuration
  console.log('\n2️⃣ Testing CORS Configuration...');
  try {
    const response = await fetch(`${BACKEND_URL}/cors-test`, {
      headers: {
        'Origin': 'https://quench-rbac-frontend.vercel.app'
      }
    });
    const data = await response.json();
    results.cors = {
      status: response.status,
      data: data,
      corsHeader: response.headers.get('Access-Control-Allow-Origin'),
      success: response.ok
    };
    
    const corsHeader = response.headers.get('Access-Control-Allow-Origin');
    if (corsHeader) {
      console.log('✅ CORS Test: PASSED');
      console.log(`   Status: ${response.status}`);
      console.log(`   CORS Origin: ${corsHeader}`);
    } else {
      console.log('⚠️ CORS Test: No CORS headers found');
    }
  } catch (error) {
    console.log('❌ CORS Test: ERROR');
    console.log(`   Error: ${error.message}`);
    results.cors = { error: error.message };
  }

  // Test 3: QR Code Verification Route
  console.log('\n3️⃣ Testing QR Verification Route...');
  try {
    const response = await fetch(`${BACKEND_URL}/qrcodes/verify/test-code-123`);
    const data = await response.json();
    results.qrVerification = {
      status: response.status,
      data: data,
      success: response.status === 404 && data.message && !data.message.includes('Route not found')
    };
    
    if (response.status === 404 && data.message && data.message.includes('QR code not found')) {
      console.log('✅ QR Verification: PASSED (Route working, expected 404)');
      console.log(`   Status: ${response.status}`);
      console.log(`   Message: ${data.message}`);
    } else if (response.status === 404 && data.message === 'Route not found') {
      console.log('❌ QR Verification: FAILED (Syntax error still present)');
      console.log(`   Status: ${response.status}`);
      console.log(`   Message: ${data.message}`);
      console.log('   ⚠️ Need to deploy QR route fix to Railway');
    } else {
      console.log('⚠️ QR Verification: Unexpected response');
      console.log(`   Status: ${response.status}`);
      console.log(`   Data:`, data);
    }
  } catch (error) {
    console.log('❌ QR Verification: ERROR');
    console.log(`   Error: ${error.message}`);
    results.qrVerification = { error: error.message };
  }

  // Test 4: Login Functionality
  console.log('\n4️⃣ Testing Login Endpoint...');
  try {
    const response = await fetch(`${BACKEND_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'https://quench-rbac-frontend.vercel.app'
      },
      body: JSON.stringify({
        email: 'admin@quench.com',
        password: 'QuenchAdmin2024!'
      })
    });
    
    const data = await response.json();
    results.login = {
      status: response.status,
      data: data,
      success: response.ok
    };
    
    if (response.ok) {
      console.log('✅ Login Test: PASSED');
      console.log(`   Status: ${response.status}`);
      console.log(`   User: ${data.user.email} (${data.user.role})`);
      console.log(`   Token: ${data.token ? 'Present' : 'Missing'}`);
    } else {
      console.log('❌ Login Test: FAILED');
      console.log(`   Status: ${response.status}`);
      console.log(`   Message: ${data.message || 'Unknown error'}`);
    }
  } catch (error) {
    console.log('❌ Login Test: ERROR');
    console.log(`   Error: ${error.message}`);
    results.login = { error: error.message };
  }

  // Summary
  console.log('\n📊 TEST SUMMARY');
  console.log('================');
  console.log(`Health Check: ${results.health?.success ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`CORS Config:  ${results.cors?.success ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`QR Route:     ${results.qrVerification?.success ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Login Test:   ${results.login?.success ? '✅ PASS' : '❌ FAIL'}`);

  console.log('\n🎯 NEXT STEPS:');
  if (!results.qrVerification?.success) {
    console.log('1. Deploy QR route syntax fix to Railway');
    console.log('2. Update environment variables on both platforms');
  } else {
    console.log('1. Update environment variables on both platforms');
    console.log('2. Test complete frontend functionality');
  }

  console.log('\n🔗 QUICK LINKS:');
  console.log('Frontend: https://quench-rbac-frontend.vercel.app');
  console.log('Login Page: https://quench-rbac-frontend.vercel.app/login');
  console.log('System Test: Open system-test.html in browser');

  return results;
}

// Export for Node.js or run immediately in browser
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { runAllTests };
} else {
  // Run automatically in browser
  runAllTests();
}
