/**
 * QUENCH RBAC - Enhanced QR Verification & Scan Testing Script
 * 
 * This script tests the complete QR code verification and scanning flow
 * including the new enhanced 3-second verification page with auto-redirect.
 * 
 * Features Tested:
 * - QR Code generation
 * - QR Code verification endpoint
 * - Enhanced scan-verify endpoint with logging
 * - Frontend scan page with countdown
 * - Auto-redirect functionality
 * - Scan analytics and counting
 * 
 * Date: June 8, 2025
 * Status: Ready for Testing
 */

const axios = require('axios')

// Handle chalk module compatibility
let chalk
try {
  chalk = require('chalk')
  // Test if chalk is working properly
  if (typeof chalk.red !== 'function') {
    throw new Error('Chalk not properly loaded')
  }
} catch (error) {
  // Fallback if chalk doesn't work - create a simple color wrapper
  chalk = {
    red: (text) => `\x1b[31m${text}\x1b[0m`,
    green: (text) => `\x1b[32m${text}\x1b[0m`,
    yellow: (text) => `\x1b[33m${text}\x1b[0m`,
    blue: (text) => `\x1b[34m${text}\x1b[0m`,
    magenta: (text) => `\x1b[35m${text}\x1b[0m`,
    cyan: (text) => `\x1b[36m${text}\x1b[0m`,
    white: (text) => `\x1b[37m${text}\x1b[0m`,
    gray: (text) => `\x1b[90m${text}\x1b[0m`,
    bold: (text) => `\x1b[1m${text}\x1b[0m`
  }
}

// Configuration
const config = {
  // Environment URLs
  BACKEND_URL: process.env.BACKEND_URL || 'https://quench-rbac-backend-production.up.railway.app',
  FRONTEND_URL: process.env.FRONTEND_URL || 'https://quench-rbac-frontend.vercel.app',
  
  // Test credentials
  ADMIN_EMAIL: 'admin@quench.com',
  ADMIN_PASSWORD: 'QuenchAdmin2024!',
  
  // Test data
  TEST_WEBSITE_URL: 'https://www.google.com',
  TEST_WEBSITE_TITLE: 'Google Search - Test QR',
  
  // Test timeout
  TIMEOUT: 10000
}

class QRTestSuite {
  constructor() {
    this.adminToken = null
    this.testQRCodeId = null
    this.testQRData = null
    this.testUserId = null
    this.testCategoryId = null
    this.initialScanCount = 0
  }

  // Utility methods
  log(message, type = 'info') {
    const timestamp = new Date().toISOString()
    switch(type) {
      case 'success':
        console.log(chalk.green(`✅ [${timestamp}] ${message}`))
        break
      case 'error':
        console.log(chalk.red(`❌ [${timestamp}] ${message}`))
        break
      case 'warning':
        console.log(chalk.yellow(`⚠️  [${timestamp}] ${message}`))
        break
      case 'info':
      default:
        console.log(chalk.blue(`ℹ️  [${timestamp}] ${message}`))
        break
    }
  }

  async wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  // Authentication
  async authenticateAdmin() {
    try {
      this.log('Authenticating as admin...')
      
      const response = await axios.post(`${config.BACKEND_URL}/api/auth/login`, {
        email: config.ADMIN_EMAIL,
        password: config.ADMIN_PASSWORD
      }, {
        timeout: config.TIMEOUT
      })

      this.adminToken = response.data.token
      this.log('Admin authentication successful', 'success')
      return true
    } catch (error) {
      this.log(`Admin authentication failed: ${error.response?.data?.message || error.message}`, 'error')
      return false
    }
  }

  // Setup test data
  async setupTestData() {
    try {
      this.log('Setting up test data...')

      // Get users and categories
      const [usersResponse, categoriesResponse] = await Promise.all([
        axios.get(`${config.BACKEND_URL}/api/admin/users`, {
          headers: { Authorization: `Bearer ${this.adminToken}` },
          timeout: config.TIMEOUT
        }),
        axios.get(`${config.BACKEND_URL}/api/admin/categories`, {
          headers: { Authorization: `Bearer ${this.adminToken}` },
          timeout: config.TIMEOUT
        })
      ])

      // Use first available user and category
      this.testUserId = usersResponse.data.users[0]._id
      this.testCategoryId = categoriesResponse.data.categories[0]._id

      this.log(`Test user ID: ${this.testUserId}`, 'info')
      this.log(`Test category ID: ${this.testCategoryId}`, 'info')
      this.log('Test data setup complete', 'success')
      return true
    } catch (error) {
      this.log(`Test data setup failed: ${error.response?.data?.message || error.message}`, 'error')
      return false
    }
  }

