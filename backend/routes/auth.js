const express = require("express")
const jwt = require("jsonwebtoken")
const User = require("../models/User")
const { authenticate } = require("../middleware/auth")
const { 
  validateUserRegistration, 
  validateUserLogin 
} = require("../middleware/validation")

const router = express.Router()

// Generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  })
}

// Register user (Fix #5: Input Validation)
router.post("/signup", validateUserRegistration, async (req, res) => {
  try {
    const { name, email, password } = req.body

    // Check if user already exists
    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User with this email already exists",
      })
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      role: "user",
    })

    // Create an audit log for user registration
    const { AuditLog } = require("../models/SystemSettings")
    await AuditLog.create({
      userEmail: email,
      action: "User Registration",
      resource: "User",
      resourceId: user._id.toString(),
      details: {
        name: name,
        role: "user"
      },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
    });

    // Generate token
    const token = generateToken(user._id)

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    })
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    })
  }
})

// Login user (Fix #5: Input Validation)
router.post("/login", validateUserLogin, async (req, res) => {
  try {
    const { email, password } = req.body

    // Check if user exists
    const user = await User.findOne({ email })
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      })
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password)
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      })
    }

    // Update last login
    user.lastLogin = new Date()
    await user.save()

    // Create an audit log for user login
    const { AuditLog } = require("../models/SystemSettings")
    await AuditLog.create({
      userEmail: email,
      action: "User Login",
      resource: "User",
      resourceId: user._id.toString(),
      details: {
        role: user.role
      },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
    });

    // Generate token
    const token = generateToken(user._id)

    res.json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        lastLogin: user.lastLogin,
      },
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    })
  }
})

// Initial admin signup (one-time only) (Fix #5: Input Validation)
router.post("/initial-admin-signup", validateUserRegistration, async (req, res) => {
  try {
    // Check if any admin already exists
    const existingAdmin = await User.findOne({ role: "admin" })
    if (existingAdmin) {
      return res.status(400).json({
        success: false,
        message: "Admin user already exists. Use regular signup.",
      })
    }

    const { name, email, password } = req.body

    // Check if user with email exists
    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User with this email already exists",
      })
    }

    // Create admin user
    const adminUser = await User.create({
      name,
      email,
      password,
      role: "admin",
    })

    // Create an audit log for initial admin setup
    const { AuditLog } = require("../models/SystemSettings")
    await AuditLog.create({
      userEmail: email,
      action: "Initial Admin Setup",
      resource: "User",
      resourceId: adminUser._id.toString(),
      details: {
        name: name,
        role: "admin",
        isFirstAdmin: true
      },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
    });

    // Generate token
    const token = generateToken(adminUser._id)

    res.status(201).json({
      success: true,
      message: "Initial admin created successfully",
      token,
      user: {
        id: adminUser._id,
        name: adminUser.name,
        email: adminUser.email,
        role: adminUser.role,
      },
    })
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    })
  }
})

// Get current user
router.get("/me", authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password")

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      })
    }

    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt,
        preferences: user.preferences,
      },
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    })
  }
})

// Check if initial admin setup is needed
router.get("/check-initial-setup", async (req, res) => {
  try {
    const adminExists = await User.findOne({ role: "admin" })

    res.json({
      success: true,
      needsInitialSetup: !adminExists,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    })
  }
})

// Refresh token
router.post("/refresh", authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password")

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      })
    }

    // Generate new token
    const token = generateToken(user._id)

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        lastLogin: user.lastLogin,
      },
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    })
  }
})

module.exports = router
