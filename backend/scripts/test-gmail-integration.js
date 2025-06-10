/**
 * Gmail Integration Test Script
 * 
 * This script tests the Gmail integration functionality including:
 * - Transporter initialization
 * - Connection verification
 * - Test email sending
 * - Simulation fallback
 */

require('dotenv').config()
const { 
  sendEmail, 
  sendUserNotification, 
  initializeTransporter, 
  verifyEmailConnection 
} = require('../utils/emailService')

console.log('🧪 Gmail Integration Test Suite')
console.log('=' .repeat(50))

async function testGmailConfiguration() {
  console.log('\n📋 Testing Gmail Configuration...')
  
  const gmailUser = process.env.GMAIL_USER
  const gmailPassword = process.env.GMAIL_APP_PASSWORD

  if (!gmailUser || !gmailPassword) {
    console.log('⚠️  Gmail credentials not configured')
    console.log('   GMAIL_USER:', gmailUser ? '✅ Set' : '❌ Missing')
    console.log('   GMAIL_APP_PASSWORD:', gmailPassword ? '✅ Set' : '❌ Missing')
    console.log('\n📝 To enable Gmail integration:')
    console.log('   1. Add GMAIL_USER=your-email@gmail.com to .env')
    console.log('   2. Add GMAIL_APP_PASSWORD=your-app-password to .env')
    console.log('   3. Enable 2-factor authentication in Gmail')
    console.log('   4. Generate an App Password in Gmail settings')
    return false
  }

  console.log('✅ Gmail credentials configured')
  console.log('   GMAIL_USER:', gmailUser)
  console.log('   GMAIL_APP_PASSWORD: [HIDDEN]')
  return true
}

async function testTransporterInitialization() {
  console.log('\n🔧 Testing Transporter Initialization...')
  
  try {
    const transporter = initializeTransporter()
    
    if (transporter) {
      console.log('✅ Gmail transporter initialized successfully')
      return true
    } else {
      console.log('⚠️  Transporter initialization returned null (simulation mode)')
      return false
    }
  } catch (error) {
    console.log('❌ Transporter initialization failed:', error.message)
    return false
  }
}

async function testConnectionVerification() {
  console.log('\n🔗 Testing Connection Verification...')
  
  try {
    const isConnected = await verifyEmailConnection()
    
    if (isConnected) {
      console.log('✅ Gmail connection verified successfully')
      return true
    } else {
      console.log('⚠️  Gmail connection verification failed (will use simulation)')
      return false
    }
  } catch (error) {
    console.log('❌ Connection verification error:', error.message)
    return false
  }
}

async function testBasicEmailSending() {
  console.log('\n📧 Testing Basic Email Sending...')
  
  const testEmail = {
    to: process.env.GMAIL_USER || 'test@example.com',
    subject: 'Quench RBAC - Gmail Integration Test',
    text: 'This is a test email from the Quench RBAC Gmail integration system.',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Gmail Integration Test</h2>
        <p>This is a test email from the Quench RBAC system to verify Gmail integration.</p>
        <p><strong>Test Details:</strong></p>
        <ul>
          <li>Date: ${new Date().toISOString()}</li>
          <li>System: Quench RBAC Backend</li>
          <li>Test Type: Gmail Integration Verification</li>
        </ul>
        <p style="color: #666; font-size: 12px;">
          If you received this email, the Gmail integration is working correctly.
        </p>
      </div>
    `
  }

  try {
    const result = await sendEmail(testEmail)
    
    console.log('✅ Email sent successfully')
    console.log('   Message ID:', result.messageId)
    console.log('   Provider:', result.provider)
    console.log('   Timestamp:', result.timestamp)
    
    return result
  } catch (error) {
    console.log('❌ Email sending failed:', error.message)
    return null
  }
}

async function testUserNotificationEmail() {
  console.log('\n👤 Testing User Notification Email...')
  
  const mockUser = {
    _id: 'test-user-id',
    name: 'Test User',
    email: process.env.GMAIL_USER || 'test@example.com'
  }

  const mockSender = {
    name: 'Admin Test',
    email: process.env.GMAIL_USER || 'admin@example.com',
    _id: 'admin-test-id'
  }

  const mockRequest = {
    ip: '127.0.0.1',
    get: () => 'Gmail-Integration-Test/1.0'
  }

  try {
    const result = await sendUserNotification({
      user: mockUser,
      subject: 'Test Admin Notification',
      message: 'This is a test admin notification to verify the user email functionality.',
      sender: mockSender,
      req: mockRequest
    })

    console.log('✅ User notification sent successfully')
    console.log('   Message ID:', result.messageId)
    console.log('   Provider:', result.provider)
    
    return result
  } catch (error) {
    console.log('❌ User notification failed:', error.message)
    return null
  }
}

async function runAllTests() {
  console.log('🚀 Starting Gmail Integration Tests...\n')

  const results = {
    configuration: false,
    transporter: false,
    connection: false,
    basicEmail: false,
    userNotification: false
  }

  // Test 1: Configuration
  results.configuration = await testGmailConfiguration()

  // Test 2: Transporter Initialization
  results.transporter = await testTransporterInitialization()

  // Test 3: Connection Verification
  results.connection = await testConnectionVerification()

  // Test 4: Basic Email Sending
  results.basicEmail = (await testBasicEmailSending()) !== null

  // Test 5: User Notification Email
  results.userNotification = (await testUserNotificationEmail()) !== null

  // Results Summary
  console.log('\n' + '='.repeat(50))
  console.log('📊 TEST RESULTS SUMMARY')
  console.log('='.repeat(50))
  
  Object.entries(results).forEach(([test, passed]) => {
    const status = passed ? '✅ PASS' : '❌ FAIL'
    const testName = test.replace(/([A-Z])/g, ' $1').toLowerCase()
    console.log(`   ${testName.padEnd(20)} : ${status}`)
  })

  const passedTests = Object.values(results).filter(Boolean).length
  const totalTests = Object.keys(results).length
  
  console.log('\n📈 Overall Results:')
  console.log(`   Tests Passed: ${passedTests}/${totalTests}`)
  
  if (passedTests === totalTests) {
    console.log('🎉 All tests passed! Gmail integration is fully functional.')
  } else if (passedTests >= 2) {
    console.log('⚠️  Some tests failed, but basic functionality is working.')
    console.log('   Email system will fall back to simulation mode when needed.')
  } else {
    console.log('❌ Most tests failed. Gmail integration may not be configured correctly.')
    console.log('   System will operate in simulation mode only.')
  }

  console.log('\n💡 Next Steps:')
  if (!results.configuration) {
    console.log('   1. Configure Gmail credentials in .env file')
    console.log('   2. Enable 2-factor authentication in Gmail')
    console.log('   3. Generate App Password for this application')
  } else if (!results.connection) {
    console.log('   1. Verify Gmail credentials are correct')
    console.log('   2. Check internet connection')
    console.log('   3. Ensure App Password is correctly generated')
  } else {
    console.log('   1. Gmail integration is ready for production use')
    console.log('   2. Monitor email sending in production logs')
    console.log('   3. Test with real user scenarios')
  }
}

// Main execution
if (require.main === module) {
  runAllTests().catch(console.error)
}

module.exports = {
  testGmailConfiguration,
  testTransporterInitialization,
  testConnectionVerification,
  testBasicEmailSending,
  testUserNotificationEmail,
  runAllTests
}
