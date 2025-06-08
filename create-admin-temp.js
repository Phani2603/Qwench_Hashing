/**
 * Temporary script to create initial admin with hardcoded production values
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Set environment variables directly
process.env.MONGODB_URI = 'mongodb+srv://phanisrikarkusumba:sinema123@cluster0.vuqmhtp.mongodb.net/rbac_project?retryWrites=true&w=majority&appName=Cluster0';
process.env.INITIAL_ADMIN_EMAIL = 'admin@quench.com';
process.env.INITIAL_ADMIN_PASSWORD = 'QuenchAdmin2024!';

// User model
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  isActive: { type: Boolean, default: true },
  lastLogin: { type: Date },
  phone: { type: String },
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
    console.log('🚀 QUENCH RBAC - Creating Initial Admin...\n');

    // Connect to MongoDB
    console.log('📊 Connecting to MongoDB Atlas...');
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
      
      if (existingAdmin.role !== 'admin') {
        console.log('\n🔧 Updating existing user to admin role...');
        existingAdmin.role = 'admin';
        await existingAdmin.save();
        console.log('✅ User role updated to admin successfully');
      }
      
      console.log('\n✅ Admin setup complete!');
      return;
    }

    // Create admin user
    console.log('👤 Creating initial admin user...');
    
    const adminData = {
      name: 'System Administrator',
      email: process.env.INITIAL_ADMIN_EMAIL,
      password: process.env.INITIAL_ADMIN_PASSWORD,
      role: 'admin',
      isActive: true,
      phone: '+1234567890'
    };

    const adminUser = new User(adminData);
    await adminUser.save();

    console.log('✅ Initial admin user created successfully!');
    console.log('\n📋 Admin Details:');
    console.log(`   Name: ${adminUser.name}`);
    console.log(`   Email: ${adminUser.email}`);
    console.log(`   Role: ${adminUser.role}`);
    console.log(`   Phone: ${adminUser.phone}`);
    console.log(`   User ID: ${adminUser._id}`);
    console.log(`   Created: ${adminUser.createdAt}`);

    console.log('\n🔐 Login Credentials:');
    console.log(`   Email: ${process.env.INITIAL_ADMIN_EMAIL}`);
    console.log(`   Password: ${process.env.INITIAL_ADMIN_PASSWORD}`);

    console.log('\n🎉 Initial admin setup completed successfully!');
    console.log('   You can now log in to the admin panel at:');
    console.log('   https://quench-rbac-frontend-7007f4nez-phani2603s-projects.vercel.app/login');

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

// Run the script
createInitialAdmin().catch(console.error);
