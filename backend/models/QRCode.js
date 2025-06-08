const mongoose = require("mongoose")
const { v4: uuidv4 } = require("uuid")

const qrCodeSchema = new mongoose.Schema(
  {
    codeId: {
      type: String,
      default: uuidv4,
      unique: true,
      required: true,
    },
    imageURL: {
      type: String,
      required: true,
    },
    websiteURL: {
      type: String,
      required: true,
      trim: true,
    },
    websiteTitle: {
      type: String,
      required: true,
      trim: true,
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    scanCount: {
      type: Number,
      default: 0,
    },
    lastScanned: {
      type: Date,
    },
  },
  {
    timestamps: true,
  },
)

module.exports = mongoose.model("QRCode", qrCodeSchema)