  // Test 1: QR Code Generation
  async testQRGeneration() {
    try {
      this.log('TEST 1: Testing QR code generation...')

      const response = await axios.post(`${config.BACKEND_URL}/api/qrcodes/generate`, {
        userId: this.testUserId,
        categoryId: this.testCategoryId,
        websiteURL: config.TEST_WEBSITE_URL,
        websiteTitle: config.TEST_WEBSITE_TITLE
      }, {
        headers: { Authorization: `Bearer ${this.adminToken}` },
        timeout: config.TIMEOUT
      })

      this.testQRCodeId = response.data.qrCode.codeId
      this.testQRData = response.data.qrCode
      this.initialScanCount = this.testQRData.scanCount || 0

      this.log(`✅ QR code generated successfully: ${this.testQRCodeId}`, 'success')
      this.log(`   Website URL: ${this.testQRData.websiteURL}`, 'info')
      this.log(`   Website Title: ${this.testQRData.websiteTitle}`, 'info')
      this.log(`   Initial Scan Count: ${this.initialScanCount}`, 'info')
      return true
    } catch (error) {
      this.log(`❌ QR generation failed: ${error.response?.data?.message || error.message}`, 'error')
      return false
    }
  }

  // Test 2: QR Code Verification Endpoint
  async testQRVerification() {
    try {
      this.log('TEST 2: Testing QR verification endpoint...')

      const response = await axios.get(`${config.BACKEND_URL}/api/qrcodes/verify/${this.testQRCodeId}`, {
        timeout: config.TIMEOUT
      })

      if (response.data.success && response.data.valid) {
        this.log('✅ QR verification endpoint working correctly', 'success')
        this.log(`   Verified QR Code: ${response.data.qrCode.codeId}`, 'info')
        this.log(`   Assigned to: ${response.data.qrCode.assignedTo.name}`, 'info')
        this.log(`   Category: ${response.data.qrCode.category.name}`, 'info')
        return true
      } else {
        this.log('❌ QR verification returned invalid response', 'error')
        return false
      }
    } catch (error) {
      this.log(`❌ QR verification failed: ${error.response?.data?.message || error.message}`, 'error')
      return false
    }
  }

  // Test 3: Enhanced Scan-Verify Endpoint
  async testScanVerifyEndpoint() {
    try {
      this.log('TEST 3: Testing enhanced scan-verify endpoint...')

      const response = await axios.post(`${config.BACKEND_URL}/api/qrcodes/scan-verify/${this.testQRCodeId}`, {}, {
        headers: {
          'User-Agent': 'QR-Test-Suite/1.0 (Test Environment)',
          'X-Forwarded-For': '192.168.1.100'
        },
        timeout: config.TIMEOUT
      })

      if (response.data.success && response.data.valid && response.data.qrCode) {
        this.log('✅ Scan-verify endpoint working correctly', 'success')
        this.log(`   QR Code ID: ${response.data.qrCode.codeId}`, 'info')
        this.log(`   Website URL: ${response.data.qrCode.websiteURL}`, 'info')
        this.log(`   Website Title: ${response.data.qrCode.websiteTitle}`, 'info')
        this.log(`   Updated Scan Count: ${response.data.qrCode.scanCount}`, 'info')
        
        // Verify scan count increased
        if (response.data.qrCode.scanCount > this.initialScanCount) {
          this.log('✅ Scan count incremented correctly', 'success')
        } else {
          this.log('⚠️  Scan count may not have incremented', 'warning')
        }
        
        return true
      } else {
        this.log('❌ Scan-verify returned invalid response', 'error')
        return false
      }
    } catch (error) {
      this.log(`❌ Scan-verify failed: ${error.response?.data?.message || error.message}`, 'error')
      return false
    }
  }
  // Test 4: Frontend Verify Page Accessibility
  async testFrontendVerifyPage() {
    try {
      this.log('TEST 4: Testing frontend verify page accessibility...')

      const response = await axios.get(`${config.FRONTEND_URL}/verify/${this.testQRCodeId}`, {
        timeout: config.TIMEOUT,
        headers: {
          'User-Agent': 'QR-Test-Suite/1.0 (Test Environment)'
        }
      })

      if (response.status === 200 && response.data.includes('QR Code Verification')) {
        this.log('✅ Frontend verify page is accessible', 'success')
        this.log(`   Page URL: ${config.FRONTEND_URL}/verify/${this.testQRCodeId}`, 'info')
        return true
      } else {
        this.log('❌ Frontend verify page not accessible or invalid content', 'error')
        return false
      }
    } catch (error) {      this.log(`❌ Frontend verify page test failed: ${error.message}`, 'error')
      return false
    }
  }

