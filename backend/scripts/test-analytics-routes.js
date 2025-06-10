/**
 * Test Script: Analytics Routes Verification
 * 
 * This script tests the analytics endpoints to ensure they work correctly
 * with the new device detection boolean flags.
 */

const axios = require('axios')
require('dotenv').config()

const BASE_URL = process.env.BASE_URL || 'http://localhost:5000'
const API_BASE = `${BASE_URL}/api`

// Test data - you'll need to replace with actual tokens and user IDs
const TEST_CONFIG = {
  // Get these from your database or login process
  USER_TOKEN: 'your-user-jwt-token-here',
  ADMIN_TOKEN: 'your-admin-jwt-token-here',
  TEST_EMAIL: 'test@example.com'
}

async function testAnalyticsEndpoints() {
  console.log('🧪 Starting Analytics Routes Test...\n')

  const tests = [
    {
      name: 'User Device Analytics',
      endpoint: `${API_BASE}/analytics/devices`,
      method: 'GET',
      token: TEST_CONFIG.USER_TOKEN,
      expectedFields: ['success', 'deviceAnalytics']
    },
    {
      name: 'User Activity Analytics',
      endpoint: `${API_BASE}/analytics/activity?timeframe=daily`,
      method: 'GET',
      token: TEST_CONFIG.USER_TOKEN,
      expectedFields: ['success', 'activityData']
    },
    {
      name: 'CSV Export',
      endpoint: `${API_BASE}/analytics/export/csv`,
      method: 'GET',
      token: TEST_CONFIG.USER_TOKEN,
      expectedResponse: 'csv'
    },
    {
      name: 'PDF Export',
      endpoint: `${API_BASE}/analytics/export/pdf`,
      method: 'GET',
      token: TEST_CONFIG.USER_TOKEN,
      expectedResponse: 'html'
    },
    {
      name: 'Email Export',
      endpoint: `${API_BASE}/analytics/export/email`,
      method: 'POST',
      token: TEST_CONFIG.USER_TOKEN,
      data: { email: TEST_CONFIG.TEST_EMAIL },
      expectedFields: ['success', 'message']
    },
    {
      name: 'Admin QR Analytics',
      endpoint: `${API_BASE}/admin/analytics/qrcodes`,
      method: 'GET',
      token: TEST_CONFIG.ADMIN_TOKEN,
      expectedFields: ['success', 'analytics']
    },
    {
      name: 'Admin User Analytics',
      endpoint: `${API_BASE}/admin/analytics/users`,
      method: 'GET',
      token: TEST_CONFIG.ADMIN_TOKEN,
      expectedFields: ['success', 'analytics']
    },
    {
      name: 'QR Code Analytics (Admin)',
      endpoint: `${API_BASE}/qrcode/analytics?period=7d`,
      method: 'GET',
      token: TEST_CONFIG.ADMIN_TOKEN,
      expectedFields: ['success', 'analytics']
    }
  ]

  let passedTests = 0
  let totalTests = tests.length

  for (const test of tests) {
    try {
      console.log(`🔍 Testing: ${test.name}`)
      
      if (!test.token || test.token === 'your-user-jwt-token-here' || test.token === 'your-admin-jwt-token-here') {
        console.log(`⚠️  Skipping ${test.name} - No valid token provided`)
        console.log(`   Please update TEST_CONFIG with valid JWT tokens\n`)
        continue
      }

      const config = {
        method: test.method,
        url: test.endpoint,
        headers: {
          'Authorization': `Bearer ${test.token}`,
          'Content-Type': 'application/json'
        }
      }

      if (test.data) {
        config.data = test.data
      }

      const response = await axios(config)

      // Check response based on expected type
      if (test.expectedResponse === 'csv') {
        if (response.headers['content-type']?.includes('text/csv')) {
          console.log(`✅ ${test.name} - CSV export working`)
          passedTests++
        } else {
          console.log(`❌ ${test.name} - Expected CSV response`)
        }
      } else if (test.expectedResponse === 'html') {
        if (response.headers['content-type']?.includes('text/html')) {
          console.log(`✅ ${test.name} - HTML/PDF export working`)
          passedTests++
        } else {
          console.log(`❌ ${test.name} - Expected HTML response`)
        }
      } else {
        // JSON response expected
        const data = response.data
        
        if (test.expectedFields) {
          const hasAllFields = test.expectedFields.every(field => data.hasOwnProperty(field))
          
          if (hasAllFields && data.success) {
            console.log(`✅ ${test.name} - All expected fields present`)
            
            // Log device analytics details if present
            if (data.deviceAnalytics) {
              console.log(`   📊 Device Stats: Android=${data.deviceAnalytics.android}, iOS=${data.deviceAnalytics.ios}, Desktop=${data.deviceAnalytics.desktop}`)
            }
            
            passedTests++
          } else {
            console.log(`❌ ${test.name} - Missing fields or failed response`)
            console.log(`   Expected: ${test.expectedFields.join(', ')}`)
            console.log(`   Got: ${Object.keys(data).join(', ')}`)
          }
        } else {
          console.log(`✅ ${test.name} - Response received`)
          passedTests++
        }
      }

    } catch (error) {
      console.log(`❌ ${test.name} - Error: ${error.response?.status} ${error.response?.data?.message || error.message}`)
    }
    
    console.log('') // Empty line for readability
  }

  console.log(`\n🎯 Test Results: ${passedTests}/${totalTests} tests passed`)
  
  if (passedTests === totalTests) {
    console.log('🎉 All analytics routes are working correctly!')
  } else {
    console.log('⚠️  Some tests failed. Please check the implementation.')
  }
}

// Instructions for running the test
console.log(`
📋 Analytics Routes Test Setup Instructions:

1. Make sure your server is running on ${BASE_URL}
2. Update the TEST_CONFIG object with valid JWT tokens:
   - Login as a user and copy the JWT token
   - Login as an admin and copy the JWT token
3. Run: node backend/scripts/test-analytics-routes.js

Note: Some tests will be skipped if valid tokens are not provided.
`)

// Run tests if executed directly
if (require.main === module) {
  testAnalyticsEndpoints()
    .then(() => {
      console.log('\n✅ Test script completed')
      process.exit(0)
    })
    .catch((error) => {
      console.error('\n💥 Test script failed:', error.message)
      process.exit(1)
    })
}

module.exports = { testAnalyticsEndpoints }
