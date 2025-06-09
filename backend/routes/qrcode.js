const express = require("express")
const QRCode = require("../models/QRCode")
const User = require("../models/User")
const Category = require("../models/Category")
const Scan = require("../models/Scan")
const { authenticate, isAdmin } = require("../middleware/auth")
const { validateQrCodeGeneration } = require("../middleware/validation")
const { v4: uuidv4 } = require("uuid")
const { createAuditLog } = require("../utils/auditLogger")
const { 
  generateAndStoreQRCode, 
  getQRCodeFromGridFS, 
  deleteQRCodeFromGridFS 
} = require("../utils/gridfs")

const router = express.Router()

// ========= PUBLIC ROUTES FIRST (NO AUTHENTICATION) =========

// Verify QR code (public route) - enhanced to include scan logging and website data
// IMPORTANT: Define before other routes with parameters to ensure correct matching
router.get("/verify/:codeId", async (req, res) => {
  try {
    const { codeId } = req.params

    console.log(`QR Code verification attempt for: ${codeId}`) // Debug log

    // Find the QR code
    const qrCode = await QRCode.findOne({ codeId, isActive: true })
      .populate("assignedTo", "name email")
      .populate("category", "name color")

    if (!qrCode) {
      console.log(`QR Code not found or inactive: ${codeId}`) // Debug log
      return res.status(404).json({
        success: false,
        valid: false,
        message: "QR code not found or has been deactivated",
      })
    }

    console.log(`QR Code verified successfully: ${codeId}`) // Debug log

    res.json({
      success: true,
      valid: true,
      qrCode: {
        codeId: qrCode.codeId,
        websiteURL: qrCode.websiteURL,
        websiteTitle: qrCode.websiteTitle,
        assignedTo: {
          name: qrCode.assignedTo.name,
          email: qrCode.assignedTo.email,
        },
        category: {
          name: qrCode.category.name,
          color: qrCode.category.color,
        },
        scanCount: qrCode.scanCount,
        createdAt: qrCode.createdAt,
      },
    })
  } catch (error) {
    console.error("Error verifying QR code:", error)
    res.status(500).json({
      success: false,
      valid: false,
      message: "Error verifying QR code",
      error: error.message,
    })  }
})

// Log scan for verified QR code (public route) - POST endpoint for logging scans
router.post("/verify/:codeId/scan", async (req, res) => {
  try {
    const { codeId } = req.params

    console.log(`QR Code scan logging for: ${codeId}`) // Debug log

    // Find the QR code
    const qrCode = await QRCode.findOne({ codeId, isActive: true })

    if (!qrCode) {
      console.log(`QR Code not found or inactive for scan logging: ${codeId}`) // Debug log
      return res.status(404).json({
        success: false,
        message: "QR code not found or has been deactivated",
      })
    }

    // Get client information
    const userAgent = req.headers["user-agent"] || "Unknown"
    const ipAddress = req.ip || req.connection.remoteAddress || "Unknown"

    // Simple device detection
    let deviceType = "Desktop"
    if (/Mobile|Android|iPhone|iPad/.test(userAgent)) {
      deviceType = "Mobile"
    } else if (/Tablet|iPad/.test(userAgent)) {
      deviceType = "Tablet"
    }

    console.log(`Logging scan for QR code: ${codeId}`) // Debug log

    // Log the scan
    const scan = new Scan({
      qrCode: qrCode._id,
      codeId: codeId,
      ipAddress: ipAddress,
      userAgent: userAgent,
      deviceInfo: {
        device: deviceType,
        userAgent: userAgent,
      },
      timestamp: new Date(),
    })

    await scan.save()

    // Update scan count
    await QRCode.findByIdAndUpdate(qrCode._id, {
      $inc: { scanCount: 1 },
      lastScanned: new Date(),
    })

    console.log(`QR Code scan logged successfully: ${codeId}`) // Debug log

    res.json({
      success: true,
      message: "Scan logged successfully",
      newScanCount: qrCode.scanCount + 1,
    })
  } catch (error) {
    console.error("Error logging scan:", error)
    res.status(500).json({
      success: false,
      message: "Error logging scan",
      error: error.message,
    })
  }
})

