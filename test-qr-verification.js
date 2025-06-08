const https = require('https');

const BACKEND_URL = 'quench-rbac-backend-production.up.railway.app';

// Test QR Code Verification Route
function testQRVerification() {
  console.log('🔍 Testing QR Code Verification Route...');
  console.log(`Backend URL: https://${BACKEND_URL}`);
  
  const options = {
    hostname: BACKEND_URL,
    path: '/api/qrcodes/verify/test-code-123',
    method: 'GET',
    headers: { 
      'Content-Type': 'application/json',
      'User-Agent': 'QR-Test-Script'
    }
  };
  
  const req = https.request(options, (res) => {
    let data = '';
    
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      console.log('\n📊 Test Results:');
      console.log(`Status Code: ${res.statusCode}`);
      console.log(`Headers:`, res.headers);
      
      try {
        const response = JSON.parse(data);
        console.log('✅ Valid JSON Response:');
        console.log(JSON.stringify(response, null, 2));
        
        if (res.statusCode === 404 && response.message && response.message.includes('QR code not found')) {
          console.log('✅ Verification route is working! (404 expected for test code)');
        } else if (res.statusCode === 200 && response.valid !== undefined) {
          console.log('✅ Verification route is working!');
        } else {
          console.log('⚠️  Unexpected response format');
        }
      } catch (e) {
        console.log('❌ Invalid JSON Response:');
        console.log('Raw response:', data);
      }
    });
  });
  
  req.on('error', (e) => {
    console.error('❌ Request Error:', e.message);
  });
  
  req.setTimeout(10000, () => {
    console.error('❌ Request timeout');
    req.abort();
  });
  
  req.end();
}

// Test CORS Headers
function testCORS() {
  console.log('\n🌐 Testing CORS Headers...');
  
  const options = {
    hostname: BACKEND_URL,
    path: '/api/cors-test',
    method: 'GET',
    headers: { 
      'Origin': 'https://quench-rbac-frontend.vercel.app',
      'Content-Type': 'application/json'
    }
  };
  
  const req = https.request(options, (res) => {
    console.log('\n📊 CORS Test Results:');
    console.log(`Status Code: ${res.statusCode}`);
    console.log('CORS Headers:');
    console.log(`  Access-Control-Allow-Origin: ${res.headers['access-control-allow-origin']}`);
    console.log(`  Access-Control-Allow-Methods: ${res.headers['access-control-allow-methods']}`);
    console.log(`  Access-Control-Allow-Headers: ${res.headers['access-control-allow-headers']}`);
    
    if (res.headers['access-control-allow-origin']) {
      console.log('✅ CORS is configured');
    } else {
      console.log('❌ CORS headers missing');
    }
  });
  
  req.on('error', (e) => {
    console.error('❌ CORS Test Error:', e.message);
  });
  
  req.end();
}

// Run tests
console.log('🚀 Starting Backend API Tests...\n');
testQRVerification();

setTimeout(() => {
  testCORS();
}, 2000);
