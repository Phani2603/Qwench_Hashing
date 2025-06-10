/**
 * Pre-Migration Test: Check Environment Setup
 * 
 * This script tests the environment before running the full migration
 */

const mongoose = require('mongoose')
const Scan = require('../models/Scan')
require('dotenv').config()

async function preMigrationTest() {
  try {
    console.log('🧪 Running pre-migration environment test...')
    
    // Test 1: Environment variables
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI not found in environment variables')
    }
    console.log('✅ Environment variables loaded')
    
    // Test 2: MongoDB connection
    await mongoose.connect(process.env.MONGODB_URI)
    console.log('✅ MongoDB connection successful')
    
    // Test 3: Scan model accessibility
    const totalScans = await Scan.countDocuments()
    console.log(`✅ Scan model accessible - Found ${totalScans} total scans`)
    
    // Test 4: Check existing device flags
    const scansWithFlags = await Scan.countDocuments({
      'deviceInfo.isAndroid': { $exists: true }
    })
    console.log(`📊 Scans with device flags: ${scansWithFlags}`)
    console.log(`📊 Scans needing migration: ${totalScans - scansWithFlags}`)
    
    if (totalScans === 0) {
      console.log('⚠️  No scan records found. Migration not needed.')
    } else if (scansWithFlags === totalScans) {
      console.log('✅ All scans already have device flags. Migration not needed.')
    } else {
      console.log('🚀 Migration is needed and environment is ready!')
    }
    
  } catch (error) {
    console.error('❌ Pre-migration test failed:', error.message)
    
    // Provide specific guidance based on error type
    if (error.message.includes('MONGODB_URI')) {
      console.log('💡 Fix: Ensure .env file exists in backend/ directory')
    } else if (error.message.includes('connect')) {
      console.log('💡 Fix: Check internet connection and MongoDB Atlas access')
    } else if (error.message.includes('Cannot find module')) {
      console.log('💡 Fix: Run script from backend/ directory: cd backend && node scripts/pre-migration-test.js')
    }
    
    throw error
  } finally {
    await mongoose.connection.close()
    console.log('🔌 Database connection closed')
  }
}

// Run test
if (require.main === module) {
  preMigrationTest()
    .then(() => {
      console.log('\n🎉 Pre-migration test completed successfully!')
      console.log('Environment is ready for migration.')
      process.exit(0)
    })
    .catch((error) => {
      console.error('\n💥 Pre-migration test failed:', error.message)
      process.exit(1)
    })
}

module.exports = { preMigrationTest }
