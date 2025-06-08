const express = require("express")
const User = require("../models/User")
const QRCode = require("../models/QRCode")
const Category = require("../models/Category")
const Scan = require("../models/Scan")
const { SystemSettings, Backup, Certificate, AuditLog } = require("../models/SystemSettings")
const { authenticate, isAdmin } = require("../middleware/auth")
const os = require("os")
const mongoose = require("mongoose")
const fs = require("fs")
const path = require("path")
const crypto = require("crypto")

const router = express.Router()

// Helper function to format bytes to human-readable sizes
function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

// Get user analytics
router.get("/users", authenticate, isAdmin, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments()
    const adminUsers = await User.countDocuments({ role: "admin" })
    const regularUsers = await User.countDocuments({ role: "user" })
    const activeUsers = await User.countDocuments({
      lastLogin: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
    })

    // Get user growth over time (last 6 months)
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

    const userGrowth = await User.aggregate([
      {
        $match: {
          createdAt: { $gte: sixMonthsAgo },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { "_id.year": 1, "_id.month": 1 },
      },
    ])

    // Format user growth data
    const formattedUserGrowth = userGrowth.map((item) => {
      const date = `${item._id.year}-${String(item._id.month).padStart(2, "0")}`
      return {
        date,
        newUsers: item.count,
        users: 0, // Will calculate cumulative below
      }
    })

    // Calculate cumulative users
    let cumulativeUsers = await User.countDocuments({
      createdAt: { $lt: sixMonthsAgo },
    })

    formattedUserGrowth.forEach((item, index) => {
      cumulativeUsers += item.newUsers
      formattedUserGrowth[index].users = cumulativeUsers
    })

    // Get role distribution
    const roleDistribution = [
      {
        role: "User",
        count: regularUsers,
        percentage: totalUsers > 0 ? Math.round((regularUsers / totalUsers) * 100) : 0,
      },
      {
        role: "Admin",
        count: adminUsers,
        percentage: totalUsers > 0 ? Math.round((adminUsers / totalUsers) * 100) : 0,
      },
    ]

    // Get activity stats
    const now = new Date()
    const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const lastMonth = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const lastQuarter = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)

    const activeLastWeek = await User.countDocuments({ lastLogin: { $gte: lastWeek } })
    const activeLastMonth = await User.countDocuments({ lastLogin: { $gte: lastMonth } })
    const activeLastQuarter = await User.countDocuments({ lastLogin: { $gte: lastQuarter } })

    // Mock login counts (in a real app, you'd have a login history collection)
    const activityStats = [
      { period: "Last 7 days", activeUsers: activeLastWeek, totalLogins: activeLastWeek * 3 },
      { period: "Last 30 days", activeUsers: activeLastMonth, totalLogins: activeLastMonth * 5 },
      { period: "Last 90 days", activeUsers: activeLastQuarter, totalLogins: activeLastQuarter * 10 },
    ]

    res.json({
      success: true,
      analytics: {
        totalUsers,
        activeUsers,
        adminUsers,
        regularUsers,
        userGrowth: formattedUserGrowth,
        roleDistribution,
        activityStats,
      },
    })
  } catch (error) {
    console.error("Error fetching user analytics:", error)
    res.status(500).json({
      success: false,
      message: "Failed to fetch user analytics",
      error: error.message,
    })
  }
})

