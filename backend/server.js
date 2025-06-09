const express = require("express")
const mongoose = require("mongoose")
const cors = require("cors")
const path = require("path")
require("dotenv").config()

const app = express()

// CORS Configuration for Production (Fix #3)
const corsOrigins = process.env.NODE_ENV === 'production' 
  ? [
      process.env.CORS_ORIGIN, 
      process.env.FRONTEND_URL,
      'https://quench-rbac-frontend-phani2603s-projects.vercel.app',
      'https://quench-rbac-frontend.vercel.app',
      'https://quench-rbac-frontend-phani2603-phani2603s-projects.vercel.app'
    ].filter(Boolean) // Remove any undefined values
  : ['http://localhost:3000', 'http://localhost:3001'];

console.log('CORS Origins configured:', corsOrigins);
console.log('Environment:', process.env.NODE_ENV);
console.log('CORS_ORIGIN:', process.env.CORS_ORIGIN);

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    console.log('CORS request from origin:', origin);
    
    if (corsOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV !== 'production') {
      console.log('CORS: Origin allowed');
      callback(null, true);
    } else {
      console.log('CORS: Origin blocked');
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

// Middleware
app.use(cors(corsOptions))
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
  .then(() => {
    console.log("Connected to MongoDB Atlas")
    
    // Initialize GridFS for QR code storage
    try {
      const { initGridFS } = require('./utils/gridfs');
      initGridFS();
      console.log("✅ GridFS initialized for QR code storage");
    } catch (error) {
      console.error("❌ Error initializing GridFS:", error.message);
    }

    // Start server
    const PORT = process.env.PORT || 5000
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`)
      console.log(`Environment: ${process.env.NODE_ENV || "development"}`)
      console.log(`Frontend URL: ${process.env.FRONTEND_URL || "http://localhost:3000"}`)
    })
  })
  .catch((error) => {
    console.error("MongoDB connection error:", error)
    process.exit(1)
  })

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
