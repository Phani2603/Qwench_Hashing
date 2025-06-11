// API route for QR code device analytics
const express = require("express")
const router = express.Router()
const Scan = require("../models/Scan")
const QRCode = require("../models/QRCode")
const { authenticate } = require("../middleware/auth")

// Get device analytics for QR codes assigned to a user
router.get("/devices", authenticate, async (req, res) => {
  try {
    const userId = req.user._id

    // Find QR codes assigned to the user
    const userQRCodes = await QRCode.find({ assignedTo: userId })
    
    // If no QR codes, return empty analytics
    if (!userQRCodes || userQRCodes.length === 0) {
      return res.status(200).json({
        success: true,
        deviceAnalytics: {
          android: 0,
          ios: 0,
          desktop: 0,
          androidPercentage: 0,
          iosPercentage: 0,
          desktopPercentage: 0,
          total: 0
        }
      })
    }    const qrCodeIds = userQRCodes.map(qr => qr._id)

    // Use efficient aggregation with boolean flags
    const deviceStats = await Scan.aggregate([
      {
        $match: { qrCode: { $in: qrCodeIds } }
      },
      {
        $group: {
          _id: null,
          android: { $sum: { $cond: ["$deviceInfo.isAndroid", 1, 0] } },
          ios: { $sum: { $cond: ["$deviceInfo.isIOS", 1, 0] } },
          desktop: { $sum: { $cond: ["$deviceInfo.isDesktop", 1, 0] } },
          total: { $sum: 1 }
        }
      }
    ])

    // Handle empty result
    const stats = deviceStats[0] || { android: 0, ios: 0, desktop: 0, total: 0 }
    
    const deviceAnalytics = {
      android: stats.android,
      ios: stats.ios,
      desktop: stats.desktop,
      androidPercentage: stats.total > 0 ? Math.round((stats.android / stats.total) * 100) : 0,
      iosPercentage: stats.total > 0 ? Math.round((stats.ios / stats.total) * 100) : 0,
      desktopPercentage: stats.total > 0 ? Math.round((stats.desktop / stats.total) * 100) : 0,
      total: stats.total
    }

    res.status(200).json({
      success: true,
      deviceAnalytics
    })
  } catch (error) {
    console.error("Error fetching device analytics:", error)
    res.status(500).json({
      success: false,
      message: "Failed to fetch device analytics",
      error: error.message
    })
  }
})

