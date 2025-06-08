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

module.exports = mongoose.model("Scan", scanSchema)