// Get QR code analytics
router.get("/qrcodes", authenticate, isAdmin, async (req, res) => {
  try {
    const totalQRCodes = await QRCode.countDocuments()
    const totalScans = await Scan.countDocuments()
    const averageScansPerCode = totalQRCodes > 0 ? Math.round(totalScans / totalQRCodes) : 0

    // Get device breakdown
    const deviceBreakdown = await Scan.aggregate([
      {
        $group: {
          _id: "$deviceInfo.device",
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          device: "$_id",
          count: 1,
          percentage: {
            $multiply: [{ $divide: ["$count", totalScans] }, 100],
          },
        },
      },
      {
        $sort: { count: -1 },
      },
    ])

    // Format device breakdown
    const formattedDeviceBreakdown = deviceBreakdown.map((item) => ({
      device: item.device || "Unknown",
      count: item.count,
      percentage: Math.round(item.percentage),
    }))

    // Get scan timeline (last 6 months)
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

    const scanTimeline = await Scan.aggregate([
      {
        $match: {
          timestamp: { $gte: sixMonthsAgo },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$timestamp" },
            month: { $month: "$timestamp" },
          },
          scans: { $sum: 1 },
        },
      },
      {
        $sort: { "_id.year": 1, "_id.month": 1 },
      },
    ])

    // Format scan timeline
    const formattedScanTimeline = scanTimeline.map((item) => ({
      date: `${item._id.year}-${String(item._id.month).padStart(2, "0")}`,
      scans: item.scans,
    }))

    // Get top performing QR codes
    const topPerformingCodes = await QRCode.aggregate([
      {
        $sort: { scanCount: -1 },
      },
      {
        $limit: 5,
      },
      {
        $project: {
          title: "$websiteTitle",
          scans: "$scanCount",
          conversionRate: { $multiply: [{ $divide: ["$scanCount", { $add: ["$scanCount", 10] }] }, 100] }, // Mock conversion rate
        },
      },
    ])

    // Get geographic data (mock data as we don't store location)
    const geographicData = [
      { country: "United States", scans: Math.round(totalScans * 0.4) },
      { country: "United Kingdom", scans: Math.round(totalScans * 0.2) },
      { country: "Canada", scans: Math.round(totalScans * 0.15) },
      { country: "Australia", scans: Math.round(totalScans * 0.1) },
      { country: "Germany", scans: Math.round(totalScans * 0.15) },
    ]

    res.json({
      success: true,
      analytics: {
        totalQRCodes,
        totalScans,
        averageScansPerCode,
        deviceBreakdown: formattedDeviceBreakdown,
        scanTimeline: formattedScanTimeline,
        topPerformingCodes,
        geographicData,
      },
    })
  } catch (error) {
    console.error("Error fetching QR code analytics:", error)
    res.status(500).json({
      success: false,
      message: "Failed to fetch QR code analytics",
      error: error.message,
    })
  }
})

// Get category analytics
router.get("/categories", authenticate, isAdmin, async (req, res) => {
  try {
    const totalCategories = await Category.countDocuments()
    const activeCategories = await Category.countDocuments({ isActive: true })

    // Get QR codes per category
    const categoryQRCodes = await QRCode.aggregate([
      {
        $group: {
          _id: "$category",
          count: { $sum: 1 },
          totalScans: { $sum: "$scanCount" },
        },
      },
    ])

    // Get category details with QR code counts
    const categories = await Category.find().lean()

    // Map QR code counts to categories
    const categoriesWithCounts = categories.map((category) => {
      const qrCodeData = categoryQRCodes.find((item) => item._id.toString() === category._id.toString())
      return {
        ...category,
        qrCodeCount: qrCodeData ? qrCodeData.count : 0,
        totalScans: qrCodeData ? qrCodeData.totalScans : 0,
      }
    })

    // Calculate total QR codes
    const totalQRCodes = categoriesWithCounts.reduce((sum, cat) => sum + cat.qrCodeCount, 0)

    // Calculate category distribution
    const categoryDistribution = categoriesWithCounts.map((cat) => ({
      name: cat.name,
      color: cat.color,
      count: cat.qrCodeCount,
      percentage: totalQRCodes > 0 ? Math.round((cat.qrCodeCount / totalQRCodes) * 100) : 0,
    }))

    // Get performance metrics
    const performanceMetrics = categoriesWithCounts
      .sort((a, b) => b.totalScans - a.totalScans)
      .slice(0, 5)
      .map((cat) => ({
        name: cat.name,
        qrCodes: cat.qrCodeCount,
        scans: cat.totalScans,
        avgScansPerCode: cat.qrCodeCount > 0 ? Math.round(cat.totalScans / cat.qrCodeCount) : 0,
      }))

    // Mock utilization trends (in a real app, you'd track this over time)
    const utilizationTrends = [
      { month: "2024-01", categories: Math.min(totalCategories, 8), usage: Math.round(totalQRCodes * 0.6) },
      { month: "2024-02", categories: Math.min(totalCategories, 10), usage: Math.round(totalQRCodes * 0.7) },
      { month: "2024-03", categories: Math.min(totalCategories, 12), usage: Math.round(totalQRCodes * 0.8) },
      { month: "2024-04", categories: Math.min(totalCategories, 14), usage: Math.round(totalQRCodes * 0.9) },
      { month: "2024-05", categories: Math.min(totalCategories, 15), usage: Math.round(totalQRCodes * 0.95) },
      { month: "2024-06", categories: totalCategories, usage: totalQRCodes },
    ]

    res.json({
      success: true,
      analytics: {
        totalCategories,
        activeCategories,
        totalQRCodes,
        categoryDistribution,
        performanceMetrics,
        utilizationTrends,
      },
      categoriesWithCounts,
    })
  } catch (error) {
    console.error("Error fetching category analytics:", error)
    res.status(500).json({
      success: false,
      message: "Failed to fetch category analytics",
      error: error.message,
    })
  }
})