// Get scan activity over time
router.get("/activity", authenticate, async (req, res) => {
  try {
    const userId = req.user._id
    const { timeframe = 'daily' } = req.query
      // Find QR codes assigned to the user
    const userQRCodes = await QRCode.find({ assignedTo: userId })
    
    if (!userQRCodes || userQRCodes.length === 0) {
      return res.status(200).json({
        success: true,
        activityData: [],
        qrCodeCount: 0
      })
    }

    const qrCodeIds = userQRCodes.map(qr => qr._id)
    
    // Calculate date range based on timeframe
    const now = new Date()
    let startDate
    let dateFormat
      switch (timeframe) {
      case 'weekly':
        startDate = new Date(now)
        startDate.setDate(now.getDate() - 28)  // Last 4 weeks
        dateFormat = { month: 'short', day: 'numeric' }
        break
      case 'monthly': 
        startDate = new Date(now)
        startDate.setMonth(now.getMonth() - 6) // Last 6 months
        dateFormat = { year: 'numeric', month: 'short' }
        break
      case 'yearly':
        startDate = new Date(now)
        startDate.setMonth(now.getMonth() - 12) // Last 12 months
        dateFormat = { year: 'numeric', month: 'short' }
        break
      case 'daily':
      default:
        startDate = new Date(now)
        startDate.setDate(now.getDate() - 14) // Last 14 days
        dateFormat = { month: 'short', day: 'numeric' }
        break
    }
    
    // Get all scans in the date range
    const scans = await Scan.find({
      qrCode: { $in: qrCodeIds },
      timestamp: { $gte: startDate, $lte: now }
    }).sort({ timestamp: 1 })
    
    // Process scans into activity data based on timeframe
    const activityMap = new Map()
    
    scans.forEach(scan => {
      const scanDate = new Date(scan.timestamp)
      let key
      
      if (timeframe === 'monthly') {
        // Group by month
        key = `${scanDate.getFullYear()}-${scanDate.getMonth() + 1}`
      } else if (timeframe === 'weekly') {
        // Group by week (approximate using Sunday as first day)
        const dayOfYear = Math.floor((scanDate - new Date(scanDate.getFullYear(), 0, 0)) / (24 * 60 * 60 * 1000))
        const weekNumber = Math.ceil(dayOfYear / 7)
        key = `${scanDate.getFullYear()}-W${weekNumber}`
      } else {
        // Group by day
        key = scanDate.toISOString().split('T')[0]
      }
      
      if (activityMap.has(key)) {
        activityMap.set(key, activityMap.get(key) + 1)
      } else {
        activityMap.set(key, 1)
      }
    })
    
    // Convert map to array
    const activityData = Array.from(activityMap, ([date, scans]) => {
      // Format date for display
      let displayDate
      
      if (timeframe === 'monthly') {
        const [year, month] = date.split('-')
        const dateObj = new Date(parseInt(year), parseInt(month) - 1, 1)
        displayDate = dateObj.toLocaleDateString('en-US', { year: 'numeric', month: 'short' })
      } else if (timeframe === 'weekly') {
        const [year, week] = date.split('-W')
        displayDate = `Week ${week}, ${year}`
      } else {
        const dateObj = new Date(date)
        displayDate = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      }
      
      return {
        date: displayDate,
        originalDate: date,
        scans
      }
    })
      res.status(200).json({
      success: true,
      activityData,
      qrCodeCount: userQRCodes.length
    })
  } catch (error) {
    console.error("Error fetching scan activity:", error)
    res.status(500).json({
      success: false, 
      message: "Failed to fetch scan activity", 
      error: error.message    })
  }
})

// CSV Export endpoint
router.get('/export/csv', authenticate, async (req, res) => {
  try {
    const userId = req.user._id
    
    // Get user's QR codes
    const userQRCodes = await QRCode.find({ assignedTo: userId })
    
    if (!userQRCodes || userQRCodes.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No QR codes found for analytics export"
      })
    }

    const qrCodeIds = userQRCodes.map(qr => qr._id)
    
    // Get all scans for user's QR codes
    const scans = await Scan.find({
      qrCode: { $in: qrCodeIds }
    }).populate('qrCode', 'websiteTitle websiteURL').sort({ timestamp: -1 })
    
    // Generate CSV content
    let csvContent = "Date,Time,QR Code Title,URL,Device Type,OS,Browser,Device Model\n"
    
    scans.forEach(scan => {
      const date = new Date(scan.timestamp)
      const dateStr = date.toLocaleDateString()
      const timeStr = date.toLocaleTimeString()
      const title = scan.qrCode?.websiteTitle || 'Unknown'
      const url = scan.qrCode?.websiteURL || 'Unknown'
      const deviceType = scan.deviceInfo?.deviceType || 'Unknown'
      const os = scan.deviceInfo?.os || 'Unknown'
      const browser = scan.deviceInfo?.browser || 'Unknown'
      const deviceModel = scan.deviceInfo?.deviceModel || 'Unknown'
      
      csvContent += `"${dateStr}","${timeStr}","${title}","${url}","${deviceType}","${os}","${browser}","${deviceModel}"\n`
    })
    
    res.setHeader('Content-Type', 'text/csv')
    res.setHeader('Content-Disposition', 'attachment; filename="qr-analytics.csv"')
    res.status(200).send(csvContent)
    
  } catch (error) {
    console.error("Error exporting CSV:", error)
    res.status(500).json({
      success: false,
      message: "Failed to export CSV",
      error: error.message
    })
  }
})

