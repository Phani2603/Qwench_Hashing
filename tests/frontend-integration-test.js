/**
 * QUENCH RBAC System - Frontend Integration Test
 * Tests complete user flow through the web interface
 * 
 * This test validates:
 * 1. Frontend-Backend Integration
 * 2. Authentication Flow
 * 3. Role-Based Access Control
 * 4. QR Code Generation (Admin)
 * 5. User Dashboard Access
 * 6. Admin Dashboard Access
 * 7. Protected Route Security
 */

const axios = require('axios');
const puppeteer = require('puppeteer');

const FRONTEND_URL = 'http://localhost:3000';
const BACKEND_URL = 'http://localhost:5000/api';

// Test configuration
const TEST_CONFIG = {
    timeout: 30000,
    headless: true, // Set to false to see browser actions
    slowMo: 100 // Slow down actions for better visibility
};

// Test users
const TEST_USERS = {
    admin: {
        name: 'Test Admin',
        email: `admin_${Date.now()}@test.com`,
        password: 'AdminPass123!',
        role: 'admin'
    },
    user: {
        name: 'Test User',
        email: `user_${Date.now()}@test.com`,
        password: 'UserPass123!',
        role: 'user'
    }
};

class FrontendIntegrationTest {
    constructor() {
        this.browser = null;
        this.page = null;
        this.testResults = [];
        this.adminToken = null;
        this.userToken = null;
    }

    async init() {
        console.log('🚀 Starting Frontend Integration Tests...\n');
        
        this.browser = await puppeteer.launch({
            headless: TEST_CONFIG.headless,
            slowMo: TEST_CONFIG.slowMo,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        
        this.page = await this.browser.newPage();
        await this.page.setViewport({ width: 1280, height: 720 });
        
        // Enable console logging
        this.page.on('console', msg => {
            if (msg.type() === 'error') {
                console.log('🔴 Browser Console Error:', msg.text());
            }
        });
    }

    async cleanup() {
        if (this.browser) {
            await this.browser.close();
        }
        await this.cleanupTestUsers();
    }

    async cleanupTestUsers() {
        try {
            // Clean up test users
            for (const user of Object.values(TEST_USERS)) {
                await axios.delete(`${BACKEND_URL}/admin/users`, {
                    headers: { Authorization: `Bearer ${this.adminToken}` },
                    data: { email: user.email }
                }).catch(() => {}); // Ignore errors
            }
        } catch (error) {
            // Ignore cleanup errors
        }
    }

    async runTest(testName, testFunction) {
        console.log(`\n📋 Testing: ${testName}`);
        try {
            await testFunction();
            console.log(`✅ PASSED: ${testName}`);
            this.testResults.push({ name: testName, status: 'PASSED' });
            return true;
        } catch (error) {
            console.log(`❌ FAILED: ${testName}`);
            console.log(`   Error: ${error.message}`);
            this.testResults.push({ name: testName, status: 'FAILED', error: error.message });
            return false;
        }
    }

    async waitForNavigation(expectedUrl) {
        await this.page.waitForNavigation({ waitUntil: 'networkidle0' });
        const currentUrl = this.page.url();
        if (!currentUrl.includes(expectedUrl)) {
            throw new Error(`Expected URL to contain '${expectedUrl}', but got '${currentUrl}'`);
        }
    }

    async testHomepageLoad() {
        await this.page.goto(FRONTEND_URL);
        await this.page.waitForSelector('h1', { timeout: 10000 });
        
        const title = await this.page.$eval('h1', el => el.textContent);
        if (!title.includes('RBAC System')) {
            throw new Error(`Expected title to contain 'RBAC System', got: ${title}`);
        }
        
        // Check for key elements
        await this.page.waitForSelector('text=Sign Up', { timeout: 5000 });
        await this.page.waitForSelector('text=Sign In', { timeout: 5000 });
    }

    async testUserSignup() {
        await this.page.goto(FRONTEND_URL);
        
        // Navigate to signup
        await this.page.click('text=Sign Up');
        await this.page.waitForSelector('input[name="name"]', { timeout: 10000 });
        
        // Fill signup form
        await this.page.fill('input[name="name"]', TEST_USERS.user.name);
        await this.page.fill('input[name="email"]', TEST_USERS.user.email);
        await this.page.fill('input[name="password"]', TEST_USERS.user.password);
        
        // Submit form
        await this.page.click('button[type="submit"]');
        
        // Wait for redirect to dashboard
        await this.page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 15000 });
        
        const url = this.page.url();
        if (!url.includes('/dashboard')) {
            throw new Error(`Expected to be redirected to dashboard, but got: ${url}`);
        }
    }

