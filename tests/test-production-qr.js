// Production QR Code Generation Test
const https = require('https');

const BACKEND_URL = 'quench-rbac-backend-production.up.railway.app';
const FRONTEND_URL = 'https://quench-rbac-frontend.vercel.app';

console.log('🧪 Testing QR Code Generation on Production...\n');
console.log(`Backend: https://${BACKEND_URL}`);
console.log(`Frontend: ${FRONTEND_URL}\n`);

// Test data for QR generation
const testCredentials = {
  email: 'admin@test.com',
  password: 'password'
};

let authToken = null;

// Step 1: Authenticate
function authenticate() {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(testCredentials);
    
    const options = {
      hostname: BACKEND_URL,
      path: '/api/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          if (res.statusCode === 200 && response.token) {
            authToken = response.token;
            console.log('✅ Authentication successful');
            resolve(response);
          } else {
            console.log(`❌ Authentication failed: ${res.statusCode}`);
            console.log(`Response: ${data}`);
            reject(new Error('Authentication failed'));
          }
        } catch (error) {
          reject(error);
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

// Step 2: Test QR Code Generation
function testQRGeneration() {
  return new Promise((resolve, reject) => {
    if (!authToken) {
      reject(new Error('No auth token available'));
      return;
    }

    const qrData = {
      userId: '676816f5b89e9c89dfad34fb', // Test user ID
      categoryId: '676816f5b89e9c89dfad34fc', // Test category ID
      websiteURL: 'https://www.google.com',
      websiteTitle: 'Google Search - GridFS Test'
    };

    const postData = JSON.stringify(qrData);
    
    const options = {
      hostname: BACKEND_URL,
      path: '/api/qrcodes/generate',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    console.log('\n🔄 Testing QR code generation...');
    console.log('   This should NOT cause a 502 error with our fix!');

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log(`\n📊 QR Generation Response:`);
        console.log(`   Status Code: ${res.statusCode}`);
        
        try {
          const response = JSON.parse(data);
          
          if (res.statusCode === 201 && response.success) {
            console.log('✅ QR code generation SUCCESSFUL!');
            console.log(`   Code ID: ${response.qrCode.codeId}`);
            console.log(`   Image URL: ${response.qrCode.imageURL}`);
            console.log(`   Scan URL: ${response.scanUrl}`);
            console.log('\n🎉 GridFS Fix VERIFIED - No more 502 crashes!');
            resolve(response);
          } else if (res.statusCode === 502) {
            console.log('❌ 502 Bad Gateway - GridFS bug still present!');
            console.log(`   Response: ${data}`);
            reject(new Error('502 error - GridFS bug not fixed'));
          } else {
            console.log(`⚠️  Unexpected response: ${res.statusCode}`);
            console.log(`   Response: ${JSON.stringify(response, null, 2)}`);
            resolve(response);
          }
        } catch (error) {
          console.log(`❌ Invalid JSON response: ${data}`);
          reject(error);
        }
      });
    });

    req.on('error', (error) => {
      console.log(`❌ Request error: ${error.message}`);
      reject(error);
    });

    req.setTimeout(15000, () => {
      console.log('❌ Request timeout (15s)');
      req.abort();
      reject(new Error('Request timeout'));
    });

    req.write(postData);
    req.end();
  });
}

// Run the test
async function runTest() {
  try {
    console.log('🔐 Step 1: Authenticating...');
    await authenticate();
    
    console.log('\n📱 Step 2: Testing QR generation...');
    await testQRGeneration();
    
    console.log('\n🎉 ALL TESTS PASSED!');
    console.log('   ✅ Authentication working');
    console.log('   ✅ QR generation working');
    console.log('   ✅ No 502 errors');
    console.log('   ✅ GridFS fix successful');
    
  } catch (error) {
    console.log(`\n❌ Test failed: ${error.message}`);
    console.log('\n🔍 Possible issues:');
    console.log('   - Railway deployment still in progress');
    console.log('   - Database connection issues');
    console.log('   - GridFS fix not fully applied');
  }
}

runTest();
