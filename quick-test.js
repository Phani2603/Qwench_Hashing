const https = require('https');

console.log('🚀 Testing Railway Deployment After Push...');
console.log('================================================');

const BASE_URL = 'https://quench-rbac-backend-production.up.railway.app';

https.get(`${BASE_URL}/api/status`, (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    try {
      const parsed = JSON.parse(data);
      if (res.statusCode === 200) {
        console.log('✅ DEPLOYMENT SUCCESSFUL!');
        console.log('📊 Status Response:', JSON.stringify(parsed, null, 2));
        console.log('\n🎉 Backend is ready and responding!');
      } else {
        console.log('❌ Deployment may still be in progress...');
        console.log('Status Code:', res.statusCode);
      }
    } catch (e) {
      console.log('❌ Invalid response from server');
    }
  });
}).on('error', (error) => {
  console.log('❌ Connection error:', error.message);
});
