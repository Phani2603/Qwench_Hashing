const QRCode = require('./models/QRCode');
const mongoose = require('mongoose');

// Connect to MongoDB
const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/quench_rbac';
mongoose.connect(mongoUri).then(async () => {
  console.log('Connected to MongoDB');
  
  // Find a sample QR code to test with
  const qrCode = await QRCode.findOne({ isActive: true })
    .populate('assignedTo', 'name email')
    .populate('category', 'name color');
    
  if (qrCode) {
    console.log('Sample QR Code found:');
    console.log('Code ID:', qrCode.codeId);
    console.log('Website URL:', qrCode.websiteURL);
    console.log('Website Title:', qrCode.websiteTitle);
    console.log('Assigned To:', qrCode.assignedTo?.name);
    console.log('Category:', qrCode.category?.name);
    console.log('Is Active:', qrCode.isActive);
  } else {
    console.log('No active QR codes found');
  }
  
  // List all QR codes to see what's available
  const allQRCodes = await QRCode.find({}).limit(5);
  console.log('\nAll QR codes (first 5):');
  allQRCodes.forEach((qr, index) => {
    console.log(`${index + 1}. Code ID: ${qr.codeId}, Active: ${qr.isActive}, URL: ${qr.websiteURL}`);
  });
  
  process.exit(0);
}).catch(err => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
});
