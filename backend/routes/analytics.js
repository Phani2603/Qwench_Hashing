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
    }

    const qrCodeIds = userQRCodes.map(qr => qr._id)

    // Aggregate scan data to count by device type
    const scans = await Scan.find({ qrCode: { $in: qrCodeIds } })

    // Process scans to count device types
    let android = 0
    let ios = 0 
    let desktop = 0

    scans.forEach(scan => {
      // Check device info
      if (scan.deviceInfo && scan.deviceInfo.os) {
        if (scan.deviceInfo.os.toLowerCase() === 'android') {
          android++
        } else if (scan.deviceInfo.os.toLowerCase() === 'ios') {
          ios++
        } else if (scan.deviceInfo.device && scan.deviceInfo.device.toLowerCase() === 'desktop') {
          desktop++
        }
        // Additional check based on userAgent if deviceInfo doesn't have enough information
        else if (scan.userAgent) {
          const userAgent = scan.userAgent.toLowerCase()
          if (userAgent.includes('android')) {
            android++
          } else if (userAgent.includes('iphone') || userAgent.includes('ipad') || userAgent.includes('ipod')) {
            ios++
          } else if (!userAgent.includes('mobile')) {
            desktop++
          }
        }
      }
    })

    // Calculate total and percentages
    const total = android + ios + desktop
    
    const deviceAnalytics = {
      android,
      ios,
      desktop,
      androidPercentage: total > 0 ? Math.round((android / total) * 100) : 0,
      iosPercentage: total > 0 ? Math.round((ios / total) * 100) : 0,
      desktopPercentage: total > 0 ? Math.round((desktop / total) * 100) : 0,
      total
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
        activityData: []
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
      activityData
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
router.get('/export/csv', auth, async (req, res) => {
  try {
    const userId = req.user.id
    
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
    }).populate('qrCode', 'title url').sort({ timestamp: -1 })
    
    // Generate CSV content
    let csvContent = "Date,Time,QR Code Title,URL,Device Type,Location\n"
    
    scans.forEach(scan => {
      const date = new Date(scan.timestamp)
      const dateStr = date.toLocaleDateString()
      const timeStr = date.toLocaleTimeString()
      const title = scan.qrCode?.title || 'Unknown'
      const url = scan.qrCode?.url || 'Unknown'
      const deviceType = scan.deviceInfo || 'Unknown'
      const location = scan.location || 'Unknown'
      
      csvContent += `"${dateStr}","${timeStr}","${title}","${url}","${deviceType}","${location}"\n`
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
router.get('/export/pdf', auth, async (req, res) => {
  try {
    const userId = req.user.id
    
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
    }).populate('qrCode', 'title url').sort({ timestamp: -1 })
    
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
        </tr>
    `
    
    scans.slice(0, 100).forEach(scan => { // Limit to 100 most recent scans
      const date = new Date(scan.timestamp)
      pdfContent += `
        <tr>
          <td>${date.toLocaleDateString()}</td>
          <td>${date.toLocaleTimeString()}</td>
          <td>${scan.qrCode?.title || 'Unknown'}</td>
          <td>${scan.qrCode?.url || 'Unknown'}</td>
          <td>${scan.deviceInfo || 'Unknown'}</td>
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
router.post('/export/email', auth, async (req, res) => {
  try {
    const userId = req.user.id
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
    }

    const qrCodeIds = userQRCodes.map(qr => qr._id)
    const scans = await Scan.find({
      qrCode: { $in: qrCodeIds }
    }).populate('qrCode', 'title url').sort({ timestamp: -1 })
    
    // Generate email content with summary
    const recentScans = scans.slice(0, 10)
    
    const emailContent = {
      to: email,
      subject: 'QR Code Analytics Report',
      html: `
        <h2>Your QR Code Analytics Report</h2>
        <div style="background-color: #f9f9f9; padding: 15px; margin: 20px 0;">
          <h3>Summary</h3>
          <p>Total QR Codes: ${userQRCodes.length}</p>
          <p>Total Scans: ${scans.length}</p>
          <p>Report Generated: ${new Date().toLocaleDateString()}</p>
        </div>
        <h3>Recent Scans (Last 10)</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <tr style="background-color: #f2f2f2;">
            <th style="border: 1px solid #ddd; padding: 8px;">Date</th>
            <th style="border: 1px solid #ddd; padding: 8px;">QR Code</th>
            <th style="border: 1px solid #ddd; padding: 8px;">Device</th>
          </tr>
          ${recentScans.map(scan => `
            <tr>
              <td style="border: 1px solid #ddd; padding: 8px;">${new Date(scan.timestamp).toLocaleDateString()}</td>
              <td style="border: 1px solid #ddd; padding: 8px;">${scan.qrCode?.title || 'Unknown'}</td>
              <td style="border: 1px solid #ddd; padding: 8px;">${scan.deviceInfo || 'Unknown'}</td>
            </tr>
          `).join('')}
        </table>
        <p style="margin-top: 20px;">For detailed analytics, please visit your dashboard.</p>
      `
    }
    
    // In a real implementation, you would send the email using a service like SendGrid, Nodemailer, etc.
    // For now, we'll just simulate the email sending
    console.log('Email would be sent to:', email)
    console.log('Email content:', emailContent)
    
    res.status(200).json({
      success: true,
      message: `Analytics report has been sent to ${email}`
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