// PDF Export endpoint
router.get('/export/pdf', authenticate, async (req, res) => {
  try {
    const userId = req.user._id
    
    // Get user's QR codes and analytics data
    const userQRCodes = await QRCode.find({ assignedTo: userId })
    
    if (!userQRCodes || userQRCodes.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No QR codes found for analytics export"
      })
    }

    const qrCodeIds = userQRCodes.map(qr => qr._id)
    const scans = await Scan.find({
      qrCode: { $in: qrCodeIds }
    }).populate('qrCode', 'websiteTitle websiteURL').sort({ timestamp: -1 })
    
    // Generate simple PDF content (basic HTML that can be converted to PDF)
    let pdfContent = `
    <html>
    <head>
      <title>QR Code Analytics Report</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        h1 { color: #333; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
        .summary { background-color: #f9f9f9; padding: 15px; margin: 20px 0; }
      </style>
    </head>
    <body>
      <h1>QR Code Analytics Report</h1>
      <div class="summary">
        <h2>Summary</h2>
        <p>Total QR Codes: ${userQRCodes.length}</p>
        <p>Total Scans: ${scans.length}</p>
        <p>Report Generated: ${new Date().toLocaleDateString()}</p>
      </div>
      <h2>Scan Details</h2>
      <table>
        <tr>
          <th>Date</th>
          <th>Time</th>
          <th>QR Code</th>
          <th>URL</th>
          <th>Device</th>
          <th>OS</th>
        </tr>
    `
    
    scans.slice(0, 100).forEach(scan => { // Limit to 100 most recent scans
      const date = new Date(scan.timestamp)
      pdfContent += `
        <tr>
          <td>${date.toLocaleDateString()}</td>
          <td>${date.toLocaleTimeString()}</td>
          <td>${scan.qrCode?.websiteTitle || 'Unknown'}</td>
          <td>${scan.qrCode?.websiteURL || 'Unknown'}</td>
          <td>${scan.deviceInfo?.deviceType || 'Unknown'}</td>
          <td>${scan.deviceInfo?.os || 'Unknown'}</td>
        </tr>
      `
    })
    
    pdfContent += `
      </table>
    </body>
    </html>
    `
    
    res.setHeader('Content-Type', 'text/html')
    res.setHeader('Content-Disposition', 'attachment; filename="qr-analytics-report.html"')
    res.status(200).send(pdfContent)
    
  } catch (error) {
    console.error("Error exporting PDF:", error)
    res.status(500).json({
      success: false,
      message: "Failed to export PDF",
      error: error.message
    })
  }
})

