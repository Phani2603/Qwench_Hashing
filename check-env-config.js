#!/usr/bin/env node

/**
 * Environment Configuration Checker
 * This script verifies the environment configuration and helps identify any issues
 */

const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

console.log('🔍 QUENCH RBAC Environment Configuration Checker');
console.log('=================================================');

// Check which environment files exist
const envFiles = [
  { path: '.env.local', purpose: 'Local development' },
  { path: '.env.production', purpose: 'Production builds' },
  { path: '.env.development', purpose: 'Development builds' },
  { path: 'backend/.env', purpose: 'Backend configuration' }
];

console.log('\n📁 Environment Files:');
console.log('-------------------');

envFiles.forEach(file => {
  if (fs.existsSync(path.join(process.cwd(), file.path))) {
    console.log(`✅ ${file.path} (${file.purpose})`);
    
    // Parse and show keys (not values for security)
    const envContent = dotenv.parse(fs.readFileSync(path.join(process.cwd(), file.path)));
    console.log(`   Keys: ${Object.keys(envContent).join(', ')}`);
  } else {
    console.log(`❌ ${file.path} (${file.purpose}) - Not found`);
  }
});

// Check current environment
console.log('\n🌐 Current Environment:');
console.log('-------------------');
console.log(`🔹 NODE_ENV: ${process.env.NODE_ENV || 'not set'}`);
console.log(`🔹 NEXT_PUBLIC_API_URL: ${process.env.NEXT_PUBLIC_API_URL || 'not set'}`);
console.log(`🔹 NEXT_PUBLIC_APP_URL: ${process.env.NEXT_PUBLIC_APP_URL || 'not set'}`);

// Recommendations
console.log('\n📝 Recommendations:');
console.log('-------------------');
console.log('1. For production:');
console.log('   - Deploy with NODE_ENV=production');
console.log('   - Set environment variables in Vercel/Railway dashboards');
console.log('   - Ensure .env.production has correct configuration');
console.log('\n2. For local development:');
console.log('   - Use .env.local for development settings');
console.log('   - Never use .env.local values in production');

console.log('\n=================================================');
