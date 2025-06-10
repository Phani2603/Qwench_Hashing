#!/usr/bin/env node

const https = require('https');

const BASE_URL = 'https://quench-rbac-backend-production.up.railway.app';

function testEndpoint(path, description) {
  return new Promise((resolve) => {
    console.log(`\n🔍 Testing: ${description}`);
    console.log(`📡 URL: ${BASE_URL}${path}`);
    
    const req = https.get(`${BASE_URL}${path}`, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (res.statusCode === 200) {
            console.log(`✅ ${description} - SUCCESS`);
            console.log(`📊 Response:`, JSON.stringify(parsed, null, 2));
          } else {
            console.log(`❌ ${description} - FAILED (${res.statusCode})`);
            console.log(`📊 Response:`, parsed);
          }
        } catch (e) {
          console.log(`❌ ${description} - INVALID JSON`);
          console.log(`📊 Raw response:`, data);
        }
        resolve();
      });
    });
    
    req.on('error', (error) => {
      console.log(`❌ ${description} - ERROR: ${error.message}`);
      resolve();
    });
    
    req.setTimeout(10000, () => {
      console.log(`⏰ ${description} - TIMEOUT`);
      req.destroy();
      resolve();
    });
  });
}

async function runTests() {
  console.log('🚀 Backend API Fix Verification');
  console.log('================================');
  
  // Test health endpoint
  await testEndpoint('/api/health', 'Health Check');
  
  // Test new status endpoint
  await testEndpoint('/api/status', 'API Status (NEW)');
  
  // Test CORS endpoint
  await testEndpoint('/api/cors-test', 'CORS Test');
  
  // Test stats endpoint (should fail without auth, but should exist)
  await testEndpoint('/api/qrcodes/stats', 'Stats Endpoint (NEW) - Should need auth');
  
  console.log('\n🏁 Test Complete!');
  console.log('\nExpected Results:');
  console.log('✅ Health Check should return 200');
  console.log('✅ API Status should return 200 with endpoint list');
  console.log('✅ CORS Test should return 200');
  console.log('❌ Stats should return 401/403 (needs authentication)');
}

runTests().catch(console.error);
