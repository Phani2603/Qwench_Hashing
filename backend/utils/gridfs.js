const { GridFSBucket } = require('mongodb');
const mongoose = require('mongoose');
const qrcode = require('qrcode');

let gridFSBucket;

// Initialize GridFS bucket
const initGridFS = () => {
  if (!gridFSBucket && mongoose.connection.readyState === 1) {
    gridFSBucket = new GridFSBucket(mongoose.connection.db, {
      bucketName: 'qrcodes'
    });
    console.log('GridFS bucket initialized for QR code storage');
  }
  return gridFSBucket;
};

// Generate and store QR code in MongoDB GridFS
const generateAndStoreQRCode = async (codeId, qrData) => {
  try {
    // Initialize GridFS
    const bucket = initGridFS();
    
    if (!bucket) {
      throw new Error('GridFS bucket not initialized - MongoDB connection required');
    }
    
    // Generate QR code as buffer
    const qrBuffer = await qrcode.toBuffer(qrData, {
      errorCorrectionLevel: "H",
      margin: 1,
      width: 300,
    });
    
    // Create a unique filename
    const filename = `${codeId}.png`;
    
    console.log(`📄 Generating QR code for storage: ${filename}`);
    
    // Create writable stream to GridFS
    const uploadStream = bucket.openUploadStream(filename, {
      contentType: 'image/png',
      metadata: { 
        codeId,
        createdAt: new Date(),
        type: 'qr-code'
      }    });

    // Convert buffer write to promise
    return new Promise((resolve, reject) => {
      uploadStream.on('error', (error) => {
        console.error('❌ GridFS upload error:', error);
        reject(new Error(`Failed to store QR code: ${error.message}`));
      });
      
      uploadStream.on('finish', () => {
        // FIX: Use uploadStream.id instead of undefined file._id
        const fileId = uploadStream.id;
        console.log(`✅ QR code stored successfully in GridFS with ID: ${fileId}`);
        
        resolve({
          fileId: fileId,
          imageURL: `/qrcodes/image/${codeId}`
        });
      });
      
      // Write the buffer to GridFS
      uploadStream.end(qrBuffer);
    });
    
  } catch (error) {
    console.error('❌ Error in QR code generation:', error);
    throw new Error(`QR code generation failed: ${error.message}`);
  }
};

// Retrieve QR code from GridFS
const getQRCodeFromGridFS = async (codeId) => {
  try {
    const bucket = initGridFS();
    
    if (!bucket) {
      throw new Error('GridFS bucket not initialized');
    }
    
    // Find the file by filename
    const files = await bucket.find({ filename: `${codeId}.png` }).toArray();
    
    if (!files || files.length === 0) {
      return null;
    }
    
    // Return download stream
    return bucket.openDownloadStreamByName(`${codeId}.png`);
  } catch (error) {
    console.error('Error retrieving QR code from GridFS:', error);
    throw error;
  }
};

// Delete QR code from GridFS
const deleteQRCodeFromGridFS = async (codeId) => {
  try {
    const bucket = initGridFS();
    
    if (!bucket) {
      throw new Error('GridFS bucket not initialized');
    }
    
    // Find the file by filename
    const files = await bucket.find({ filename: `${codeId}.png` }).toArray();
    
    if (files && files.length > 0) {
      await bucket.delete(files[0]._id);
      console.log(`Deleted QR code ${codeId} from GridFS`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error deleting QR code from GridFS:', error);
    throw error;
  }
};

module.exports = {
  initGridFS,
  generateAndStoreQRCode,
  getQRCodeFromGridFS,
  deleteQRCodeFromGridFS
};
