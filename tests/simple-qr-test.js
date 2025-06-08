// Direct QR verification test
const https = require('https');

// Configuration
const BACKEND_URL = 'quench-rbac-backend-production.up.railway.app';
const QR_CODE_ID = 'test-qr-code-123'; // Test QR code ID

console.log('🔍 Testing QR Code Verification Endpoint');
console.log(`URL: https://${BACKEND_URL}/api/qrcodes/verify/${QR_CODE_ID}`);
console.log('------------------------------------------------------');

// Make the request
const request = https.request({
  hostname: BACKEND_URL,
  path: `/api/qrcodes/verify/${QR_CODE_ID}`,
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
    'User-Agent': 'QR-Verification-Test'
  }
}, (response) => {
  let data = '';
  
  // Collect response data
  response.on('data', (chunk) => {
    data += chunk;
  });
  
  // Process complete response
  response.on('end', () => {
    console.log(`Status Code: ${response.statusCode}`);
    
    try {
      // Try to parse JSON response
      const jsonResponse = JSON.parse(data);
      console.log('Response data:');
      console.log(JSON.stringify(jsonResponse, null, 2));
      
      if (response.statusCode === 404) {
        if (jsonResponse.message && jsonResponse.message.includes('not found')) {
          console.log('\n✅ Endpoint is working! (404 is expected for test code)');
        } else {
          console.log('\n❌ Endpoint might be working, but returned unexpected 404 message');
        }
      } else if (response.statusCode === 200) {
        console.log('\n✅ Endpoint is working! Returned valid response');
      } else {
        console.log(`\n❓ Endpoint returned unexpected status code: ${response.statusCode}`);
      }
    } catch (error) {
      console.log('\n❌ Failed to parse JSON response:');
      console.log(data);
      console.log(`\nError: ${error.message}`);
    }
  });
});

// Handle request errors
request.on('error', (error) => {
  console.log(`\n❌ Request failed: ${error.message}`);
});

// Complete request
request.end();
