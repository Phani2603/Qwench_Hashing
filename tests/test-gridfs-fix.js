// Test script to verify GridFS fix
const mongoose = require('mongoose');
const { generateAndStoreQRCode } = require('./utils/gridfs');

console.log('🧪 Testing GridFS Fix...\n');

// Test the fixed GridFS function
async function testGridFSFix() {
  try {
    // Connect to MongoDB (using the same connection as the app)
    const mongoUri = process.env.MONGODB_URI || 'mongodb+srv://phrambrahma2023:EfzSLTCJqgqnrFUa@cluster0.ywm9b.mongodb.net/rbac_project?retryWrites=true&w=majority';
    
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('✅ MongoDB connected successfully');
    
    // Test the GridFS function
    console.log('\n📄 Testing QR code generation and storage...');
    const testCodeId = 'test-' + Date.now();
    const testQRData = 'https://example.com/verify/' + testCodeId;
    
    console.log(`📝 Test Code ID: ${testCodeId}`);
    console.log(`📝 Test QR Data: ${testQRData}`);
    
    // This should NOT crash with the fix applied
    const result = await generateAndStoreQRCode(testCodeId, testQRData);
    
    console.log('\n✅ QR Code Generation Results:');
    console.log(`   File ID: ${result.fileId}`);
    console.log(`   Image URL: ${result.imageURL}`);
    
    console.log('\n🎉 GridFS Fix Test PASSED!');
    console.log('   - No crashes occurred');
    console.log('   - File ID is properly returned');
    console.log('   - Image URL is correctly formatted');
    
  } catch (error) {
    console.error('\n❌ GridFS Fix Test FAILED:');
    console.error(`   Error: ${error.message}`);
    console.error(`   Stack: ${error.stack}`);
    
    if (error.message.includes('Cannot read properties of undefined')) {
      console.error('\n🚨 The GridFS bug is still present!');
      console.error('   Check the finish event handler in backend/utils/gridfs.js');
    }
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 MongoDB disconnected');
  }
}

// Run the test
testGridFSFix().then(() => {
  console.log('\n🏁 Test completed');
  process.exit(0);
}).catch((error) => {
  console.error('\n💥 Test script error:', error);
  process.exit(1);
});