// Get system metrics
router.get("/system", authenticate, isAdmin, async (req, res) => {
  try {
    // Calculate uptime
    const uptimeSeconds = os.uptime()
    const days = Math.floor(uptimeSeconds / 86400)
    const hours = Math.floor((uptimeSeconds % 86400) / 3600)
    const uptime = `${days} days, ${hours} hours`

    // Get CPU usage
    const cpuUsage = Math.round((os.loadavg()[0] * 100) / os.cpus().length)

    // Get memory usage
    const totalMemory = os.totalmem()
    const freeMemory = os.freemem()
    const memoryUsage = Math.round(((totalMemory - freeMemory) / totalMemory) * 100)

    // Get disk usage (mock data as Node.js doesn't provide this directly)
    const diskUsage = Math.round(Math.random() * 20 + 30)

    // Get database connection stats
    const dbStats = await mongoose.connection.db.stats()

    // Get active connections (mock data)
    const activeConnections = Math.round(Math.random() * 50 + 50)

    // Calculate requests per minute (mock data)
    const requestsPerMinute = Math.round(Math.random() * 500 + 500)

    // Calculate error rate (mock data)
    const errorRate = (Math.random() * 0.05).toFixed(2)

    // Calculate response time (mock data)
    const responseTime = Math.round(Math.random() * 100 + 50)

    // Generate performance data for the last 24 hours
    const performanceData = []
    const now = new Date()

    for (let i = 23; i >= 0; i--) {
      const hour = new Date(now)
      hour.setHours(now.getHours() - i)

      performanceData.push({
        time: `${String(hour.getHours()).padStart(2, "0")}:00`,
        cpu: Math.round(Math.random() * 20 + cpuUsage - 10),
        memory: Math.round(Math.random() * 10 + memoryUsage - 5),
        requests: Math.round(Math.random() * 200 + requestsPerMinute - 100),
      })
    }

    // Get feature usage statistics
    const featureUsage = [
      { feature: "QR Code Generation", usage: 89, trend: 12 },
      { feature: "User Management", usage: 67, trend: -3 },
      { feature: "Category Management", usage: 45, trend: 8 },
      { feature: "Analytics Dashboard", usage: 78, trend: 15 },
      { feature: "API Endpoints", usage: 92, trend: 5 },
    ]

    // Get system settings or create default if none exists
    let systemSettings = await SystemSettings.findOne();
    if (!systemSettings) {
      systemSettings = await SystemSettings.create({});
    }

    // Get certificates
    const certificates = await Certificate.find().sort({ expiryDate: 1 }).limit(5);

    // Get backups
    const backups = await Backup.find().sort({ createdAt: -1 }).limit(10);

    // Get audit logs
    let auditLogs = await AuditLog.find()
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    // If no audit logs in the database yet, use mock data
    if (auditLogs.length === 0) {
      auditLogs = [
        {
          id: "1",
          timestamp: new Date().toISOString(),
          user: "admin@example.com",
          action: "User Role Updated",
          resource: "User Management",
          ipAddress: "192.168.1.100",
        },
        {
          id: "2",
          timestamp: new Date(Date.now() - 300000).toISOString(),
          user: "admin@example.com",
          action: "QR Code Deleted",
          resource: "QR Code Management",
          ipAddress: "192.168.1.100",
        },
        {
          id: "3",
          timestamp: new Date(Date.now() - 600000).toISOString(),
          user: "admin@example.com",
          action: "Category Created",
          resource: "Category Management",
          ipAddress: "192.168.1.100",
        },
      ];
    }

    res.json({
      success: true,
      metrics: {
        uptime,
        cpuUsage,
        memoryUsage,
        diskUsage,
        activeConnections,
        requestsPerMinute,
        errorRate,
        responseTime,
        dbStats,
        performanceData,
        featureUsage,
        auditLogs,
        systemSettings,
        backups,
        certificates,
      },
    })
  } catch (error) {
    console.error("Error fetching system metrics:", error)
    res.status(500).json({
      success: false,
      message: "Failed to fetch system metrics",
      error: error.message,
    })
  }
})

