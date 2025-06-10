/**
 * Migration Script: Update existing Scan documents with new boolean device flags
 * 
 * This script will populate the new boolean fields (isAndroid, isIOS, isDesktop, etc.)
 * for existing Scan documents that don't have these fields.
 * 
 * Run this script once after deploying the updated Scan model.
 */

const mongoose = require('mongoose')
const Scan = require('../models/Scan')
require('dotenv').config()

// Enhanced device detection function
function detectDeviceFlags(userAgent) {
  const ua = userAgent.toLowerCase()
  
  const isAndroid = /android/i.test(userAgent)
  const isIOS = /iphone|ipad|ipod/i.test(userAgent)
  const isDesktop = !(/mobile|android|iphone|ipad|ipod|tablet/i.test(userAgent))
  const isMobile = /mobile|android|iphone|ipod/i.test(userAgent) && !/tablet|ipad/i.test(userAgent)
  const isTablet = /tablet|ipad/i.test(userAgent)
  
  // Determine device type
  let deviceType = 'unknown'
  if (isMobile) {
    deviceType = 'mobile'
  } else if (isTablet) {
    deviceType = 'tablet'
  } else if (isDesktop) {
    deviceType = 'desktop'
  }
  
  return {
    isAndroid,
    isIOS,
    isDesktop,
    isMobile,
    isTablet,
    deviceType
  }
}

async function migrateScanDeviceFlags() {
  try {
    console.log('🚀 Starting Scan device flags migration...')
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI)
    console.log('✅ Connected to MongoDB')
    
    // Find scans that don't have the new boolean flags
    const scansToUpdate = await Scan.find({
      $or: [
        { 'deviceInfo.isAndroid': { $exists: false } },
        { 'deviceInfo.isIOS': { $exists: false } },
        { 'deviceInfo.isDesktop': { $exists: false } },
        { 'deviceInfo.isMobile': { $exists: false } },
        { 'deviceInfo.isTablet': { $exists: false } },
        { 'deviceInfo.deviceType': { $exists: false } }
      ]
    })
    
    console.log(`📊 Found ${scansToUpdate.length} scans to update`)
    
    if (scansToUpdate.length === 0) {
      console.log('✅ All scans already have device flags. Migration not needed.')
      return
    }
    
    let updatedCount = 0
    let batchSize = 100
    
    // Process scans in batches
    for (let i = 0; i < scansToUpdate.length; i += batchSize) {
      const batch = scansToUpdate.slice(i, i + batchSize)
      
      const bulkOps = batch.map(scan => {
        const deviceFlags = detectDeviceFlags(scan.userAgent || '')
        
        return {
          updateOne: {
            filter: { _id: scan._id },
            update: {
              $set: {
                'deviceInfo.isAndroid': deviceFlags.isAndroid,
                'deviceInfo.isIOS': deviceFlags.isIOS,
                'deviceInfo.isDesktop': deviceFlags.isDesktop,
                'deviceInfo.isMobile': deviceFlags.isMobile,
                'deviceInfo.isTablet': deviceFlags.isTablet,
                'deviceInfo.deviceType': deviceFlags.deviceType
              }
            }
          }
        }
      })
      
      // Execute bulk update
      const result = await Scan.bulkWrite(bulkOps)
      updatedCount += result.modifiedCount
      
      console.log(`📝 Updated batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(scansToUpdate.length / batchSize)} - ${result.modifiedCount} records`)
    }
    
    console.log(`✅ Migration completed successfully!`)
    console.log(`📊 Total scans updated: ${updatedCount}`)
    
    // Verify the migration
    const verificationCount = await Scan.countDocuments({
      'deviceInfo.isAndroid': { $exists: true },
      'deviceInfo.isIOS': { $exists: true },
      'deviceInfo.isDesktop': { $exists: true },
      'deviceInfo.isMobile': { $exists: true },
      'deviceInfo.isTablet': { $exists: true },
      'deviceInfo.deviceType': { $exists: true }
    })
    
    console.log(`🔍 Verification: ${verificationCount} scans now have all device flags`)
    
  } catch (error) {
    console.error('❌ Migration failed:', error)
    throw error
  } finally {
    await mongoose.connection.close()
    console.log('🔌 Database connection closed')
  }
}

// Run migration if this script is executed directly
if (require.main === module) {
  migrateScanDeviceFlags()
    .then(() => {
      console.log('🎉 Migration script completed successfully')
      process.exit(0)
    })
    .catch((error) => {
      console.error('💥 Migration script failed:', error)
      process.exit(1)
    })
}

module.exports = { migrateScanDeviceFlags }