// Serve QR code images from GridFS (public route)
router.get("/image/:codeId", async (req, res) => {
  try {
    const { codeId } = req.params;
    
    console.log(`Retrieving QR code image for: ${codeId}`);
    
    // Get image stream from GridFS
    const downloadStream = await getQRCodeFromGridFS(codeId);
    
    if (!downloadStream) {
      return res.status(404).json({
        success: false,
        message: 'QR code image not found'
      });
    }
    
    // Set appropriate headers
    res.set('Content-Type', 'image/png');
    res.set('Content-Disposition', `inline; filename="${codeId}.png"`);
    res.set('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
    
    // Handle stream errors
    downloadStream.on('error', (error) => {
      console.error('Error streaming QR code image:', error);
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          message: 'Error retrieving QR code image'
        });
      }
    });
    
    // Pipe the image stream to response
    downloadStream.pipe(res);
    
  } catch (error) {
    console.error('Error retrieving QR code image:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving QR code image',
      error: error.message
    });
  }
})

// Scan QR code and redirect to frontend verification page (public route)
// This handles direct QR code scans and redirects to the enhanced verification experience
router.get("/scan/:codeId", async (req, res) => {
  try {
    const { codeId } = req.params

    console.log(`QR Code scan attempt for: ${codeId}`) // Debug log

    // Find the QR code to verify it exists
    const qrCode = await QRCode.findOne({ codeId, isActive: true })

    if (!qrCode) {
      console.log(`QR Code not found or inactive: ${codeId}`) // Debug log
      return res.status(404).send(`
        <html>
          <head>
            <title>QR Code Not Found</title>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              body { font-family: Arial, sans-serif; text-align: center; padding: 50px; background: #f5f5f5; margin: 0; }
              .container { max-width: 400px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
              .error-icon { font-size: 48px; color: #e74c3c; margin-bottom: 20px; }
              h1 { color: #e74c3c; margin-bottom: 15px; }
              p { color: #666; line-height: 1.5; }
              .code-id { font-family: monospace; background: #f8f9fa; padding: 5px 10px; border-radius: 4px; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="error-icon">❌</div>
              <h1>QR Code Not Found</h1>
              <p>The QR code you scanned is invalid or has been deactivated.</p>
              <p><span class="code-id">Code ID: ${codeId}</span></p>
              <p style="margin-top: 20px; font-size: 12px; color: #999;">
                If you believe this is an error, please contact support.
              </p>
            </div>
          </body>
        </html>
      `)
    }

    // Get the frontend URL from environment variables
    const frontendUrl = process.env.FRONTEND_URL || process.env.QR_BASE_URL || 'http://localhost:3000'
    
    console.log(`Redirecting to frontend verify page: ${frontendUrl}/verify/${codeId}`) // Debug log

    // Redirect to the frontend verify page which will handle the enhanced verification
    res.redirect(302, `${frontendUrl}/verify/${codeId}`)
  } catch (error) {
    console.error("Error processing QR scan:", error)
    res.status(500).send(`
      <html>
        <head>
          <title>Error</title>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 50px; background: #f5f5f5; margin: 0; }
            .container { max-width: 400px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            .error-icon { font-size: 48px; color: #e74c3c; margin-bottom: 20px; }
            h1 { color: #e74c3c; margin-bottom: 15px; }
            p { color: #666; line-height: 1.5; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="error-icon">⚠️</div>
            <h1>Error Processing QR Code</h1>
            <p>There was an error processing your QR code scan. Please try again.</p>
            <p style="font-size: 12px; color: #999; margin-top: 20px;">
              Error: ${error.message}
            </p>
          </div>
        </body>
      </html>
    `)
  }
})

// Helper function to get the correct backend URL
const getBackendUrl = () => {
  // In production, use the production URL
  if (process.env.NODE_ENV === "production") {
    return process.env.BACKEND_URL || "https://quench-rbac-backend-production.up.railway.app"
  }

  // In development, prefer ngrok URL if available, otherwise use localhost
  return process.env.BACKEND_URL || process.env.NGROK_URL || "https://159e-122-171-97-68.ngrok-free.app"
}