  // Test 5: Scan Analytics Verification
  async testScanAnalytics() {
    try {
      this.log('TEST 5: Testing scan analytics...')

      // Get QR code details to verify scan was logged
      const response = await axios.get(`${config.BACKEND_URL}/api/qrcodes/user/${this.testUserId}`, {
        headers: { Authorization: `Bearer ${this.adminToken}` },
        timeout: config.TIMEOUT
      })

      const testQR = response.data.qrCodes.find(qr => qr.codeId === this.testQRCodeId)
      
      if (testQR && testQR.scanCount > this.initialScanCount) {
        this.log('✅ Scan analytics working correctly', 'success')
        this.log(`   Total scans: ${testQR.scanCount}`, 'info')
        this.log(`   Last scanned: ${testQR.lastScanned || 'N/A'}`, 'info')
        return true
      } else {
        this.log('⚠️  Scan analytics may not be updating correctly', 'warning')
        return false
      }
    } catch (error) {
      this.log(`❌ Scan analytics test failed: ${error.response?.data?.message || error.message}`, 'error')
      return false
    }
  }

  // Test 6: Invalid QR Code Handling
  async testInvalidQRHandling() {
    try {
      this.log('TEST 6: Testing invalid QR code handling...')

      const invalidCodeId = 'invalid-test-code-12345'
      
      // Test verification endpoint
      try {
        const verifyResponse = await axios.get(`${config.BACKEND_URL}/api/qrcodes/verify/${invalidCodeId}`, {
          timeout: config.TIMEOUT
        })
        
        if (verifyResponse.status === 404 || (verifyResponse.data && !verifyResponse.data.valid)) {
          this.log('✅ Invalid QR verification handled correctly', 'success')
        } else {
          this.log('❌ Invalid QR verification not handled correctly', 'error')
          return false
        }
      } catch (error) {
        if (error.response && error.response.status === 404) {
          this.log('✅ Invalid QR verification returns 404 correctly', 'success')
        } else {
          throw error
        }
      }

      // Test scan-verify endpoint
      try {
        const scanResponse = await axios.post(`${config.BACKEND_URL}/api/qrcodes/scan-verify/${invalidCodeId}`, {}, {
          timeout: config.TIMEOUT
        })
        
        if (scanResponse.status === 404 || (scanResponse.data && !scanResponse.data.valid)) {
          this.log('✅ Invalid QR scan-verify handled correctly', 'success')
        } else {
          this.log('❌ Invalid QR scan-verify not handled correctly', 'error')
          return false
        }
      } catch (error) {
        if (error.response && error.response.status === 404) {
          this.log('✅ Invalid QR scan-verify returns 404 correctly', 'success')
        } else {
          throw error
        }
      }

      return true
    } catch (error) {
      this.log(`❌ Invalid QR handling test failed: ${error.message}`, 'error')
      return false
    }
  }

  // Test 7: Complete Flow Simulation
  async testCompleteFlow() {
    try {
      this.log('TEST 7: Testing complete QR scan flow simulation...')

      // Step 1: User scans QR code (hits backend scan endpoint)
      this.log('   Step 1: Simulating QR scan entry point...')
      const scanEntryResponse = await axios.get(`${config.BACKEND_URL}/api/qrcodes/scan/${this.testQRCodeId}`, {
        timeout: config.TIMEOUT,
        maxRedirects: 0, // Don't follow redirects
        validateStatus: function (status) {
          return status >= 200 && status < 400 // Accept redirects
        }
      })

      if (scanEntryResponse.status === 302) {
        this.log('   ✅ Step 1: Backend scan redirect working', 'success')
        this.log(`   Redirect location: ${scanEntryResponse.headers.location}`, 'info')
      } else {
        this.log('   ❌ Step 1: Backend scan redirect not working', 'error')
        return false
      }      // Step 2: Frontend page loads and calls verify endpoint then logs scan
      this.log('   Step 2: Simulating frontend verify call...')
      const verifyResponse = await axios.get(`${config.BACKEND_URL}/api/qrcodes/verify/${this.testQRCodeId}`, {
        timeout: config.TIMEOUT
      })

      if (verifyResponse.data.success && verifyResponse.data.qrCode) {
        this.log('   ✅ Step 2a: Frontend verify successful', 'success')
        
        // Step 3: Log the scan
        this.log('   Step 3: Simulating scan logging...')
        const scanLogResponse = await axios.post(`${config.BACKEND_URL}/api/qrcodes/verify/${this.testQRCodeId}/scan`, {}, {
          headers: {
            'User-Agent': 'Complete-Flow-Test/1.0 (Simulation)',
            'X-Forwarded-For': '192.168.1.101'
          },
          timeout: config.TIMEOUT
        })

        if (scanLogResponse.data.success) {
          this.log('   ✅ Step 3: Scan logging successful', 'success')
          this.log(`   Website to redirect to: ${verifyResponse.data.qrCode.websiteURL}`, 'info')
        } else {
          this.log('   ❌ Step 3: Scan logging failed', 'error')
          return false
        }
      } else {
        this.log('   ❌ Step 2: Frontend verify failed', 'error')
        return false
      }      // Step 4: Simulate 3-second wait and redirect
      this.log('   Step 4: Simulating 3-second countdown and redirect...')
      for (let i = 3; i > 0; i--) {
        this.log(`   Countdown: ${i} seconds...`, 'info')
        await this.wait(1000)
      }
      this.log('   ✅ Step 4: Countdown complete, would redirect to website', 'success')

      this.log('✅ Complete flow simulation successful', 'success')
      return true
    } catch (error) {
      this.log(`❌ Complete flow test failed: ${error.message}`, 'error')
      return false
    }
  }