// Email Report endpoint
router.post('/export/email', authenticate, async (req, res) => {
  try {
    const userId = req.user._id
    const { email } = req.body
    
    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email address is required"
      })
    }
    
    // Get user's QR codes and analytics data
    const userQRCodes = await QRCode.find({ assignedTo: userId })
    
    if (!userQRCodes || userQRCodes.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No QR codes found for analytics export"
      })
    }    const qrCodeIds = userQRCodes.map(qr => qr._id)
    const scans = await Scan.find({
      qrCode: { $in: qrCodeIds }
    }).populate('qrCode', 'websiteTitle websiteURL').sort({ timestamp: -1 })
    
    // Generate analytics data for email
    const totalScans = scans.length
    const recentScans = scans.slice(0, 10)
    
    // Get device breakdown stats
    const deviceStats = await Scan.aggregate([
      {
        $match: { qrCode: { $in: qrCodeIds } }
      },
      {
        $group: {
          _id: null,
          android: { $sum: { $cond: ["$deviceInfo.isAndroid", 1, 0] } },
          ios: { $sum: { $cond: ["$deviceInfo.isIOS", 1, 0] } },
          desktop: { $sum: { $cond: ["$deviceInfo.isDesktop", 1, 0] } },
          mobile: { $sum: { $cond: ["$deviceInfo.isMobile", 1, 0] } },
          tablet: { $sum: { $cond: ["$deviceInfo.isTablet", 1, 0] } },
          total: { $sum: 1 }
        }
      }
    ])

    const stats = deviceStats[0] || { android: 0, ios: 0, desktop: 0, mobile: 0, tablet: 0, total: 0 }
    
    // Send email using the enhanced email service
    const { sendEmail } = require('../utils/emailService')
      const emailContent = {
      to: email,
      subject: 'QR Code Analytics Report',
      text: `
Hi there,

Please find your QR Code Analytics Report below:

Total QR Codes: ${userQRCodes.length}
Total Scans: ${totalScans}

Device Breakdown:
- Android: ${stats.android} scans
- iOS: ${stats.ios} scans  
- Desktop: ${stats.desktop} scans
- Mobile: ${stats.mobile} scans
- Tablet: ${stats.tablet} scans

Recent Activity:
${recentScans.slice(0, 5).map(scan => 
  `- ${new Date(scan.timestamp).toLocaleDateString()}: ${scan.deviceInfo?.deviceType || 'Unknown'} device`
).join('\n')}

For detailed analytics, please visit your dashboard.

Best regards,
Quench RBAC Team
      `,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h2 style="color: #333; margin: 0;">QR Code Analytics Report</h2>
            <p style="color: #666; margin: 5px 0 0 0;">Generated on ${new Date().toLocaleDateString()}</p>
          </div>
          
          <div style="background-color: white; padding: 20px; border: 1px solid #e9ecef; border-radius: 8px; margin-bottom: 20px;">
            <h3 style="color: #333; margin-top: 0;">Summary</h3>
            <ul style="list-style: none; padding: 0;">
              <li style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Total QR Codes:</strong> ${userQRCodes.length}</li>
              <li style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Total Scans:</strong> ${totalScans}</li>
            </ul>
          </div>

          <div style="background-color: white; padding: 20px; border: 1px solid #e9ecef; border-radius: 8px; margin-bottom: 20px;">
            <h3 style="color: #333; margin-top: 0;">Device Breakdown</h3>
            <ul style="list-style: none; padding: 0;">
              <li style="padding: 5px 0;"><strong>Android:</strong> ${stats.android} scans</li>
              <li style="padding: 5px 0;"><strong>iOS:</strong> ${stats.ios} scans</li>
              <li style="padding: 5px 0;"><strong>Desktop:</strong> ${stats.desktop} scans</li>
              <li style="padding: 5px 0;"><strong>Mobile:</strong> ${stats.mobile} scans</li>
              <li style="padding: 5px 0;"><strong>Tablet:</strong> ${stats.tablet} scans</li>
            </ul>
          </div>

          <div style="background-color: white; padding: 20px; border: 1px solid #e9ecef; border-radius: 8px;">
            <h3 style="color: #333; margin-top: 0;">Recent Activity</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <thead>
                <tr style="background-color: #f8f9fa;">
                  <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Date</th>
                  <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Device</th>
                </tr>
              </thead>
              <tbody>
                ${recentScans.slice(0, 10).map(scan => `
                  <tr>
                    <td style="border: 1px solid #ddd; padding: 8px;">${new Date(scan.timestamp).toLocaleDateString()}</td>
                    <td style="border: 1px solid #ddd; padding: 8px;">${scan.deviceInfo?.deviceType || 'Unknown'}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
            <p style="margin-top: 20px;">For detailed analytics, please visit your dashboard.</p>
          </div>
          
          <div style="text-align: center; margin-top: 20px; padding: 15px; background-color: #f8f9fa; border-radius: 8px;">
            <p style="color: #666; font-size: 12px; margin: 0;">
              This report was generated by the Quench RBAC system.
            </p>
          </div>
        </div>
      `
    }
    
    const result = await sendEmail(emailContent)
    
    res.status(200).json({
      success: true,
      message: `Analytics report has been sent to ${email}`,
      emailResult: {
        messageId: result.messageId,
        provider: result.provider,
        timestamp: result.timestamp
      }
    })
    
  } catch (error) {
    console.error("Error sending email report:", error)
    res.status(500).json({
      success: false,
      message: "Failed to send email report",
      error: error.message
    })
  }
})

module.exports = router