// Generate and save QR code (Fix #5: Input Validation)
router.post("/generate", authenticate, isAdmin, validateQrCodeGeneration, async (req, res) => {
  try {
    const { userId, categoryId, websiteURL, websiteTitle } = req.body

    // Validate required fields
    if (!userId || !categoryId || !websiteURL || !websiteTitle) {
      return res.status(400).json({
        success: false,
        message: "User ID, Category ID, Website URL, and Website Title are required",
      })
    }

    // Validate URL format
    try {
      new URL(websiteURL)
    } catch (e) {
      return res.status(400).json({
        success: false,
        message: "Invalid website URL format",
      })
    }

    // Check if user exists
    const user = await User.findById(userId)
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      })
    }

    // Check if category exists
    const category = await Category.findById(categoryId)
    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      })
    }

    // Generate unique code ID
    const codeId = uuidv4()

    // Generate QR code data (verification URL) - should point to frontend
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000'
    const qrData = `${frontendUrl}/verify/${codeId}`

    console.log(`Generating QR code with URL: ${qrData}`) // Debug log

    // Generate and store QR code in MongoDB GridFS
    const { fileId, imageURL } = await generateAndStoreQRCode(codeId, qrData);

    // Create QR code record in database
    const qrCodeRecord = new QRCode({
      codeId,
      imageURL, // This will be the API endpoint to retrieve the image
      fileId,   // Store the GridFS file ID for reference
      websiteURL,
      websiteTitle,
      assignedTo: userId,
      category: categoryId,
      scanCount: 0,
    })

    await qrCodeRecord.save()
    await qrCodeRecord.populate([
      { path: "assignedTo", select: "name email" },
      { path: "category", select: "name color" },
    ])

    // Create an audit log for QR code generation
    await createAuditLog(
      req,
      "QR Code Generated",
      "QR Code Management",
      codeId,
      {
        websiteTitle: websiteTitle,
        websiteURL: websiteURL,
        assignedToUserId: userId,
        categoryId: categoryId
      }
    );

    res.status(201).json({
      success: true,
      message: "QR code generated successfully",
      qrCode: qrCodeRecord,
      scanUrl: qrData, // Include the scan URL in response for debugging
    })
  } catch (error) {
    console.error("QR code generation error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to generate QR code",
      error: error.message,
    })
  }
})

// Get all QR codes with analytics (admin only)
router.get("/", authenticate, isAdmin, async (req, res) => {
  try {
    const { category } = req.query

    const filter = {}
    if (category && category !== "all") {
      filter.category = category
    }

    const qrCodes = await QRCode.find(filter)
      .populate("assignedTo", "name email")
      .populate("category", "name color")
      .sort({ createdAt: -1 })

    res.json({
      success: true,
      qrCodes,
      count: qrCodes.length,
    })
  } catch (error) {
    console.error("Error fetching QR codes:", error)
    res.status(500).json({
      success: false,
      message: "Failed to fetch QR codes",
      error: error.message,
    })
  }
})

// Get QR codes for a specific user with analytics
router.get("/user/:userId", authenticate, async (req, res) => {
  try {
    const { userId } = req.params

    // Check if the requesting user is an admin or the user themselves
    if (req.user.role !== "admin" && req.user._id.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to access these QR codes",
      })
    }

    const qrCodes = await QRCode.find({ assignedTo: userId }).populate("category", "name color").sort({ createdAt: -1 })

    res.json({
      success: true,
      qrCodes,
      count: qrCodes.length,
    })
  } catch (error) {
    console.error("Error fetching user QR codes:", error)
    res.status(500).json({
      success: false,
      message: "Failed to fetch QR codes",
      error: error.message,
    })
  }
})