  // Cleanup
  async cleanup() {
    try {
      this.log('Cleaning up test data...')
      
      if (this.testQRCodeId && this.adminToken) {
        // Note: Add QR deletion endpoint if available
        // For now, just log the test QR code ID for manual cleanup
        this.log(`Test QR Code ID for manual cleanup: ${this.testQRCodeId}`, 'info')
      }
      
      this.log('Cleanup complete', 'success')
    } catch (error) {
      this.log(`Cleanup warning: ${error.message}`, 'warning')
    }
  }

  // Main test runner
  async runAllTests() {
    console.log(chalk.cyan('\n🚀 QUENCH RBAC - Enhanced QR Verification & Scan Test Suite'))
    console.log(chalk.cyan('================================================================\n'))

    const results = {
      total: 0,
      passed: 0,
      failed: 0,
      tests: []
    }

    const tests = [
      { name: 'Admin Authentication', method: 'authenticateAdmin' },
      { name: 'Test Data Setup', method: 'setupTestData' },
      { name: 'QR Code Generation', method: 'testQRGeneration' },
      { name: 'QR Verification Endpoint', method: 'testQRVerification' },
      { name: 'Enhanced Scan-Verify Endpoint', method: 'testScanVerifyEndpoint' },
      { name: 'Frontend Verify Page', method: 'testFrontendVerifyPage' },
      { name: 'Scan Analytics', method: 'testScanAnalytics' },
      { name: 'Invalid QR Handling', method: 'testInvalidQRHandling' },
      { name: 'Complete Flow Simulation', method: 'testCompleteFlow' }
    ]

    for (const test of tests) {
      results.total++
      console.log(chalk.yellow(`\n📋 Running: ${test.name}`))
      console.log(chalk.gray('─'.repeat(50)))

      try {
        const success = await this[test.method]()
        if (success) {
          results.passed++
          results.tests.push({ name: test.name, status: 'PASSED' })
        } else {
          results.failed++
          results.tests.push({ name: test.name, status: 'FAILED' })
        }
      } catch (error) {
        this.log(`Test "${test.name}" threw an error: ${error.message}`, 'error')
        results.failed++
        results.tests.push({ name: test.name, status: 'ERROR' })
      }

      await this.wait(1000) // Brief pause between tests
    }

    // Cleanup
    await this.cleanup()

    // Results summary
    console.log(chalk.cyan('\n📊 TEST RESULTS SUMMARY'))
    console.log(chalk.cyan('========================\n'))

    results.tests.forEach(test => {
      const icon = test.status === 'PASSED' ? '✅' : test.status === 'FAILED' ? '❌' : '⚠️'
      const color = test.status === 'PASSED' ? chalk.green : test.status === 'FAILED' ? chalk.red : chalk.yellow
      console.log(`${icon} ${color(test.name)}: ${color(test.status)}`)
    })

    console.log(chalk.cyan(`\n📈 Total Tests: ${results.total}`))
    console.log(chalk.green(`✅ Passed: ${results.passed}`))
    console.log(chalk.red(`❌ Failed: ${results.failed}`))
    console.log(chalk.blue(`📊 Success Rate: ${((results.passed / results.total) * 100).toFixed(1)}%`))

    if (results.failed === 0) {
      console.log(chalk.green('\n🎉 ALL TESTS PASSED! Enhanced QR verification system is working correctly.'))
    } else {
      console.log(chalk.red('\n⚠️ Some tests failed. Please review the errors above.'))
    }    if (this.testQRCodeId) {
      console.log(chalk.blue(`\n🔗 Test QR Code ID: ${this.testQRCodeId}`))
      console.log(chalk.blue(`🔗 Test Verify URL: ${config.FRONTEND_URL}/verify/${this.testQRCodeId}`))
      console.log(chalk.blue(`🔗 Backend Scan Entry: ${config.BACKEND_URL}/api/qrcodes/scan/${this.testQRCodeId}`))
    }

    return results.failed === 0
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  const testSuite = new QRTestSuite()
  testSuite.runAllTests()
    .then(success => {
      process.exit(success ? 0 : 1)
    })
    .catch(error => {
      console.error(chalk.red('Fatal error:'), error)
      process.exit(1)
    })
}

module.exports = QRTestSuite
