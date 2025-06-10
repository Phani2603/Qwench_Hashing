const express = require("express")
const mongoose = require("mongoose")
const cors = require("cors")
const path = require("path")
require("dotenv").config()

const app = express()

// CORS Configuration for Production (Enhanced Fix)
const corsOrigins = process.env.NODE_ENV === 'production' 
  ? [
      process.env.CORS_ORIGIN, 
      process.env.FRONTEND_URL,
      'https://quench-rbac-frontend.vercel.app',
      'https://quench-rbac-frontend-git-master-phani2603.vercel.app',
      'https://quench-rbac-frontend-phani2603.vercel.app',
      'https://quench-rbac-frontend-phani2603s-projects.vercel.app',
      'https://quench-rbac-frontend-phani2603-phani2603s-projects.vercel.app'
    ].filter(Boolean) // Remove any undefined values
  : ['http://localhost:3000', 'http://localhost:3001'];

console.log('CORS Origins configured:', corsOrigins);
console.log('Environment:', process.env.NODE_ENV);
console.log('CORS_ORIGIN:', process.env.CORS_ORIGIN);

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, curl, or Postman)
    if (!origin) return callback(null, true);
    
    console.log('CORS request from origin:', origin);
    
    // Check exact matches first
    if (corsOrigins.indexOf(origin) !== -1) {
      console.log('CORS: Origin allowed (exact match)');
      return callback(null, true);
    }
    
    // For development, allow any localhost
    if (process.env.NODE_ENV !== 'production' && origin.includes('localhost')) {
      console.log('CORS: Origin allowed (localhost in development)');
      return callback(null, true);
    }
    
    // For production, also allow any vercel.app subdomain as fallback
    if (process.env.NODE_ENV === 'production' && origin.includes('vercel.app')) {
      console.log('CORS: Origin allowed (vercel.app domain)');
      return callback(null, true);
    }
    
    console.log('CORS: Origin blocked -', origin);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'X-Requested-With',
    'Access-Control-Allow-Origin',
    'Access-Control-Allow-Headers',
    'Origin',
    'Accept'
  ],
  exposedHeaders: ['Content-Length'],
  maxAge: 86400 // 24 hours
};

// Middleware
app.use(cors(corsOptions))

// Handle preflight requests explicitly
app.options('*', cors(corsOptions));

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Note: QR code images are now served via GridFS endpoints in the qrcode routes
// No longer need static file serving for /qrcodes

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "Server is running",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  })
})

// API status endpoint
app.get("/api/status", (req, res) => {
  res.json({
    success: true,
    message: "API is running",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    endpoints: [
      '/api/auth/login',
      '/api/auth/register', 
      '/api/qrcodes/generate',
      '/api/qrcodes/verify/:codeId',
      '/api/qrcodes/stats',
      '/api/qrcodes/image/:codeId'
    ]
  });
});

// Debug endpoint to test deployment (MOVED BEFORE ROUTES)
app.get("/api/debug", (req, res) => {
  res.json({
    success: true,
    message: "Debug endpoint working - After syntax fix and route reordering",
    timestamp: new Date().toISOString(),
    deploymentVersion: "v5.0-full-route-fix",
    server: "Railway deployment with full routes enabled",
    routesActive: "ALL ROUTES ENABLED"
  })
})

// CORS Debug endpoint (MOVED BEFORE ROUTES)
app.get("/api/cors-test", (req, res) => {
  res.json({
    success: true,
    message: "CORS is working",
    origin: req.headers.origin,
    corsOrigins: corsOrigins,
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString()
  })
})

// Routes - with error handling
console.log("Loading routes...")

// Auth routes
try {
  app.use("/api/auth", require("./routes/auth"))
  console.log("✅ Auth routes loaded")
} catch (error) {
  console.error("❌ Error loading auth routes:", error.message)
}

// User routes
try {
  app.use("/api/user", require("./routes/user"))
  console.log("✅ User routes loaded")
} catch (error) {
  console.error("❌ Error loading user routes:", error.message)
}

// Admin routes
try {
  app.use("/api/admin", require("./routes/admin"))
  console.log("✅ Admin routes loaded")
} catch (error) {
  console.error("❌ Error loading admin routes:", error.message)
}

// QR code routes
try {
  app.use("/api/qrcodes", require("./routes/qrcode"))
  console.log("✅ QR code routes loaded")
} catch (error) {
  console.error("❌ Error loading QR code routes:", error.message)
}

// Category routes
try {
  app.use("/api/categories", require("./routes/category"))
  console.log("✅ Category routes loaded")
} catch (error) {
  console.error("❌ Error loading category routes:", error.message)
}

// Scan routes
try {
  app.use("/api/scans", require("./routes/scan"))
  console.log("✅ Scan routes loaded")
} catch (error) {
  console.error("❌ Error loading scan routes:", error.message)
}

// Admin analytics routes
try {
  app.use("/api/admin/analytics", require("./routes/admin-analytics"))
  console.log("✅ Admin analytics routes loaded")
} catch (error) {
  console.error("❌ Error loading admin analytics routes:", error.message)
}

// User analytics routes
try {
  app.use("/api/analytics", require("./routes/analytics"))
  console.log("✅ User analytics routes loaded")
} catch (error) {
  console.error("❌ Error loading user analytics routes:", error.message)
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({
    success: false,
    message: "Something went wrong!",
    error: process.env.NODE_ENV === "development" ? err.message : "Internal server error",
  })
})

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  })
})

// Database connection
mongoose
  .connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log("✅ Connected to MongoDB Atlas")
    console.log("📍 Database:", mongoose.connection.name)
    
    // Initialize GridFS for QR code storage
    try {
      const { initGridFS } = require('./utils/gridfs');
      initGridFS();
      console.log("✅ GridFS initialized successfully for QR code storage");
    } catch (error) {
      console.error("❌ GridFS initialization failed:", error.message);
      console.error("❌ This will affect QR code image storage functionality");
    }

    // Initialize Email Service
    try {
      const { verifyEmailConnection } = require('./utils/emailService');
      const emailConnected = await verifyEmailConnection();
      if (emailConnected) {
        console.log("✅ Email service initialized successfully (Gmail)");
      } else {
        console.log("⚠️  Email service running in simulation mode");
        console.log("   Add Gmail credentials to enable real email sending");
      }
    } catch (error) {
      console.error("❌ Email service initialization failed:", error.message);
      console.error("❌ Emails will use simulation mode only");
    }

    // Start server
    const PORT = process.env.PORT || 5000
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`)
      console.log(`🌍 Environment: ${process.env.NODE_ENV || "development"}`)
      console.log(`🔗 Frontend URL: ${process.env.FRONTEND_URL || "http://localhost:3000"}`)
      console.log(`📡 API Status: /api/status`)
      console.log(`❤️ Health Check: /api/health`)
    })
  })
  .catch((error) => {
    console.error("❌ MongoDB connection error:", error)
    process.exit(1)
  })

// MongoDB connection event handlers
mongoose.connection.on('error', (err) => {
  console.error('❌ MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('⚠️ MongoDB disconnected');
});

mongoose.connection.on('reconnected', () => {
  console.log('✅ MongoDB reconnected');
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM received, shutting down gracefully")
  mongoose.connection.close(() => {
    console.log("MongoDB connection closed")
    process.exit(0)
  })
})

process.on("SIGINT", () => {
  console.log("SIGINT received, shutting down gracefully")
  mongoose.connection.close(() => {
    console.log("MongoDB connection closed")
    process.exit(0)
  })
})