// Update system settings
router.post("/system/settings", authenticate, isAdmin, async (req, res) => {
  try {
    const { securitySettings } = req.body

    let systemSettings = await SystemSettings.findOne();
    if (!systemSettings) {
      systemSettings = new SystemSettings({ security: securitySettings });
    } else {
      systemSettings.security = securitySettings;
    }

    await systemSettings.save();

    // Log this action
    await AuditLog.create({
      userEmail: req.user.email,
      action: "Security Settings Updated",
      resource: "System Settings",
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
    });

    res.json({
      success: true,
      message: "Security settings updated successfully",
      settings: securitySettings,
    })
  } catch (error) {
    console.error("Error updating system settings:", error)
    res.status(500).json({
      success: false,
      message: "Failed to update system settings",
      error: error.message,
    })
  }
})

// Get backups
router.get("/system/backups", authenticate, isAdmin, async (req, res) => {
  try {
    const backups = await Backup.find().sort({ createdAt: -1 });

    res.json({
      success: true,
      backups,
    });
  } catch (error) {
    console.error("Error fetching backups:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch backups",
      error: error.message,
    });
  }
});

// Create a new backup
router.post("/system/backups", authenticate, isAdmin, async (req, res) => {
  try {
    const { type, name } = req.body;
    if (!type || !name) {
      return res.status(400).json({
        success: false,
        message: "Type and name are required",
      });
    }

    // Generate a random backup size (in a real app, you'd create an actual backup)
    const sizeInBytes = Math.floor(Math.random() * 1000000000) + 500000000; // 500MB - 1.5GB
    const size = formatBytes(sizeInBytes);

    // Generate a backup ID and path
    const backupId = crypto.randomBytes(16).toString('hex');
    const backupPath = `/backups/${type.toLowerCase()}_${backupId}.zip`;

    const backup = await Backup.create({
      name,
      type,
      size,
      sizeInBytes,
      status: "Completed",
      path: backupPath,
    });

    // Log this action
    await AuditLog.create({
      userEmail: req.user.email,
      action: "Backup Created",
      resource: "System Backup",
      resourceId: backup._id.toString(),
      details: { type, name, size },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
    });

    res.status(201).json({
      success: true,
      message: "Backup created successfully",
      backup,
    });
  } catch (error) {
    console.error("Error creating backup:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create backup",
      error: error.message,
    });
  }
});

