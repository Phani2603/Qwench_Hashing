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
    
    console.log(`Generating QR code for storage: ${filename}`);
    
    // Create writable stream to GridFS
    const uploadStream = bucket.openUploadStream(filename, {
      contentType: 'image/png',
      metadata: { 
        codeId,
        createdAt: new Date(),
        type: 'qr-code'
      }
    });
    
    // Convert buffer write to promise
    return new Promise((resolve, reject) => {
      uploadStream.on('error', (error) => {
        console.error('Error storing QR code in MongoDB:', error);
        reject(error);
      });
        uploadStream.on('finish', (file) => {
        console.log(`QR code stored in MongoDB with ID: ${file._id}`);
        // Return the file ID and a reference path that can be used in API endpoints
        resolve({
          fileId: file._id,
          imageURL: `/qrcodes/image/${codeId}`
        });
      });
      
      // Write buffer to stream
      uploadStream.write(qrBuffer);
      uploadStream.end();
    });
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw error;
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
