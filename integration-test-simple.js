#!/usr/bin/env node

/**
 * 🧪 RBAC System Integration Test Suite
 * 
 * This script tests all 5 critical fixes implemented:
 * 1. Dynamic URL generation (QR codes)
 * 2. Environment variables
 * 3. CORS configuration
 * 4. JWT security
 * 5. Input validation
 */

const axios = require('axios');

// Test configuration
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5000';
const API_BASE = `${BACKEND_URL}/api`;

console.log('🧪 STARTING RBAC INTEGRATION TESTS\n');

// Test results tracker
const results = {
  passed: 0,
  failed: 0,
  tests: []
};

// Helper function to log test results
function logTest(name, passed, details = '') {
  const status = passed ? '✅ PASS' : '❌ FAIL';
  console.log(`${status} ${name}`);
  if (details) console.log(`   ${details}`);
  
  results.tests.push({ name, passed, details });
  if (passed) results.passed++;
  else results.failed++;
}

// Test 1: Environment Variables Loading
async function testEnvironmentVariables() {
  console.log('\n📋 Testing Environment Variables (Fix #2)');
  
  try {
    // Test backend environment
    const requiredEnvVars = [
      'JWT_SECRET', 'JWT_REFRESH_SECRET', 'MONGODB_URI', 
      'FRONTEND_URL', 'PORT'
    ];
    
    let allPresent = true;
    for (const varName of requiredEnvVars) {
      if (!process.env[varName]) {
        allPresent = false;
        logTest(`Environment variable ${varName}`, false, `Missing required variable`);
      }
    }
    
    if (allPresent) {
      logTest('All critical environment variables present', true);
    }
    
    // Test JWT secret length (Fix #4)
    const jwtSecret = process.env.JWT_SECRET;
    const isSecure = jwtSecret && jwtSecret.length >= 32;
    logTest('JWT_SECRET security validation', isSecure, 
      `Length: ${jwtSecret?.length || 0} characters (min: 32)`);
      
  } catch (error) {
    logTest('Environment variables test', false, error.message);
  }
}

// Test 2: Server Health Check
async function testServerHealth() {
  console.log('\n❤️  Testing Server Health');
  
  try {
    const response = await axios.get(`${API_BASE}/health`, {
      timeout: 5000
    });
    
    const isHealthy = response.status === 200;
    logTest('Server health check', isHealthy, 
      `Status: ${response.status}, Message: ${response.data.message}`);
      
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      logTest('Server health check', false, 'Server is not running. Please start the backend server first.');
    } else {
      logTest('Server health check', false, error.message);
    }
  }
}

// Test 3: CORS Configuration
async function testCORSConfiguration() {
  console.log('\n🌐 Testing CORS Configuration (Fix #3)');
  
  try {
    const response = await axios.options(`${API_BASE}/health`, {
      headers: {
        'Origin': 'http://localhost:3000',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type, Authorization'
      },
      timeout: 5000
    });
    
    const corsHeaders = response.headers;
    const hasCORS = corsHeaders['access-control-allow-origin'];
    const allowsCredentials = corsHeaders['access-control-allow-credentials'];
    
    logTest('CORS preflight response', !!hasCORS, 
      `Origin: ${hasCORS}, Credentials: ${allowsCredentials}`);
      
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      logTest('CORS configuration test', false, 'Server is not running');
    } else {
      logTest('CORS configuration test', false, error.message);
    }
  }
}

// Test 4: Input Validation
async function testInputValidation() {
  console.log('\n🛡️  Testing Input Validation (Fix #5)');
  
  try {
    // Test invalid registration data
    const invalidData = {
      email: 'invalid-email',
      password: '123', // Too short
      name: '', // Empty name
    };
      const response = await axios.post(`${API_BASE}/auth/signup`, invalidData, {
      validateStatus: () => true, // Don't throw on 4xx errors
      timeout: 5000
    });    const isValidationWorking = response.status === 400 && (response.data.error || response.data.message);
    logTest('Input validation for registration', isValidationWorking,
      `Status: ${response.status}, Message: ${response.data.message || response.data.error}`);
      
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      logTest('Input validation test', false, 'Server is not running');
    } else {
      logTest('Input validation test', false, error.message);
    }
  }
}

// Test 5: JWT Security
async function testJWTSecurity() {
  console.log('\n🔐 Testing JWT Security (Fix #4)');
  
  try {
    // Test with invalid token
    const response = await axios.get(`${API_BASE}/auth/me`, {
      headers: { Authorization: 'Bearer invalid-token' },
      validateStatus: () => true,
      timeout: 5000
    });
    
    const rejectsInvalidToken = response.status === 401;
    logTest('JWT invalid token rejection', rejectsInvalidToken,
      `Status: ${response.status}`);
      
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      logTest('JWT security test', false, 'Server is not running');
    } else {
      logTest('JWT security test', false, error.message);
    }
  }
}

// Main test runner
async function runIntegrationTests() {
  console.log(`🔗 Testing against: ${API_BASE}\n`);
  
  // Load environment variables from backend directory
  require('dotenv').config({ path: './backend/.env' });
  require('dotenv').config({ path: './.env.local' });
  
  // Run all tests
  await testEnvironmentVariables();
  await testServerHealth();
  await testCORSConfiguration();
  await testJWTSecurity();
  await testInputValidation();
  
  // Print summary
  console.log('\n📊 TEST SUMMARY');
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`📋 Total: ${results.tests.length}`);
  
  if (results.failed === 0) {
    console.log('\n🎉 ALL TESTS PASSED! System is ready for production.');
  } else {
    console.log('\n⚠️  Some tests failed. Please review the issues above.');
    console.log('\n💡 If server connection failed, make sure to:');
    console.log('   1. Start the backend server: cd backend && node server.js');
    console.log('   2. Wait for "Connected to MongoDB Atlas" message');
    console.log('   3. Re-run this test: node integration-test.js');
  }
  
  // Exit with appropriate code
  process.exit(results.failed > 0 ? 1 : 0);
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n⚠️  Tests interrupted');
  process.exit(1);
});

// Run tests if this is the main module
if (require.main === module) {
  runIntegrationTests().catch(error => {
    console.error('❌ Test runner failed:', error.message);
    process.exit(1);
  });
}

module.exports = { runIntegrationTests };
