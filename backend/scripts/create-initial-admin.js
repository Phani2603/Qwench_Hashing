/**
 * QUENCH RBAC System - Initial Admin Creation Script
 * 
 * This script creates the initial admin user for production deployment.
 * Run this script after deploying to production to set up the admin account.
 * 
 * Usage: node backend/scripts/create-initial-admin.js
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// User model (inline for simplicity)
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  isActive: { type: Boolean, default: true },
  lastLogin: { type: Date },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

const User = mongoose.model('User', userSchema);

async function createInitialAdmin() {
  try {
    console.log('🚀 Starting Initial Admin Creation Process...\n');

    // Check required environment variables
    const requiredEnvVars = ['MONGODB_URI', 'INITIAL_ADMIN_EMAIL', 'INITIAL_ADMIN_PASSWORD'];
    const missing = requiredEnvVars.filter(varName => !process.env[varName]);
    
    if (missing.length > 0) {
      throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }

    // Connect to MongoDB
    console.log('📊 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB successfully\n');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ 
      email: process.env.INITIAL_ADMIN_EMAIL 
    });

    if (existingAdmin) {
      console.log('⚠️  Admin user already exists!');
      console.log(`   Email: ${existingAdmin.email}`);
      console.log(`   Role: ${existingAdmin.role}`);
      console.log(`   Created: ${existingAdmin.createdAt}`);
      
      if (existingAdmin.role !== 'admin') {
        console.log('\n🔧 Updating existing user to admin role...');
        existingAdmin.role = 'admin';
        await existingAdmin.save();
        console.log('✅ User role updated to admin successfully');
      }
      
      console.log('\n✅ Initial admin setup complete!');
      return;
    }

    // Create admin user
    console.log('👤 Creating initial admin user...');
    
    const adminData = {
      name: 'System Administrator',
      email: process.env.INITIAL_ADMIN_EMAIL,
      password: process.env.INITIAL_ADMIN_PASSWORD,
      role: 'admin',
      isActive: true
    };

    const adminUser = new User(adminData);
    await adminUser.save();

    console.log('✅ Initial admin user created successfully!');
    console.log('\n📋 Admin Details:');
    console.log(`   Name: ${adminUser.name}`);
    console.log(`   Email: ${adminUser.email}`);
    console.log(`   Role: ${adminUser.role}`);
    console.log(`   User ID: ${adminUser._id}`);
    console.log(`   Created: ${adminUser.createdAt}`);

    console.log('\n🔐 SECURITY NOTICE:');
    console.log('   ⚠️  Remember to change the admin password after first login!');
    console.log('   ⚠️  Remove INITIAL_ADMIN_* variables from production environment!');
    console.log('   ⚠️  Enable 2FA if implementing additional security measures!');

    console.log('\n🎉 Initial admin setup completed successfully!');
    console.log('   You can now log in to the admin panel with these credentials.');

  } catch (error) {
    console.error('❌ Error creating initial admin:', error.message);
    
    if (error.code === 11000) {
      console.error('   This email address is already registered.');
    }
    
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\n📊 Disconnected from MongoDB');
  }
}

// Validation function
function validateEnvironmentVariables() {
  const email = process.env.INITIAL_ADMIN_EMAIL;
  const password = process.env.INITIAL_ADMIN_PASSWORD;

  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new Error('Invalid email format for INITIAL_ADMIN_EMAIL');
  }

  // Password validation
  if (password.length < 8) {
    throw new Error('INITIAL_ADMIN_PASSWORD must be at least 8 characters long');
  }

  if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/.test(password)) {
    throw new Error('INITIAL_ADMIN_PASSWORD must contain uppercase, lowercase, number, and special character');
  }

  console.log('✅ Environment variables validated successfully');
}

// Main execution
if (require.main === module) {
  console.log('═'.repeat(60));
  console.log('🛡️  QUENCH RBAC - INITIAL ADMIN SETUP');
  console.log('═'.repeat(60));
  
  try {
    validateEnvironmentVariables();
    createInitialAdmin().catch(console.error);
  } catch (error) {
    console.error('❌ Validation Error:', error.message);
    process.exit(1);
  }
}

module.exports = { createInitialAdmin, User };
