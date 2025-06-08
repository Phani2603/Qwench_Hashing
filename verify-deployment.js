#!/usr/bin/env node

const https = require('https');
const http = require('http');

// Deployment URLs
const BACKEND_URL = 'https://quench-rbac-backend-production.up.railway.app';
const FRONTEND_URL = 'https://quench-rbac-frontend-7007f4nez-phani2603s-projects.vercel.app';

console.log('🚀 QUENCH RBAC Deployment Verification');
console.log('=====================================\n');

// Function to make HTTP requests
function makeRequest(url, description) {
    return new Promise((resolve, reject) => {
        const requestModule = url.startsWith('https://') ? https : http;
        
        const request = requestModule.get(url, (response) => {
            let data = '';
            
            response.on('data', (chunk) => {
                data += chunk;
            });
            
            response.on('end', () => {
                resolve({
                    statusCode: response.statusCode,
                    data: data,
                    headers: response.headers
                });
            });
        });
        
        request.on('error', (error) => {
            reject(error);
        });
        
        request.setTimeout(10000, () => {
            request.destroy();
            reject(new Error('Request timeout'));
        });
    });
}

// Test functions
async function testBackendHealth() {
    try {
        console.log('🔍 Testing Backend Health...');
        const response = await makeRequest(`${BACKEND_URL}/api/health`, 'Backend Health Check');
        
        if (response.statusCode === 200) {
            console.log('✅ Backend is healthy and responding');
            console.log(`   Status: ${response.statusCode}`);
            try {
                const healthData = JSON.parse(response.data);
                console.log(`   Message: ${healthData.message || 'API is running'}`);
                if (healthData.database) {
                    console.log(`   Database: ${healthData.database.status || 'Connected'}`);
                }
            } catch (e) {
                console.log(`   Response: ${response.data.substring(0, 100)}...`);
            }
        } else {
            console.log(`❌ Backend health check failed with status: ${response.statusCode}`);
        }
    } catch (error) {
        console.log(`❌ Backend health check failed: ${error.message}`);
    }
    console.log('');
}

async function testFrontend() {
    try {
        console.log('🔍 Testing Frontend...');
        const response = await makeRequest(FRONTEND_URL, 'Frontend Check');
        
        if (response.statusCode === 200) {
            console.log('✅ Frontend is accessible');
            console.log(`   Status: ${response.statusCode}`);
            console.log(`   Content-Type: ${response.headers['content-type'] || 'Not specified'}`);
            
            // Check if it's an HTML response (Next.js app)
            if (response.data.includes('<!DOCTYPE html') || response.data.includes('<html')) {
                console.log('   ✅ Received valid HTML response');
                
                // Check for Next.js indicators
                if (response.data.includes('_next') || response.data.includes('__NEXT_DATA__')) {
                    console.log('   ✅ Next.js application detected');
                }
            }
        } else {
            console.log(`❌ Frontend access failed with status: ${response.statusCode}`);
        }
    } catch (error) {
        console.log(`❌ Frontend access failed: ${error.message}`);
    }
    console.log('');
}

async function testBackendCORS() {
    try {
        console.log('🔍 Testing Backend CORS...');
        // Test a simple API endpoint that should allow CORS
        const response = await makeRequest(`${BACKEND_URL}/api/health`, 'CORS Test');
        
        const corsHeaders = response.headers['access-control-allow-origin'];
        if (corsHeaders) {
            console.log('✅ CORS headers present');
            console.log(`   Access-Control-Allow-Origin: ${corsHeaders}`);
        } else {
            console.log('⚠️  CORS headers not detected (may be set conditionally)');
        }
    } catch (error) {
        console.log(`❌ CORS test failed: ${error.message}`);
    }
    console.log('');
}

async function testDatabaseConnection() {
    try {
        console.log('🔍 Testing Database Connection via Backend...');
        const response = await makeRequest(`${BACKEND_URL}/api/health`, 'Database Connection Test');
        
        if (response.statusCode === 200) {
            try {
                const healthData = JSON.parse(response.data);
                if (healthData.database && healthData.database.status === 'connected') {
                    console.log('✅ Database connection confirmed');
                    console.log(`   MongoDB Status: ${healthData.database.status}`);
                } else {
                    console.log('⚠️  Database status unclear from health endpoint');
                }
            } catch (e) {
                console.log('⚠️  Could not parse health response for database status');
            }
        }
    } catch (error) {
        console.log(`❌ Database connection test failed: ${error.message}`);
    }
    console.log('');
}

// Main verification function
async function runVerification() {
    console.log('Starting deployment verification...\n');
    
    await testBackendHealth();
    await testFrontend();
    await testBackendCORS();
    await testDatabaseConnection();
    
    console.log('🎉 Deployment verification completed!');
    console.log('\n📋 Quick Access:');
    console.log(`   Frontend: ${FRONTEND_URL}`);
    console.log(`   Backend API: ${BACKEND_URL}/api`);
    console.log(`   Admin Login: ${FRONTEND_URL}/login`);
    console.log('\n🔐 Initial Admin Credentials:');
    console.log('   Email: admin@quench.com');
    console.log('   Password: QuenchAdmin2024!');
}

// Run the verification
runVerification().catch(console.error);
