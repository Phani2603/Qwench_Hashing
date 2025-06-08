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

// Serve static files (QR codes)
app.use("/qrcodes", express.static(path.join(__dirname, "public/qrcodes")))

// Routes
app.use("/api/auth", require("./routes/auth"))
app.use("/api/user", require("./routes/user"))
app.use("/api/admin", require("./routes/admin"))
app.use("/api/qrcodes", require("./routes/qrcode"))
app.use("/api/categories", require("./routes/category"))
app.use("/api/scans", require("./routes/scan"))
app.use("/api/admin/analytics", require("./routes/admin-analytics"))

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "Server is running",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  })
})

// Debug endpoint to test deployment
app.get("/api/debug", (req, res) => {
  res.json({
    success: true,
    message: "Debug endpoint working - Routes should be loading",
    timestamp: new Date().toISOString(),
    deploymentVersion: "v2.0-route-fix",
    routesRegistered: [
      "/api/auth",
      "/api/user", 
      "/api/admin",
      "/api/qrcodes",
      "/api/categories",
      "/api/scans"
    ]
  })
})

// CORS Debug endpoint
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
