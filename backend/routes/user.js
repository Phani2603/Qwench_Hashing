const express = require("express")
const User = require("../models/User")
const { authenticate } = require("../middleware/auth")
const { 
  validateUserUpdate, 
  validatePasswordChange, 
  validateWebsiteUrl 
} = require("../middleware/validation")

const router = express.Router()

// Get user profile
router.get("/profile", authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      })
    }

    // Add a virtual "lastLogin" field - in a real app this would be stored
    const lastLogin = user.updatedAt || user.createdAt

    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        lastLogin: lastLogin,
        websiteURLs: user.websiteURLs || [],
      },
    })
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    })
  }
})

// Update user profile (Fix #5: Input Validation)
router.put("/profile", authenticate, validateUserUpdate, async (req, res) => {
  try {
    const { name, email } = req.body
    const userId = req.user._id

    // Check if email is already taken by another user
    if (email !== req.user.email) {
      const existingUser = await User.findOne({ email, _id: { $ne: userId } })
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: "Email is already taken by another user",
        })
      }
    }

    // Update user
    const updatedUser = await User.findByIdAndUpdate(userId, { name, email }, { new: true, runValidators: true })

    // Create an audit log for profile update
    const { AuditLog } = require("../models/SystemSettings")
    await AuditLog.create({
      userEmail: req.user.email,
      action: "Profile Update",
      resource: "User",
      resourceId: userId.toString(),
      details: {
        updatedFields: {
          name: name,
          email: email
        },
        previousEmail: req.user.email
      },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
    });

    res.json({
      success: true,
      message: "Profile updated successfully",
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

// Change password (Fix #5: Input Validation)
router.put("/change-password", authenticate, validatePasswordChange, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body
    const userId = req.user._id

    // Get user with password
    const user = await User.findById(userId).select("+password")
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      })
    }

    // Verify current password
    const isCurrentPasswordValid = await user.comparePassword(currentPassword)
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        message: "Current password is incorrect",
      })
    }

    // Update password
    user.password = newPassword
    await user.save()

    // Create an audit log for password change
    const { AuditLog } = require("../models/SystemSettings")
    await AuditLog.create({
      userEmail: user.email,
      action: "Password Change",
      resource: "User",
      resourceId: userId.toString(),
      details: {
        passwordChanged: true
      },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
    });

    res.json({
      success: true,
      message: "Password changed successfully",
    })
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    })
  }
})

// Get user dashboard data
router.get("/dashboard", authenticate, async (req, res) => {
  try {
    res.json({
      success: true,
      message: "Welcome to user dashboard",
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
      },
    })
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    })
  }
})

// Get user's website URLs
router.get("/website-urls", authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      })
    }

    res.json({
      success: true,
      websiteURLs: user.websiteURLs || [],
    })
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    })
  }
})

// Add/Update website URL (Fix #5: Input Validation)
router.post("/website-urls", authenticate, validateWebsiteUrl, async (req, res) => {
  try {
    const { url, title, description } = req.body
    const userId = req.user._id

    // Validate required fields
    if (!url) {
      return res.status(400).json({
        success: false,
        message: "URL is required",
      });
    }
    
    if (!title) {
      return res.status(400).json({
        success: false,
        message: "Title is required",
      });
    }

    // Validate URL format
    try {
      new URL(url)
    } catch (e) {
      return res.status(400).json({
        success: false,
        message: "Invalid URL format. Please include http:// or https://",
      })
    }

    const user = await User.findById(userId)
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      })
    }

    // Check if user already has 2 URLs
    if (user.websiteURLs.length >= 2) {
      return res.status(400).json({
        success: false,
        message: "Maximum 2 website URLs allowed per user",
      })
    }

    // Check if URL already exists for this user
    const existingURL = user.websiteURLs.find((item) => item.url === url)
    if (existingURL) {
      return res.status(400).json({
        success: false,
        message: "This URL already exists in your list",
      })
    }

    // Add new website URL
    user.websiteURLs.push({
      url,
      title,
      description: description || "",
    })

    await user.save()

    // Create an audit log for adding a website URL
    const { AuditLog } = require("../models/SystemSettings")
    await AuditLog.create({
      userEmail: user.email,
      action: "Website URL Added",
      resource: "User",
      resourceId: userId.toString(),
      details: {
        url: url,
        title: title,
        description: description || ""
      },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
    });

    res.json({
      success: true,
      message: "Website URL added successfully",
      websiteURLs: user.websiteURLs,
    })
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    })
  }
})

// Update website URL
router.put("/website-urls/:urlId", authenticate, async (req, res) => {
  try {
    const { urlId } = req.params
    const { url, title, description, isActive } = req.body
    const userId = req.user._id

    // Validate URL format if provided
    if (url) {
      try {
        new URL(url)
      } catch (e) {
        return res.status(400).json({
          success: false,
          message: "Invalid URL format",
        })
      }
    }

    const user = await User.findById(userId)
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      })
    }

    const websiteURL = user.websiteURLs.id(urlId)
    if (!websiteURL) {
      return res.status(404).json({
        success: false,
        message: "Website URL not found",
      })
    }

    // Store old values for audit log
    const oldValues = {
      url: websiteURL.url,
      title: websiteURL.title,
      description: websiteURL.description,
      isActive: websiteURL.isActive
    };

    // Update fields
    if (url) websiteURL.url = url
    if (title) websiteURL.title = title
    if (description !== undefined) websiteURL.description = description
    if (isActive !== undefined) websiteURL.isActive = isActive

    await user.save()

    // Create an audit log for updating a website URL
    const { AuditLog } = require("../models/SystemSettings")
    await AuditLog.create({
      userEmail: user.email,
      action: "Website URL Updated",
      resource: "User",
      resourceId: userId.toString(),
      details: {
        urlId: urlId,
        oldValues: oldValues,
        newValues: {
          url: websiteURL.url,
          title: websiteURL.title,
          description: websiteURL.description,
          isActive: websiteURL.isActive
        }
      },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
    });

    res.json({
      success: true,
      message: "Website URL updated successfully",
      websiteURLs: user.websiteURLs,
    })
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    })
  }
})

// Delete website URL
router.delete("/website-urls/:urlId", authenticate, async (req, res) => {
  try {
    const { urlId } = req.params
    const userId = req.user._id

    const user = await User.findById(userId)
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      })
    }

    const websiteURL = user.websiteURLs.id(urlId)
    if (!websiteURL) {
      return res.status(404).json({
        success: false,
        message: "Website URL not found",
      })
    }

    // Store the website URL data for audit logging before deletion
    const deletedWebsiteURL = {
      url: websiteURL.url,
      title: websiteURL.title,
      description: websiteURL.description,
      isActive: websiteURL.isActive
    };

    user.websiteURLs.pull(urlId)
    await user.save()

    // Create an audit log for deleting a website URL
    const { AuditLog } = require("../models/SystemSettings")
    await AuditLog.create({
      userEmail: user.email,
      action: "Website URL Deleted",
      resource: "User",
      resourceId: userId.toString(),
      details: {
        urlId: urlId,
        deletedWebsiteURL: deletedWebsiteURL
      },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
    });

    res.json({
      success: true,
      message: "Website URL deleted successfully",
      websiteURLs: user.websiteURLs,
    })
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    })
  }
})

module.exports = router
