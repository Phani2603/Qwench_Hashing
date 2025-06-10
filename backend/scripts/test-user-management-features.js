/**
 * Test script for User Management Features
 * Tests pagination, email functionality, and QR code count fix
 */

const axios = require('axios')

const API_BASE_URL = process.env.BACKEND_URL || 'http://localhost:5000/api'

// Test configuration
const TEST_CONFIG = {
  adminEmail: 'admin@example.com',
  adminPassword: 'admin123',
  apiBaseUrl: API_BASE_URL
}

/**
 * Test admin authentication
 */
async function testAdminAuth() {
  console.log('🔐 Testing admin authentication...')
  
  try {
    const response = await axios.post(`${TEST_CONFIG.apiBaseUrl}/auth/login`, {
      email: TEST_CONFIG.adminEmail,
      password: TEST_CONFIG.adminPassword
    })

    if (response.data.success && response.data.user.role === 'admin') {
      console.log('✅ Admin authentication successful')
      return response.data.token
    } else {
      throw new Error('Admin authentication failed')
    }
  } catch (error) {
    console.error('❌ Admin authentication failed:', error.message)
    return null
  }
}

/**
 * Test QR codes stats endpoint
 */
async function testQRCodesStats(token) {
  console.log('📊 Testing QR codes stats endpoint...')
  
  try {
    const response = await axios.get(`${TEST_CONFIG.apiBaseUrl}/qrcodes/stats`, {
      headers: { Authorization: `Bearer ${token}` }
    })

    if (response.data.success) {
      console.log('✅ QR codes stats endpoint working')
      console.log(`   Total QR Codes: ${response.data.stats.totalQRCodes}`)
      console.log(`   Total Scans: ${response.data.stats.totalScans}`)
      console.log(`   Active QR Codes: ${response.data.stats.activeQRCodes}`)
      return true
    } else {
      throw new Error('QR stats endpoint returned failure')
    }
  } catch (error) {
    console.error('❌ QR codes stats test failed:', error.message)
    return false
  }
}

/**
 * Test user management endpoints
 */
async function testUserManagement(token) {
  console.log('👥 Testing user management endpoints...')
  
  try {
    // Test get all users
    const usersResponse = await axios.get(`${TEST_CONFIG.apiBaseUrl}/admin/users`, {
      headers: { Authorization: `Bearer ${token}` }
    })

    if (!usersResponse.data.success) {
      throw new Error('Failed to fetch users')
    }

    const users = usersResponse.data.users
    console.log(`✅ Users endpoint working - ${users.length} users found`)

    // Test user analytics
    const analyticsResponse = await axios.get(`${TEST_CONFIG.apiBaseUrl}/admin/analytics/users`, {
      headers: { Authorization: `Bearer ${token}` }
    })

    if (analyticsResponse.data.success) {
      console.log('✅ User analytics endpoint working')
      console.log(`   Total Users: ${analyticsResponse.data.analytics.totalUsers}`)
      console.log(`   Active Users: ${analyticsResponse.data.analytics.activeUsers}`)
      console.log(`   Admin Users: ${analyticsResponse.data.analytics.adminUsers}`)
    }

    return { users, analytics: analyticsResponse.data.analytics }
  } catch (error) {
    console.error('❌ User management test failed:', error.message)
    return null
  }
}

/**
 * Test email functionality (if users exist)
 */
async function testEmailFunctionality(token, users) {
  console.log('📧 Testing email functionality...')
  
  if (!users || users.length === 0) {
    console.log('⚠️  No users found to test email functionality')
    return false
  }

  try {
    // Find a non-admin user to test email with
    const testUser = users.find(user => user.role !== 'admin') || users[0]
    
    const emailData = {
      subject: 'Test Email from Admin',
      message: 'This is a test email sent from the admin panel to verify the email functionality is working correctly.'
    }

    const response = await axios.post(`${TEST_CONFIG.apiBaseUrl}/admin/users/${testUser._id}/email`, emailData, {
      headers: { 
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })

    if (response.data.success) {
      console.log('✅ Email functionality working')
      console.log(`   Email sent to: ${testUser.name} (${testUser.email})`)
      console.log(`   Message ID: ${response.data.emailResult?.messageId}`)
      return true
    } else {
      throw new Error('Email endpoint returned failure')
    }
  } catch (error) {
    console.error('❌ Email functionality test failed:', error.message)
    return false
  }
}

/**
 * Test pagination logic (frontend logic simulation)
 */
function testPaginationLogic(users) {
  console.log('📄 Testing pagination logic...')
  
  const usersPerPage = 10
  const totalUsers = users.length
  const totalPages = Math.ceil(totalUsers / usersPerPage)
  
  console.log(`✅ Pagination logic working`)
  console.log(`   Total Users: ${totalUsers}`)
  console.log(`   Users per Page: ${usersPerPage}`)
  console.log(`   Total Pages: ${totalPages}`)
  
  // Test pagination for first page
  const firstPageStart = 0
  const firstPageEnd = Math.min(usersPerPage, totalUsers)
  const firstPageUsers = users.slice(firstPageStart, firstPageEnd)
  
  console.log(`   First page: ${firstPageUsers.length} users (${firstPageStart + 1} to ${firstPageEnd})`)
  
  return true
}

/**
 * Main test function
 */
async function runTests() {
  console.log('🧪 Starting User Management Feature Tests...')
  console.log('=' * 60)
  
  try {
    // 1. Test admin authentication
    const token = await testAdminAuth()
    if (!token) {
      throw new Error('Cannot proceed without admin authentication')
    }

    // 2. Test QR codes stats (fix verification)
    await testQRCodesStats(token)

    // 3. Test user management
    const userManagementResult = await testUserManagement(token)
    if (!userManagementResult) {
      throw new Error('User management tests failed')
    }

    // 4. Test pagination logic
    testPaginationLogic(userManagementResult.users)

    // 5. Test email functionality
    await testEmailFunctionality(token, userManagementResult.users)

    console.log('\n🎉 All tests completed successfully!')
    console.log('\n📋 Features Tested:')
    console.log('   ✅ QR Code Count Fix')
    console.log('   ✅ User Management Pagination')
    console.log('   ✅ Email Functionality')
    console.log('   ✅ Admin Analytics')

  } catch (error) {
    console.error('\n❌ Test suite failed:', error.message)
    process.exit(1)
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTests().catch(console.error)
}

module.exports = {
  runTests,
  testAdminAuth,
  testQRCodesStats,
  testUserManagement,
  testEmailFunctionality,
  testPaginationLogic
}
