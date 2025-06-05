const express = require("express")
const router = express.Router()
const QRCode = require("../models/QRCode")
const Scan = require("../models/Scan")

// Helper function to parse user agent
const parseUserAgent = (userAgent) => {
  const browser = userAgent.includes("Chrome")
    ? "Chrome"
    : userAgent.includes("Firefox")
      ? "Firefox"
      : userAgent.includes("Safari")
        ? "Safari"
        : userAgent.includes("Edge")
          ? "Edge"
          : "Unknown"

  const os = userAgent.includes("Windows")
    ? "Windows"
    : userAgent.includes("Mac")
      ? "macOS"
      : userAgent.includes("Linux")
        ? "Linux"
        : userAgent.includes("Android")
          ? "Android"
          : userAgent.includes("iOS")
            ? "iOS"
            : "Unknown"

  const device = userAgent.includes("Mobile") ? "Mobile" : userAgent.includes("Tablet") ? "Tablet" : "Desktop"

  return { browser, os, device }
}

// Public scan route - redirects and logs the scan
router.get("/:codeId", async (req, res) => {
  try {
    const { codeId } = req.params
    const ipAddress = req.ip || req.connection.remoteAddress || req.headers["x-forwarded-for"] || "Unknown"
    const userAgent = req.headers["user-agent"] || "Unknown"

    // Find the QR code
    const qrCode = await QRCode.findOne({ codeId, isActive: true })
      .populate("assignedTo", "name email")
      .populate("category", "name")

    if (!qrCode) {
      return res.status(404).send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>QR Code Not Found</title>
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
            .error { color: #e74c3c; }
          </style>
        </head>
        <body>
          <h1 class="error">QR Code Not Found</h1>
          <p>The QR code you scanned is invalid or has been deactivated.</p>
        </body>
        </html>
      `)
    }

    // Parse device information
    const deviceInfo = parseUserAgent(userAgent)

    // Log the scan
    const scan = new Scan({
      codeId,
      qrCode: qrCode._id,
      ipAddress,
      userAgent,
      deviceInfo,
    })

    await scan.save()

    // Update QR code scan count and last scanned time
    await QRCode.findByIdAndUpdate(qrCode._id, {
      $inc: { scanCount: 1 },
      lastScanned: new Date(),
    })

    // Redirect to the website URL
    let redirectURL = qrCode.websiteURL.trim()

    // Add protocol if missing
    if (!redirectURL.startsWith("http://") && !redirectURL.startsWith("https://")) {
      redirectURL = "https://" + redirectURL
    }

    return res.redirect(redirectURL)
  } catch (error) {
    console.error("Scan tracking error:", error)
    res.status(500).send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Error</title>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
          .error { color: #e74c3c; }
        </style>
      </head>
      <body>
        <h1 class="error">Error</h1>
        <p>An error occurred while processing your request.</p>
      </body>
      </html>
    `)
  }
})

module.exports = router
