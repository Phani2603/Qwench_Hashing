const mongoose = require("mongoose")

const ipRestrictionSchema = new mongoose.Schema(
  {
    ipAddress: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    isAllowed: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
)

const certificateSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    commonName: {
      type: String,
      required: true,
      trim: true,
    },
    issuer: {
      type: String,
      trim: true,
    },
    expiryDate: {
      type: Date,
      required: true,
    },
    certificateFile: {
      type: String, // Path to the certificate file on server
    },
    keyFile: {
      type: String, // Path to the private key file
    },
  },
  {
    timestamps: true,
  }
)

const backupSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      required: true,
      enum: ["Full", "Database", "Configurations", "Manual"],
      default: "Manual",
    },
    size: {
      type: String, // Size in human-readable format (e.g., "12.5 MB")
      required: true,
    },
    sizeInBytes: {
      type: Number, // Actual size in bytes for sorting
      required: true,
    },
    status: {
      type: String,
      enum: ["Completed", "In Progress", "Failed"],
      default: "Completed",
    },
    path: {
      type: String, // Path to the backup file
      required: true,
    },
  },
  {
    timestamps: true,
  }
)

const auditLogSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    userEmail: {
      type: String,
      required: true,
    },
    action: {
      type: String,
      required: true,
    },
    resource: {
      type: String,
      required: true,
    },
    resourceId: {
      type: String,
    },
    details: {
      type: mongoose.Schema.Types.Mixed,
    },
    ipAddress: {
      type: String,
    },
    userAgent: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
)

const systemSettingsSchema = new mongoose.Schema(
  {
    security: {
      twoFactorEnabled: {
        type: Boolean,
        default: false,
      },
      sessionTimeout: {
        type: Number,
        default: 30, // minutes
      },
      maxLoginAttempts: {
        type: Number,
        default: 5,
      },
      passwordMinLength: {
        type: Number,
        default: 8,
      },
      requireSpecialChars: {
        type: Boolean,
        default: true,
      },
      apiRateLimit: {
        type: Number,
        default: 1000, // requests per hour
      },
      ipRestrictions: {
        enabled: {
          type: Boolean,
          default: false,
        },
        allowedIPs: [ipRestrictionSchema],
        blockedIPs: [ipRestrictionSchema],
      },
      sslEnabled: {
        type: Boolean,
        default: false,
      },
    },
    backup: {
      autoBackupEnabled: {
        type: Boolean,
        default: false,
      },
      backupSchedule: {
        type: String,
        enum: ["daily", "weekly", "monthly"],
        default: "weekly",
      },
      backupTime: {
        type: String,
        default: "00:00", // Format: HH:MM in 24-hour format
      },
      retentionDays: {
        type: Number,
        default: 30,
      },
    },
  },
  {
    timestamps: true,
  }
)

// Creating models
const SystemSettings = mongoose.model("SystemSettings", systemSettingsSchema)
const Backup = mongoose.model("Backup", backupSchema)
const Certificate = mongoose.model("Certificate", certificateSchema)
const AuditLog = mongoose.model("AuditLog", auditLogSchema)

module.exports = {
  SystemSettings,
  Backup,
  Certificate,
  AuditLog,
}