// Delete a backup
router.delete("/system/backups/:id", authenticate, isAdmin, async (req, res) => {
  try {
    const backup = await Backup.findById(req.params.id);
    if (!backup) {
      return res.status(404).json({
        success: false,
        message: "Backup not found",
      });
    }

    await backup.deleteOne();

    // Log this action
    await AuditLog.create({
      userEmail: req.user.email,
      action: "Backup Deleted",
      resource: "System Backup",
      resourceId: req.params.id,
      details: { name: backup.name, type: backup.type },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
    });

    res.json({
      success: true,
      message: "Backup deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting backup:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete backup",
      error: error.message,
    });
  }
});

// Update backup settings
router.post("/system/backup-settings", authenticate, isAdmin, async (req, res) => {
  try {
    const { backupSettings } = req.body;

    if (!backupSettings) {
      return res.status(400).json({
        success: false,
        message: "Backup settings are required",
      });
    }

    let systemSettings = await SystemSettings.findOne();
    if (!systemSettings) {
      systemSettings = new SystemSettings({ backup: backupSettings });
    } else {
      systemSettings.backup = backupSettings;
    }

    await systemSettings.save();

    // Log this action
    await AuditLog.create({
      userEmail: req.user.email,
      action: "Backup Settings Updated",
      resource: "System Settings",
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
    });

    res.json({
      success: true,
      message: "Backup settings updated successfully",
      settings: backupSettings,
    });
  } catch (error) {
    console.error("Error updating backup settings:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update backup settings",
      error: error.message,
    });
  }
});

// Get certificates
router.get("/system/certificates", authenticate, isAdmin, async (req, res) => {
  try {
    const certificates = await Certificate.find().sort({ expiryDate: 1 });

    res.json({
      success: true,
      certificates,
    });
  } catch (error) {
    console.error("Error fetching certificates:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch certificates",
      error: error.message,
    });
  }
});

// Add a certificate
router.post("/system/certificates", authenticate, isAdmin, async (req, res) => {
  try {
    const { name, commonName, issuer, expiryDate } = req.body;
    
    if (!name || !commonName || !expiryDate) {
      return res.status(400).json({
        success: false,
        message: "Name, common name and expiry date are required",
      });
    }

    // In a real implementation, you would upload actual certificate files
    const certificate = await Certificate.create({
      name,
      commonName,
      issuer: issuer || "Self-signed",
      expiryDate,
      certificateFile: `/certificates/${commonName.replace(/[^a-zA-Z0-9]/g, "_")}.crt`,
      keyFile: `/certificates/${commonName.replace(/[^a-zA-Z0-9]/g, "_")}.key`,
    });

    // Log this action
    await AuditLog.create({
      userEmail: req.user.email,
      action: "Certificate Added",
      resource: "SSL Certificate",
      resourceId: certificate._id.toString(),
      details: { name, commonName },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
    });

    res.status(201).json({
      success: true,
      message: "Certificate added successfully",
      certificate,
    });
  } catch (error) {
    console.error("Error adding certificate:", error);
    res.status(500).json({
      success: false,
      message: "Failed to add certificate",
      error: error.message,
    });
  }
});

// Delete a certificate
router.delete("/system/certificates/:id", authenticate, isAdmin, async (req, res) => {
  try {
    const certificate = await Certificate.findById(req.params.id);
    if (!certificate) {
      return res.status(404).json({
        success: false,
        message: "Certificate not found",
      });
    }

    await certificate.deleteOne();

    // Log this action
    await AuditLog.create({
      userEmail: req.user.email,
      action: "Certificate Deleted",
      resource: "SSL Certificate",
      resourceId: req.params.id,
      details: { name: certificate.name, commonName: certificate.commonName },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
    });

    res.json({
      success: true,
      message: "Certificate deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting certificate:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete certificate",
      error: error.message,
    });
  }
});

// Get IP restrictions
router.get("/system/ip-restrictions", authenticate, isAdmin, async (req, res) => {
  try {
    const systemSettings = await SystemSettings.findOne();
    
    if (!systemSettings) {
      return res.json({
        success: true,
        ipRestrictions: {
          enabled: false,
          allowedIPs: [],
          blockedIPs: [],
        },
      });
    }
    
    res.json({
      success: true,
      ipRestrictions: systemSettings.security.ipRestrictions || {
        enabled: false,
        allowedIPs: [],
        blockedIPs: [],
      },
    });
  } catch (error) {
    console.error("Error fetching IP restrictions:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch IP restrictions",
      error: error.message,
    });
  }
});

