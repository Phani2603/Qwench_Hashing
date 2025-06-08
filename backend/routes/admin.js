const express = require("express")
const User = require("../models/User")
const { authenticate, isAdmin } = require("../middleware/auth")
const { validateRoleUpdate } = require("../middleware/validation")

const router = express.Router()

// Dashboard stats endpoint (admin only)
router.get("/dashboard/stats", authenticate, isAdmin, async (req, res) => {
  try {
    // Count total users
    const totalUsers = await User.countDocuments()

    // Count admin users
    const adminUsers = await User.countDocuments({ role: "admin" })

    // Count regular users
    const regularUsers = await User.countDocuments({ role: "user" })

    res.json({
      success: true,
      totalUsers,
      adminUsers,
      regularUsers,
      systemStatus: "Online", // This could come from a monitoring system in a real app
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    })
  }
})

// Get all users (admin only)
router.get("/users", authenticate, isAdmin, async (req, res) => {
  try {
    const users = await User.find({}).select("-password").sort({ createdAt: -1 })
    res.json({
      success: true,
      users,
      count: users.length,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    })
  }
})

// Get user details with website URLs (admin only)
router.get("/users/:userId", authenticate, isAdmin, async (req, res) => {
  try {
    const { userId } = req.params
    const user = await User.findById(userId).select("-password")

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      })
    }

    res.json({
      success: true,
      user,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    })
  }
})

// Update user role (admin only) (Fix #5: Input Validation)
router.put("/users/:userId/role", authenticate, isAdmin, validateRoleUpdate, async (req, res) => {
  try {
    const { userId } = req.params
    const { role } = req.body

    // Validate role
    if (!["user", "admin"].includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Invalid role. Must be 'user' or 'admin'",
      })
    }

    // Prevent admin from changing their own role
    if (userId === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: "You cannot change your own role",
      })
    }

    // Get the user before update to log the previous role
    const user = await User.findById(userId);
    const previousRole = user ? user.role : 'unknown';

    // Update user role
    const updatedUser = await User.findByIdAndUpdate(userId, { role }, { new: true, runValidators: true })

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      })
    }

    // Create an audit log for role update
    const { AuditLog } = require("../models/SystemSettings")
    await AuditLog.create({
      userEmail: req.user.email,  // Admin who made the change
      action: "User Role Update",
      resource: "User",
      resourceId: userId,
      details: {
        targetUser: updatedUser.email,
        previousRole: previousRole,
        newRole: role
      },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
    });

    res.json({
      success: true,
      message: `User role updated to ${role}`,
      user: {
        id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
      },
    })
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    })
  }
})

// Delete user (admin only)
router.delete("/users/:userId", authenticate, isAdmin, async (req, res) => {
  try {
    const { userId } = req.params

    // Prevent admin from deleting themselves
    if (userId === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: "You cannot delete your own account",
      })
    }

    // Delete user
    const deletedUser = await User.findByIdAndDelete(userId)

    if (!deletedUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      })
    }

    // Create an audit log for user deletion
    const { AuditLog } = require("../models/SystemSettings")
    await AuditLog.create({
      userEmail: req.user.email,  // Admin who made the change
      action: "User Deletion",
      resource: "User",
      resourceId: userId,
      details: {
        deletedUserEmail: deletedUser.email,
        deletedUserName: deletedUser.name,
        deletedUserRole: deletedUser.role
      },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
    });

    res.json({
      success: true,
      message: "User deleted successfully",
      deletedUser: {
        id: deletedUser._id,
        name: deletedUser.name,
        email: deletedUser.email,
      },
    })
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    })
  }
})

// Get admin dashboard stats
router.get("/dashboard", authenticate, isAdmin, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments()
    const adminCount = await User.countDocuments({ role: "admin" })
    const userCount = await User.countDocuments({ role: "user" })

    res.json({
      success: true,
      message: "Welcome to admin dashboard",
      stats: {
        totalUsers,
        adminCount,
        userCount,
      },
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
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
