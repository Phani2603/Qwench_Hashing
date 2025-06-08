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
const chalk = require('chalk');

// Test configuration
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5000';
const API_BASE = `${BACKEND_URL}/api`;

console.log(chalk.blue.bold('🧪 STARTING RBAC INTEGRATION TESTS\n'));

// Test results tracker
const results = {
  passed: 0,
  failed: 0,
  tests: []
};

// Helper function to log test results
function logTest(name, passed, details = '') {
  const status = passed ? chalk.green('✅ PASS') : chalk.red('❌ FAIL');
  console.log(`${status} ${name}`);
  if (details) console.log(`   ${chalk.gray(details)}`);
  
  results.tests.push({ name, passed, details });
  if (passed) results.passed++;
  else results.failed++;
}

// Test 1: Environment Variables Loading
async function testEnvironmentVariables() {
  console.log(chalk.yellow('\n📋 Testing Environment Variables (Fix #2)'));
  
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

// Test 2: CORS Configuration
async function testCORSConfiguration() {
  console.log(chalk.yellow('\n🌐 Testing CORS Configuration (Fix #3)'));
  
  try {
    const response = await axios.options(`${API_BASE}/auth/health`, {
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
    logTest('CORS configuration test', false, error.message);
  }
}

// Test 3: Input Validation
async function testInputValidation() {
  console.log(chalk.yellow('\n🛡️  Testing Input Validation (Fix #5)'));
  
  try {
    // Test invalid registration data
    const invalidData = {
      email: 'invalid-email',
      password: '123', // Too short
      name: '', // Empty name
    };
    
    const response = await axios.post(`${API_BASE}/auth/register`, invalidData, {
      validateStatus: () => true, // Don't throw on 4xx errors
      timeout: 5000
    });
    
    const isValidationWorking = response.status === 400 && response.data.error;
    logTest('Input validation for registration', isValidationWorking,
      `Status: ${response.status}, Error: ${response.data.error?.substring(0, 50)}...`);
      
  } catch (error) {
    logTest('Input validation test', false, error.message);
  }
}

// Test 4: QR Code Dynamic URL Generation
async function testQRCodeGeneration() {
  console.log(chalk.yellow('\n📱 Testing QR Code Dynamic URLs (Fix #1)'));
  
  try {
    // First, we need to register and login to get a token
    const testUser = {
      email: `test-${Date.now()}@example.com`,
      password: 'SecurePassword123!',
      name: 'Test User'
    };
    
    // Register user
    const registerRes = await axios.post(`${API_BASE}/auth/register`, testUser, {
      timeout: 5000
    });
    
    if (registerRes.status === 201) {
      // Login to get token
      const loginRes = await axios.post(`${API_BASE}/auth/login`, {
        email: testUser.email,
        password: testUser.password
      }, { timeout: 5000 });
      
      if (loginRes.status === 200 && loginRes.data.token) {
        // Test QR code generation
        const qrRes = await axios.post(`${API_BASE}/qrcode/generate`, {
          content: 'Test QR Code Content'
        }, {
          headers: { Authorization: `Bearer ${loginRes.data.token}` },
          timeout: 5000
        });
        
        if (qrRes.status === 201 && qrRes.data.qrCode) {
          const qrCodeUrl = qrRes.data.qrCode;
          const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
          const usesDynamicUrl = qrCodeUrl.includes(frontendUrl);
          
          logTest('QR Code dynamic URL generation', usesDynamicUrl,
            `URL contains: ${frontendUrl}`);
        } else {
          logTest('QR Code generation', false, 'Failed to generate QR code');
        }
      } else {
        logTest('User login for QR test', false, 'Login failed');
      }
    } else {
      logTest('User registration for QR test', false, 'Registration failed');
    }
    
  } catch (error) {
    logTest('QR Code dynamic URL test', false, error.message);
  }
}

// Test 5: JWT Security
async function testJWTSecurity() {
  console.log(chalk.yellow('\n🔐 Testing JWT Security (Fix #4)'));
  
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
    logTest('JWT security test', false, error.message);
  }
}

// Test 6: Server Health Check
async function testServerHealth() {
  console.log(chalk.yellow('\n❤️  Testing Server Health'));
  
  try {
    const response = await axios.get(`${API_BASE}/health`, {
      timeout: 5000
    });
    
    const isHealthy = response.status === 200;
    logTest('Server health check', isHealthy, 
      `Status: ${response.status}, Response: ${JSON.stringify(response.data)}`);
      
  } catch (error) {
    logTest('Server health check', false, error.message);
  }
}

// Main test runner
async function runIntegrationTests() {
  console.log(chalk.blue(`🔗 Testing against: ${API_BASE}\n`));
  
  // Load environment variables
  require('dotenv').config();
  
  // Run all tests
  await testEnvironmentVariables();
  await testServerHealth();
  await testCORSConfiguration();
  await testJWTSecurity();
  await testInputValidation();
  await testQRCodeGeneration();
  
  // Print summary
  console.log(chalk.blue.bold('\n📊 TEST SUMMARY'));
  console.log(chalk.green(`✅ Passed: ${results.passed}`));
  console.log(chalk.red(`❌ Failed: ${results.failed}`));
  console.log(chalk.blue(`📋 Total: ${results.tests.length}`));
  
  if (results.failed === 0) {
    console.log(chalk.green.bold('\n🎉 ALL TESTS PASSED! System is ready for production.'));
  } else {
    console.log(chalk.yellow.bold('\n⚠️  Some tests failed. Please review the issues above.'));
  }
  
  // Exit with appropriate code
  process.exit(results.failed > 0 ? 1 : 0);
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log(chalk.yellow('\n⚠️  Tests interrupted'));
  process.exit(1);
});

// Run tests
if (require.main === module) {
  runIntegrationTests().catch(error => {
    console.error(chalk.red('❌ Test runner failed:'), error.message);
    process.exit(1);
  });
}

module.exports = { runIntegrationTests };