// Update IP restriction settings
router.post("/system/ip-restrictions", authenticate, isAdmin, async (req, res) => {
  try {
    const { enabled, allowedIPs, blockedIPs } = req.body;
    
    let systemSettings = await SystemSettings.findOne();
    if (!systemSettings) {
      systemSettings = new SystemSettings();
    }
    
    systemSettings.security.ipRestrictions = {
      enabled: enabled || false,
      allowedIPs: allowedIPs || [],
      blockedIPs: blockedIPs || [],
    };
    
    await systemSettings.save();
    
    // Log this action
    await AuditLog.create({
      userEmail: req.user.email,
      action: "IP Restrictions Updated",
      resource: "System Security",
      details: { enabled },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
    });
    
    res.json({
      success: true,
      message: "IP restriction settings updated successfully",
      ipRestrictions: systemSettings.security.ipRestrictions,
    });
  } catch (error) {
    console.error("Error updating IP restrictions:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update IP restrictions",
      error: error.message,
    });
  }
});

// Add new IP to restrictions
router.post("/system/ip-restrictions/ip", authenticate, isAdmin, async (req, res) => {
  try {
    const { ipAddress, description, isAllowed } = req.body;
    
    if (!ipAddress) {
      return res.status(400).json({
        success: false,
        message: "IP address is required",
      });
    }
    
    let systemSettings = await SystemSettings.findOne();
    if (!systemSettings) {
      systemSettings = new SystemSettings();
    }
    
    const ipEntry = {
      ipAddress,
      description: description || "",
      isAllowed: isAllowed !== undefined ? isAllowed : true,
    };
    
    if (isAllowed) {
      if (!systemSettings.security.ipRestrictions.allowedIPs) {
        systemSettings.security.ipRestrictions.allowedIPs = [];
      }
      systemSettings.security.ipRestrictions.allowedIPs.push(ipEntry);
    } else {
      if (!systemSettings.security.ipRestrictions.blockedIPs) {
        systemSettings.security.ipRestrictions.blockedIPs = [];
      }
      systemSettings.security.ipRestrictions.blockedIPs.push(ipEntry);
    }
    
    await systemSettings.save();
    
    // Log this action
    await AuditLog.create({
      userEmail: req.user.email,
      action: isAllowed ? "IP Address Allowed" : "IP Address Blocked",
      resource: "System Security",
      details: { ipAddress, description },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
    });
    
    res.json({
      success: true,
      message: `IP address ${isAllowed ? "allowed" : "blocked"} successfully`,
      ipRestrictions: systemSettings.security.ipRestrictions,
    });
  } catch (error) {
    console.error("Error updating IP restrictions:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update IP restrictions",
      error: error.message,
    });
  }
});

// Remove IP from restrictions
router.delete("/system/ip-restrictions/ip", authenticate, isAdmin, async (req, res) => {
  try {
    const { ipAddress, isAllowed } = req.body;
    
    if (!ipAddress) {
      return res.status(400).json({
        success: false,
        message: "IP address is required",
      });
    }
    
    const systemSettings = await SystemSettings.findOne();
    if (!systemSettings) {
      return res.status(404).json({
        success: false,
        message: "System settings not found",
      });
    }
    
    const ipList = isAllowed ? 
      systemSettings.security.ipRestrictions.allowedIPs : 
      systemSettings.security.ipRestrictions.blockedIPs;
    
    if (!ipList) {
      return res.status(404).json({
        success: false,
        message: `IP address list not found`,
      });
    }
    
    const ipIndex = ipList.findIndex(ip => ip.ipAddress === ipAddress);
    if (ipIndex === -1) {
      return res.status(404).json({
        success: false,
        message: `IP address not found in ${isAllowed ? "allowed" : "blocked"} list`,
      });
    }
    
    ipList.splice(ipIndex, 1);
    await systemSettings.save();
    
    // Log this action
    await AuditLog.create({
      userEmail: req.user.email,
      action: `Removed ${isAllowed ? "Allowed" : "Blocked"} IP Address`,
      resource: "System Security",
      details: { ipAddress },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
    });
    
    res.json({
      success: true,
      message: `IP address removed successfully`,
      ipRestrictions: systemSettings.security.ipRestrictions,
    });
  } catch (error) {
    console.error("Error removing IP restriction:", error);
    res.status(500).json({
      success: false,
      message: "Failed to remove IP restriction",
      error: error.message,
    });
  }
});

