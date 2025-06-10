const mongoose = require("mongoose")

const scanSchema = new mongoose.Schema(
  {
    codeId: {
      type: String,
      required: true,
      index: true,
    },
    qrCode: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "QRCode",
      required: true,
    },
    ipAddress: {
      type: String,
      required: true,
    },
    userAgent: {
      type: String,
      required: true,
    },
    deviceInfo: {
      // Basic info (existing)
      browser: {
        type: String,
        default: "Unknown",
      },
      os: {
        type: String,
        default: "Unknown",
      },
      device: {
        type: String,
        default: "Unknown",
      },
      
      // NEW FIELDS FOR ANALYTICS
      browserVersion: {
        type: String,
        default: "Unknown",
      },
      osVersion: {
        type: String,
        default: "Unknown",
      },
      deviceType: {
        type: String,
        enum: ['mobile', 'tablet', 'desktop', 'unknown'],
        default: 'unknown',
      },
      deviceModel: {
        type: String,
        default: "Unknown",
      },
      
      // Boolean flags for quick filtering
      isAndroid: {
        type: Boolean,
        default: false,
      },
      isIOS: {
        type: Boolean,
        default: false,
      },
      isDesktop: {
        type: Boolean,
        default: false,
      },
      isMobile: {
        type: Boolean,
        default: false,
      },
      isTablet: {
        type: Boolean,
        default: false,
      },
    },
    
    // Optional location data for geographic analytics
    location: {
      country: {
        type: String,
        default: "Unknown",
      },
      region: {
        type: String,
        default: "Unknown",
      },
      city: {
        type: String,
        default: "Unknown",
      },
      latitude: {
        type: Number,
        default: null,
      },
      longitude: {
        type: Number,
        default: null,
      },
    },
    
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  },
)

// Index for efficient queries
scanSchema.index({ codeId: 1, timestamp: -1 })
scanSchema.index({ timestamp: -1 })

// Index for efficient analytics queries
scanSchema.index({ 'deviceInfo.deviceType': 1 })
scanSchema.index({ 'deviceInfo.isAndroid': 1 })
scanSchema.index({ 'deviceInfo.isIOS': 1 })
scanSchema.index({ 'deviceInfo.isDesktop': 1 })

module.exports = mongoose.model("Scan", scanSchema)
