// Simple health check to verify Railway deployment
const https = require('https');

const BACKEND_URL = 'quench-rbac-backend-production.up.railway.app';

console.log('🔍 Checking Railway Deployment Status...\n');

function checkHealth() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: BACKEND_URL,
      path: '/health',
      method: 'GET',
      timeout: 10000
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log(`Status: ${res.statusCode}`);
        console.log(`Response: ${data}`);
        
        if (res.statusCode === 200) {
          console.log('✅ Backend is healthy and responding');
          resolve(data);
        } else {
          console.log('⚠️ Backend responded but with non-200 status');
          resolve(data);
        }
      });
    });

    req.on('error', (error) => {
      console.log(`❌ Connection error: ${error.message}`);
      reject(error);
    });

    req.on('timeout', () => {
      console.log('❌ Request timed out');
      req.abort();
      reject(new Error('Timeout'));
    });

    req.end();
  });
}

checkHealth().then(() => {
  console.log('\n✅ Health check completed');
}).catch((error) => {
  console.log(`\n❌ Health check failed: ${error.message}`);
  console.log('\n🔍 This might indicate:');
  console.log('   - Railway deployment still in progress');
  console.log('   - Server startup issues');
  console.log('   - Network connectivity problems');
});
