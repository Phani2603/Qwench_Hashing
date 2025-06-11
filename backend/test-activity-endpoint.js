// Test file for debugging the scan activity analytics endpoint
const mongoose = require('mongoose')
require('dotenv').config()

async function debugActivityEndpoint() {
  try {
    console.log('🔄 Connecting to database...')
    await mongoose.connect(process.env.MONGODB_URI)
    console.log('✅ Database connected successfully')
    
    const QRCode = require('./models/QRCode')
    const Scan = require('./models/Scan')
    
    // Check database contents
    const qrCount = await QRCode.countDocuments()
    const scanCount = await Scan.countDocuments()
    
    console.log('\n📊 Database Status:')
    console.log(`   QR Codes: ${qrCount}`)
    console.log(`   Total Scans: ${scanCount}`)
    
    if (qrCount === 0) {
      console.log('❌ No QR codes found in database')
      console.log('   Create some QR codes first to test analytics')
      return
    }
    
    if (scanCount === 0) {
      console.log('❌ No scans found in database')
      console.log('   Scan some QR codes first to test analytics')
      return
    }
    
    // Get a sample QR code and its scans
    const sampleQR = await QRCode.findOne()
    console.log(`\n📋 Sample QR Code:`)
    console.log(`   Title: ${sampleQR.websiteTitle}`)
    console.log(`   User: ${sampleQR.assignedTo}`)
    console.log(`   ID: ${sampleQR._id}`)
    
    // Get all scans for this QR code
    const qrScans = await Scan.find({ qrCode: sampleQR._id })
    console.log(`\n📊 Scans for this QR Code: ${qrScans.length}`)
    
    if (qrScans.length > 0) {
      console.log('📅 Sample scan timestamps:')
      qrScans.slice(0, 5).forEach((scan, index) => {
        console.log(`   ${index + 1}. ${new Date(scan.timestamp).toISOString()}`)
      })
    }
    
    // Test daily activity aggregation (last 14 days)
    console.log('\n🧪 Testing daily activity aggregation...')
    const now = new Date()
    const startDate = new Date(now)
    startDate.setDate(now.getDate() - 14)
    
    const dailyActivity = await Scan.aggregate([
      {
        $match: {
          qrCode: { $in: await QRCode.find({ assignedTo: sampleQR.assignedTo }).distinct('_id') },
          timestamp: { $gte: startDate, $lte: now }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: "$timestamp"
            }
          },
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          date: "$_id",
          scans: "$count",
          _id: 0
        }
      },
      { $sort: { date: 1 } }
    ])
    
    console.log('📈 Daily activity result:')
    console.log(JSON.stringify(dailyActivity, null, 2))
    
    if (dailyActivity.length === 0) {
      console.log('❌ No activity data found for the last 14 days')
    } else {
      console.log(`✅ Found ${dailyActivity.length} days with activity`)
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error)
  } finally {
    await mongoose.disconnect()
    console.log('\n🔚 Database disconnected')
  }
}

// Run the test
console.log('🚀 Starting activity endpoint debug test...')
debugActivityEndpoint()
