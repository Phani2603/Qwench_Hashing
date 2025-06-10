const axios = require('axios');
const fs = require('fs');
const path = require('path');

const API_BASE_URL = process.env.API_URL || 'http://localhost:5000/api';

// Admin user credentials
const adminCredentials = {
  email: 'admin@quench.com',
  password: 'QuenchAdmin2024!'
};

async function testQRCodeDownloadEndpoint() {
  try {
    console.log('Starting QR Code high-quality download endpoint test...');
    
    // Step 1: Login to get auth token
    console.log('Logging in as admin...');
    const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, adminCredentials);
    
    if (!loginResponse.data.success) {
      throw new Error('Login failed');
    }
    
    const authToken = loginResponse.data.token;
    console.log('✅ Login successful, obtained auth token');
    
    // Step 2: Get QR codes to find a valid codeId
    console.log('Fetching QR codes...');
    const qrCodesResponse = await axios.get(`${API_BASE_URL}/qrcodes`, {
      headers: {
        Authorization: `Bearer ${authToken}`
      }
    });
    
    if (!qrCodesResponse.data.success || !qrCodesResponse.data.qrCodes.length) {
      throw new Error('No QR codes available for testing');
    }
    
    const testQrCode = qrCodesResponse.data.qrCodes[0];
    console.log(`✅ Found test QR code: ${testQrCode.codeId} (${testQrCode.websiteTitle})`);
    
    // Step 3: Test the download endpoint
    console.log('Testing download endpoint...');
    const downloadResponse = await axios.get(`${API_BASE_URL}/qrcodes/download/${testQrCode.codeId}`, {
      headers: {
        Authorization: `Bearer ${authToken}`
      },
      responseType: 'arraybuffer'
    });
    
    // Step 4: Verify the response is an image
    if (downloadResponse.headers['content-type'] !== 'image/png') {
      throw new Error(`Invalid content type: ${downloadResponse.headers['content-type']}`);
    }
    
    // Step 5: Save the file locally for verification
    const outputDir = path.join(__dirname, '../../temp');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    const outputPath = path.join(outputDir, `test-qr-${testQrCode.codeId}.png`);
    fs.writeFileSync(outputPath, downloadResponse.data);
    
    console.log(`✅ Successfully downloaded QR code to: ${outputPath}`);
    console.log(`✅ File size: ${Math.round(downloadResponse.data.length / 1024)} KB`);
    console.log('✅ HIGH-QUALITY QR CODE DOWNLOAD ENDPOINT TEST PASSED!');
    
  } catch (error) {
    console.error('❌ TEST FAILED:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

// Run the test
testQRCodeDownloadEndpoint();
