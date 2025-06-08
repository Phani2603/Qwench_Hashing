// Simple QR verification test
const axios = require('axios');

// Base URL - Make sure this is the production URL
const API_URL = 'https://quench-rbac-backend-production.up.railway.app/api';

// Test function
async function testQRVerification() {
  console.log('Testing QR Code Verification...');
  
  try {
    // First, test health endpoint to verify server is responding
    console.log('\n1. Testing health endpoint...');
    const healthResponse = await axios.get(`${API_URL}/health`);
    console.log(`Health endpoint status: ${healthResponse.status}`);
    console.log(`Response: ${JSON.stringify(healthResponse.data)}`);
    
    // Now test QR verification with a known test code
    console.log('\n2. Testing QR code verification endpoint...');
    const verificationResponse = await axios.get(`${API_URL}/qrcodes/verify/test-code-123`, {
      validateStatus: function (status) {
        return true; // Accept all status codes for testing
      }
    });
    
    console.log(`Verification endpoint status: ${verificationResponse.status}`);
    console.log(`Response: ${JSON.stringify(verificationResponse.data)}`);
    
    // Test a simpler URL to check if route pattern matching is the issue
    console.log('\n3. Testing basic QR route endpoint...');
    const basicQrResponse = await axios.get(`${API_URL}/qrcodes`, {
      validateStatus: function (status) {
        return true; // Accept all status codes for testing
      }
    });
    
    console.log(`Basic QR endpoint status: ${basicQrResponse.status}`);
    console.log(`Response: ${JSON.stringify(basicQrResponse.data)}`);
    
  } catch (error) {
    if (error.response) {
      console.log(`Error status: ${error.response.status}`);
      console.log(`Error data: ${JSON.stringify(error.response.data)}`);
    } else {
      console.log(`Error: ${error.message}`);
    }
  }
}

testQRVerification().catch(console.error);