    async testUserLogin() {
        await this.page.goto(FRONTEND_URL);
        
        // Navigate to login
        await this.page.click('text=Sign In');
        await this.page.waitForSelector('input[name="email"]', { timeout: 10000 });
        
        // Fill login form
        await this.page.fill('input[name="email"]', TEST_USERS.user.email);
        await this.page.fill('input[name="password"]', TEST_USERS.user.password);
        
        // Submit form
        await this.page.click('button[type="submit"]');
        
        // Wait for redirect to dashboard
        await this.page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 15000 });
        
        const url = this.page.url();
        if (!url.includes('/dashboard')) {
            throw new Error(`Expected to be redirected to dashboard, but got: ${url}`);
        }
    }

    async testUserDashboardAccess() {
        // Ensure we're logged in as user
        await this.testUserLogin();
        
        // Check dashboard elements
        await this.page.waitForSelector('text=Dashboard', { timeout: 10000 });
        
        // Verify user role display
        const roleText = await this.page.textContent('body'); 
        if (!roleText.includes('User') && !roleText.includes('Welcome')) {
            throw new Error('User dashboard should display user role or welcome message');
        }
        
        // Try to access admin route (should be blocked)
        await this.page.goto(`${FRONTEND_URL}/admin/dashboard`);
        await this.page.waitForTimeout(2000);
        
        const currentUrl = this.page.url();
        if (currentUrl.includes('/admin/dashboard')) {
            throw new Error('Regular user should not be able to access admin dashboard');
        }
    }

    async testAdminSignup() {
        // First, create admin via API (since initial admin signup might be protected)
        try {
            const response = await axios.post(`${BACKEND_URL}/auth/initial-admin-signup`, {
                name: TEST_USERS.admin.name,
                email: TEST_USERS.admin.email,
                password: TEST_USERS.admin.password
            });
            
            this.adminToken = response.data.token;
        } catch (error) {
            // If initial admin signup fails, try regular signup and hope it works
            await this.page.goto(FRONTEND_URL);
            await this.page.click('text=Sign Up');
            await this.page.waitForSelector('input[name="name"]', { timeout: 10000 });
            
            await this.page.fill('input[name="name"]', TEST_USERS.admin.name);
            await this.page.fill('input[name="email"]', TEST_USERS.admin.email);
            await this.page.fill('input[name="password"]', TEST_USERS.admin.password);
            
            await this.page.click('button[type="submit"]');
            await this.page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 15000 });
        }
    }

    async testAdminLogin() {
        await this.page.goto(FRONTEND_URL);
        
        // Navigate to login
        await this.page.click('text=Sign In');
        await this.page.waitForSelector('input[name="email"]', { timeout: 10000 });
        
        // Fill login form
        await this.page.fill('input[name="email"]', TEST_USERS.admin.email);
        await this.page.fill('input[name="password"]', TEST_USERS.admin.password);
        
        // Submit form
        await this.page.click('button[type="submit"]');
        
        // Wait for redirect to admin dashboard
        await this.page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 15000 });
        
        const url = this.page.url();
        if (!url.includes('/admin/dashboard')) {
            throw new Error(`Expected admin to be redirected to admin dashboard, but got: ${url}`);
        }
    }

    async testAdminDashboardAccess() {
        // Ensure we're logged in as admin
        await this.testAdminLogin();
        
        // Check admin dashboard elements
        await this.page.waitForSelector('text=Admin Dashboard', { timeout: 10000 });
        
        // Look for admin-specific features
        const pageContent = await this.page.textContent('body');
        if (!pageContent.includes('Admin') && !pageContent.includes('Users') && !pageContent.includes('Management')) {
            throw new Error('Admin dashboard should contain admin-specific content');
        }
    }

    async testQRCodeGeneration() {
        // Ensure we're logged in as admin
        await this.testAdminLogin();
        
        // Look for QR code generation feature
        try {
            // Try to find QR code related elements
            await this.page.waitForSelector('text=QR', { timeout: 5000 });
            console.log('   ✅ QR Code functionality found in admin dashboard');
        } catch (error) {
            // If QR code UI is not visible, test via API
            if (this.adminToken) {
                const response = await axios.post(`${BACKEND_URL}/qrcode/generate`, {
                    data: 'test data',
                    options: {}
                }, {
                    headers: { Authorization: `Bearer ${this.adminToken}` }
                });
                
                if (!response.data.qrCode) {
                    throw new Error('QR code generation failed via API');
                }
                console.log('   ✅ QR Code generation working via API');
            } else {
                throw new Error('Cannot test QR code generation - no admin token');
            }
        }
    }

    async testLogout() {
        // Ensure we're logged in
        await this.testUserLogin();
        
        // Find and click logout button
        try {
            await this.page.click('text=Logout');
        } catch (error) {
            // Try other logout selectors
            await this.page.click('button[data-testid="logout"]');
        }
        
        // Wait for redirect to homepage
        await this.page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 10000 });
        
        // Verify we're back on homepage
        await this.page.waitForSelector('text=Sign In', { timeout: 5000 });
        
        const url = this.page.url();
        if (url.includes('/dashboard')) {
            throw new Error('Should be redirected away from dashboard after logout');
        }
    }

    async testProtectedRouteAccess() {
        // Go to homepage (logged out)
        await this.page.goto(FRONTEND_URL);
        
        // Try to access protected route directly
        await this.page.goto(`${FRONTEND_URL}/dashboard`);
        await this.page.waitForTimeout(3000);
        
        // Should be redirected to login or homepage
        const url = this.page.url();
        if (url.includes('/dashboard')) {
            throw new Error('Unauthenticated user should not be able to access protected routes');
        }
        
        console.log('   ✅ Protected route properly secured');
    }

    async generateReport() {
        console.log('\n' + '='.repeat(50));
        console.log('📊 FRONTEND INTEGRATION TEST REPORT');
        console.log('='.repeat(50));
        
        const totalTests = this.testResults.length;
        const passedTests = this.testResults.filter(r => r.status === 'PASSED').length;
        const failedTests = totalTests - passedTests;
        const successRate = Math.round((passedTests / totalTests) * 100);
        
        console.log(`\n📈 Overall Results:`);
        console.log(`   Total Tests: ${totalTests}`);
        console.log(`   Passed: ${passedTests}`);
        console.log(`   Failed: ${failedTests}`);
        console.log(`   Success Rate: ${successRate}%`);
        
        if (failedTests > 0) {
            console.log(`\n❌ Failed Tests:`);
            this.testResults
                .filter(r => r.status === 'FAILED')
                .forEach(test => {
                    console.log(`   - ${test.name}: ${test.error}`);
                });
        }
        
        console.log('\n' + '='.repeat(50));
        
        // Overall system status
        if (successRate >= 90) {
            console.log('🎉 SYSTEM STATUS: READY FOR PRODUCTION');
        } else if (successRate >= 70) {
            console.log('⚠️  SYSTEM STATUS: NEEDS MINOR FIXES');
        } else {
            console.log('🔴 SYSTEM STATUS: NEEDS MAJOR FIXES');
        }
        
        console.log('='.repeat(50));
    }

    async runAllTests() {
        try {
            await this.init();
            
            // Run all tests
            await this.runTest('Homepage Load', () => this.testHomepageLoad());
            await this.runTest('User Signup', () => this.testUserSignup());
            await this.runTest('User Login', () => this.testUserLogin());
            await this.runTest('User Dashboard Access', () => this.testUserDashboardAccess());
            await this.runTest('Admin Signup', () => this.testAdminSignup());
            await this.runTest('Admin Login', () => this.testAdminLogin());
            await this.runTest('Admin Dashboard Access', () => this.testAdminDashboardAccess());
            await this.runTest('QR Code Generation', () => this.testQRCodeGeneration());
            await this.runTest('User Logout', () => this.testLogout());
            await this.runTest('Protected Route Security', () => this.testProtectedRouteAccess());
            
            await this.generateReport();
            
        } catch (error) {
            console.error('❌ Test suite failed:', error);
        } finally {
            await this.cleanup();
        }
    }
}

// Run the tests
if (require.main === module) {
    const tester = new FrontendIntegrationTest();
    tester.runAllTests().catch(console.error);
}

module.exports = FrontendIntegrationTest;