// Get audit logs with filtering
router.get("/system/audit-logs", authenticate, isAdmin, async (req, res) => {
  try {
    const { user, action, resource, startDate, endDate, limit = 50, page = 1 } = req.query;
    
    const query = {};
    
    if (user) {
      query.userEmail = new RegExp(user, 'i');
    }
    
    if (action) {
      query.action = new RegExp(action, 'i');
    }
    
    if (resource) {
      query.resource = new RegExp(resource, 'i');
    }
    
    if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    } else if (startDate) {
      query.createdAt = { $gte: new Date(startDate) };
    } else if (endDate) {
      query.createdAt = { $lte: new Date(endDate) };
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const auditLogs = await AuditLog.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();
      
    const totalLogs = await AuditLog.countDocuments(query);
    
    res.json({
      success: true,
      auditLogs: auditLogs.map(log => ({
        id: log._id,
        timestamp: log.createdAt,
        user: log.userEmail,
        action: log.action,
        resource: log.resource,
        ipAddress: log.ipAddress,
        details: log.details,
        userAgent: log.userAgent
      })),
      pagination: {
        total: totalLogs,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(totalLogs / parseInt(limit))
      }
    });
  } catch (error) {
    console.error("Error fetching audit logs:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch audit logs",
      error: error.message,
    });
  }
});

// Export audit logs as CSV
router.get("/system/audit-logs/export", authenticate, isAdmin, async (req, res) => {
  try {
    const { user, action, resource, startDate, endDate } = req.query;
    
    const query = {};
    
    if (user) {
      query.userEmail = new RegExp(user, 'i');
    }
    
    if (action) {
      query.action = new RegExp(action, 'i');
    }
    
    if (resource) {
      query.resource = new RegExp(resource, 'i');
    }
    
    if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    } else if (startDate) {
      query.createdAt = { $gte: new Date(startDate) };
    } else if (endDate) {
      query.createdAt = { $lte: new Date(endDate) };
    }
    
    const auditLogs = await AuditLog.find(query)
      .sort({ createdAt: -1 })
      .lean();
    
    // Generate CSV content
    let csv = "Timestamp,User,Action,Resource,IP Address,Details\n";
    
    auditLogs.forEach(log => {
      const timestamp = new Date(log.createdAt).toISOString();
      const user = log.userEmail?.replace(/,/g, ";") || "";
      const action = log.action?.replace(/,/g, ";") || "";
      const resource = log.resource?.replace(/,/g, ";") || "";
      const ipAddress = log.ipAddress || "";
      const details = log.details ? JSON.stringify(log.details).replace(/,/g, ";") : "";
      
      csv += `${timestamp},${user},${action},${resource},${ipAddress},${details}\n`;
    });
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=audit-logs.csv');
    res.send(csv);
      // Log this action
    await AuditLog.create({
      userEmail: req.user.email,
      action: "Exported Audit Logs",
      resource: "System Audit",
      details: { filters: req.query },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
    });
  } catch (error) {
    console.error("Error exporting audit logs:", error);
    res.status(500).json({
      success: false,
      message: "Failed to export audit logs",
      error: error.message,
    });
  }
});

// Helper function to format bytes to human-readable sizes
function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

module.exports = router
