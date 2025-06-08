// Final endpoint verification script
const fetch = require('node-fetch');

// Base URL
const API_BASE_URL = process.env.API_URL || 'https://quench-rbac-backend-production.up.railway.app/api';

// Admin credentials
const ADMIN_EMAIL = 'admin@quench.com';
const ADMIN_PASSWORD = 'QuenchAdmin2024!';

// Helper function for colored console logs
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

// Test suite
async function runTests() {
  console.log(`${colors.cyan}========== QUENCH RBAC API ENDPOINT VERIFICATION ===========${colors.reset}`);
  console.log(`${colors.cyan}Testing API at: ${API_BASE_URL}${colors.reset}`);
  console.log(`${colors.cyan}===================================================${colors.reset}\n`);

  let authToken = null;

  // Test health endpoint
  await testEndpoint('Health Check', 'GET', '/health');

  // Test debug endpoint
  await testEndpoint('Debug Endpoint', 'GET', '/debug');

  // Test CORS test endpoint
  await testEndpoint('CORS Test', 'GET', '/cors-test');

  // Test login
  const loginResult = await testEndpoint('Admin Login', 'POST', '/auth/login', {
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD
  });

  // If login successful, use the token for authenticated requests
  if (loginResult && loginResult.success && loginResult.token) {
    authToken = loginResult.token;
    console.log(`${colors.green}✓ Authentication successful - Token received${colors.reset}`);

    // Test authenticated endpoints
    await testEndpoint('Get User Profile', 'GET', '/auth/me', null, authToken);
    await testEndpoint('Get All QR Codes', 'GET', '/qrcodes', null, authToken);
    await testEndpoint('Get QR Code Stats', 'GET', '/qrcodes/stats', null, authToken);
    await testEndpoint('Get All Categories', 'GET', '/categories', null, authToken);
    await testEndpoint('Get All Users', 'GET', '/admin/users', null, authToken);
  } else {
    console.log(`${colors.red}✗ Authentication failed - Cannot test authenticated endpoints${colors.reset}`);
  }

  // Test QR Code verification (public route)
  await testEndpoint('QR Code Verification API', 'GET', '/qrcodes/verify/test-code-id');

  console.log(`\n${colors.cyan}===================================================${colors.reset}`);
  console.log(`${colors.cyan}Endpoint verification completed${colors.reset}`);
  console.log(`${colors.cyan}===================================================${colors.reset}`);
}

// Generic test function
async function testEndpoint(name, method, endpoint, body = null, token = null) {
  const url = `${API_BASE_URL}${endpoint}`;
  console.log(`\n${colors.yellow}Testing: ${name} (${method} ${url})${colors.reset}`);

  try {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    if (body) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(url, options);
    const data = await response.json();

    if (response.ok) {
      console.log(`${colors.green}✓ Status: ${response.status} ${response.statusText}${colors.reset}`);
      console.log(`${colors.blue}Response:${colors.reset}`, JSON.stringify(data, null, 2).substring(0, 300) + (JSON.stringify(data, null, 2).length > 300 ? '...' : ''));
      return data;
    } else {
      console.log(`${colors.red}✗ Status: ${response.status} ${response.statusText}${colors.reset}`);
      console.log(`${colors.red}Error:${colors.reset}`, JSON.stringify(data, null, 2));
      return null;
    }
  } catch (error) {
    console.log(`${colors.red}✗ Error:${colors.reset}`, error.message);
    return null;
  }
}

// Run the tests
runTests().catch(console.error);