// Get QR code analytics (admin only)
router.get("/analytics", authenticate, isAdmin, async (req, res) => {
  try {
    const { period = "7d" } = req.query

    // Calculate date range
    const now = new Date()
    const startDate = new Date()

    switch (period) {
      case "24h":
        startDate.setHours(now.getHours() - 24)
        break
      case "7d":
        startDate.setDate(now.getDate() - 7)
        break
      case "30d":
        startDate.setDate(now.getDate() - 30)
        break
      default:
        startDate.setDate(now.getDate() - 7)
    }

    // Get total scans per QR code
    const qrCodeScans = await Scan.aggregate([
      {
        $match: {
          timestamp: { $gte: startDate },
        },
      },
      {
        $lookup: {
          from: "qrcodes",
          localField: "qrCode",
          foreignField: "_id",
          as: "qrCodeInfo",
        },
      },
      {
        $unwind: "$qrCodeInfo",
      },
      {
        $lookup: {
          from: "users",
          localField: "qrCodeInfo.assignedTo",
          foreignField: "_id",
          as: "userInfo",
        },
      },
      {
        $unwind: "$userInfo",
      },
      {
        $lookup: {
          from: "categories",
          localField: "qrCodeInfo.category",
          foreignField: "_id",
          as: "categoryInfo",
        },
      },
      {
        $unwind: "$categoryInfo",
      },
      {
        $group: {
          _id: "$codeId",
          qrCodeId: { $first: "$qrCode" },
          assignedTo: { $first: "$userInfo.name" },
          category: { $first: "$categoryInfo.name" },
          categoryColor: { $first: "$categoryInfo.color" },
          websiteTitle: { $first: "$qrCodeInfo.websiteTitle" },
          websiteURL: { $first: "$qrCodeInfo.websiteURL" },
          totalScans: { $sum: 1 },
          lastScanned: { $max: "$timestamp" },
        },
      },
      {
        $sort: { totalScans: -1 },
      },
    ])

    // Get scans per category
    const categoryScans = await Scan.aggregate([
      {
        $match: {
          timestamp: { $gte: startDate },
        },
      },
      {
        $lookup: {
          from: "qrcodes",
          localField: "qrCode",
          foreignField: "_id",
          as: "qrCodeInfo",
        },
      },
      {
        $unwind: "$qrCodeInfo",
      },
      {
        $lookup: {
          from: "categories",
          localField: "qrCodeInfo.category",
          foreignField: "_id",
          as: "categoryInfo",
        },
      },
      {
        $unwind: "$categoryInfo",
      },
      {
        $group: {
          _id: "$categoryInfo._id",
          name: { $first: "$categoryInfo.name" },
          color: { $first: "$categoryInfo.color" },
          totalScans: { $sum: 1 },
        },
      },
      {
        $sort: { totalScans: -1 },
      },
    ])

    // Get daily scan counts
    const dailyScans = await Scan.aggregate([
      {
        $match: {
          timestamp: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$timestamp" },
            month: { $month: "$timestamp" },
            day: { $dayOfMonth: "$timestamp" },
          },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 },
      },
    ])

    // Get device analytics
    const deviceAnalytics = await Scan.aggregate([
      {
        $match: {
          timestamp: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: "$deviceInfo.device",
          count: { $sum: 1 },
        },
      },
      {
        $sort: { count: -1 },
      },
    ])

    res.json({
      success: true,
      analytics: {
        period,
        qrCodeScans,
        categoryScans,
        dailyScans,
        deviceAnalytics,
        totalScans: await Scan.countDocuments({ timestamp: { $gte: startDate } }),
      },
    })
  } catch (error) {
    console.error("Error fetching QR code analytics:", error)
    res.status(500).json({
      success: false,
      message: "Failed to fetch analytics",
      error: error.message,
    })
  }
})

// Get detailed QR code info with scans (admin only)
router.get("/:codeId/details", authenticate, isAdmin, async (req, res) => {
  try {
    const { codeId } = req.params

    const qrCode = await QRCode.findOne({ codeId })
      .populate("assignedTo", "name email")
      .populate("category", "name color")

    if (!qrCode) {
      return res.status(404).json({
        success: false,
        message: "QR code not found",
      })
    }

    // Get recent scans
    const recentScans = await Scan.find({ codeId }).sort({ timestamp: -1 }).limit(50)

    // Get scan statistics
    const scanStats = await Scan.aggregate([
      { $match: { codeId } },
      {
        $group: {
          _id: null,
          totalScans: { $sum: 1 },
          firstScan: { $min: "$timestamp" },
          lastScan: { $max: "$timestamp" },
          uniqueIPs: { $addToSet: "$ipAddress" },
        },
      },
    ])

    res.json({
      success: true,
      qrCode,
      recentScans,
      scanStats: scanStats[0] || { totalScans: 0, uniqueIPs: [] },
    })
  } catch (error) {
    console.error("Error fetching QR code details:", error)
    res.status(500).json({
      success: false,
      message: "Failed to fetch QR code details",
      error: error.message,
    })
  }
})

// Delete QR code (admin only)
router.delete("/:codeId", authenticate, isAdmin, async (req, res) => {
  try {
    const { codeId } = req.params

    const qrCode = await QRCode.findOneAndDelete({ codeId })

    if (!qrCode) {
      return res.status(404).json({
        success: false,
        message: "QR code not found",
      })
    }

    // Delete associated scans
    await Scan.deleteMany({ codeId })

    // Delete the QR code image from GridFS
    try {
      await deleteQRCodeFromGridFS(codeId);
      console.log(`Deleted QR code image for ${codeId} from GridFS`);
    } catch (error) {
      console.error(`Error deleting QR code image for ${codeId} from GridFS:`, error);
      // Don't fail the whole operation if image deletion fails
    }

    // Create an audit log for this deletion
    await createAuditLog(
      req,
      "QR Code Deleted",
      "QR Code Management", 
      codeId,
      {
        websiteTitle: qrCode.websiteTitle,
        websiteURL: qrCode.websiteURL,
        scanCount: qrCode.scanCount,
        assignedToUserId: qrCode.assignedTo,
        categoryId: qrCode.category
      }
    );

    res.json({
      success: true,
      message: "QR code deleted successfully",
    })
  } catch (error) {
    console.error("Error deleting QR code:", error)
    res.status(500).json({
      success: false,
      message: "Failed to delete QR code",
      error: error.message,
    })
  }
})

module.exports = router
