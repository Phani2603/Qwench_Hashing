# Next Changes Required - QR Analytics Fix

## 🚨 Critical Issues to Fix

### Issue 1: Analytics Routes Not Deployed (404 Errors)
**Problem**: The analytics endpoints are returning 404 errors on production
```
quench-rbac-backend-production.up.railway.app/api/analytics/devices:1 Failed to load resource: the server responded with a status of 404
quench-rbac-backend-production.up.railway.app/api/analytics/activity?timeframe=daily:1 Failed to load resource: the server responded with a status of 404
quench-rbac-backend-production.up.railway.app/api/analytics/export/csv:1 Failed to load resource: the server responded with a status of 404
```

**Root Cause**: Analytics routes may not be properly registered in the production server.js

### Issue 2: Scan Model Missing Required Analytics Fields
**CRITICAL PROBLEM**: The current Scan model doesn't have the necessary fields for device analytics

**Current Scan Schema** (Limited):
```javascript
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
}
```

**Missing Fields for Analytics**:
- Device type detection (mobile/tablet/desktop)
- Specific OS versions 
- Browser versions
- Boolean flags for quick filtering
- Location data (optional)

### Issue 3: QR Scan Recording Logic Missing Device Detection
**Problem**: The current QR scan endpoint doesn't parse user agents or populate deviceInfo properly

## 🔧 Required Changes

### 1. Update Scan Model Schema

**File**: `backend/models/Scan.js`
**Add Enhanced Device Detection Fields**:

```javascript
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

// Index for efficient analytics queries
scanSchema.index({ codeId: 1, timestamp: -1 })
scanSchema.index({ timestamp: -1 })
scanSchema.index({ 'deviceInfo.deviceType': 1 })
scanSchema.index({ 'deviceInfo.isAndroid': 1 })
scanSchema.index({ 'deviceInfo.isIOS': 1 })
scanSchema.index({ 'deviceInfo.isDesktop': 1 })
```

### 2. Install User Agent Parsing Library

**Install ua-parser-js**:
```bash
cd backend
npm install ua-parser-js
```

### 3. Update QR Scan Recording Logic

**File**: `backend/routes/qrRoutes.js` or wherever QR scanning is handled
**Add Device Detection Logic**:

```javascript
const UAParser = require('ua-parser-js');

// In your QR scan endpoint (wherever it currently exists)
router.get('/scan/:codeId', async (req, res) => {
  try {
    const { codeId } = req.params;
    
    // Find the QR code
    const qrCode = await QRCode.findOne({ codeId });
    if (!qrCode) {
      return res.status(404).json({ error: 'QR code not found' });
    }
    
    // Parse user agent for device info
    const userAgent = req.headers['user-agent'] || '';
    const parser = new UAParser(userAgent);
    const result = parser.getResult();
    
    // Create enhanced device info
    const deviceInfo = {
      // Basic info
      browser: result.browser.name || 'Unknown',
      browserVersion: result.browser.version || 'Unknown',
      os: result.os.name || 'Unknown',
      osVersion: result.os.version || 'Unknown',
      device: result.device.model || 'Unknown',
      deviceType: result.device.type || 'unknown',
      deviceModel: result.device.model || 'Unknown',
      
      // Boolean flags for quick analytics
      isAndroid: /android/i.test(userAgent),
      isIOS: /iphone|ipad|ipod/i.test(userAgent),
      isDesktop: !(/mobile|android|iphone|ipad|ipod|tablet/i.test(userAgent)),
      isMobile: /mobile|android|iphone|ipod/i.test(userAgent),
      isTablet: /ipad|tablet/i.test(userAgent),
    };
    
    // Optional: Add location detection (requires IP geolocation service)
    const location = {
      country: 'Unknown',
      region: 'Unknown', 
      city: 'Unknown',
      latitude: null,
      longitude: null,
    };
    
    // Create scan record with enhanced data
    const scanRecord = new Scan({
      codeId,
      qrCode: qrCode._id,
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent,
      deviceInfo,
      location, // Optional
    });
    
    await scanRecord.save();
    
    // Increment QR code scan count
    qrCode.scanCount = (qrCode.scanCount || 0) + 1;
    await qrCode.save();
    
    // Redirect to destination URL
    res.redirect(qrCode.url);
    
  } catch (error) {
    console.error('Error recording QR scan:', error);
    res.status(500).json({ error: 'Failed to process QR scan' });
  }
});
```

### 4. Update Analytics Routes to Use New Fields

**File**: `backend/routes/analytics.js`
**Use Enhanced Device Detection**:

```javascript
// Device Analytics with new boolean flags
router.get("/devices", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    // Get user's QR codes
    const userQRCodes = await QRCode.find({ userId });
    const qrCodeIds = userQRCodes.map(qr => qr._id);

    if (qrCodeIds.length === 0) {
      return res.json({
        success: true,
        deviceAnalytics: {
          android: 0, ios: 0, desktop: 0,
          androidPercentage: 0, iosPercentage: 0, desktopPercentage: 0,
          total: 0
        }
      });
    }

    // Use new boolean fields for efficient counting
    const [androidCount, iosCount, desktopCount, totalCount] = await Promise.all([
      Scan.countDocuments({ qrCode: { $in: qrCodeIds }, 'deviceInfo.isAndroid': true }),
      Scan.countDocuments({ qrCode: { $in: qrCodeIds }, 'deviceInfo.isIOS': true }),
      Scan.countDocuments({ qrCode: { $in: qrCodeIds }, 'deviceInfo.isDesktop': true }),
      Scan.countDocuments({ qrCode: { $in: qrCodeIds } })
    ]);

    const deviceAnalytics = {
      android: androidCount,
      ios: iosCount,
      desktop: desktopCount,
      androidPercentage: totalCount > 0 ? Math.round((androidCount / totalCount) * 100) : 0,
      iosPercentage: totalCount > 0 ? Math.round((iosCount / totalCount) * 100) : 0,
      desktopPercentage: totalCount > 0 ? Math.round((desktopCount / totalCount) * 100) : 0,
      total: totalCount
    };

    res.json({ success: true, deviceAnalytics });
  } catch (error) {
    console.error("Error fetching device analytics:", error);
    res.status(500).json({ success: false, error: "Failed to fetch device analytics" });
  }
});
```

## 📋 Migration Required

### Database Migration Steps
Since you're adding new fields to existing Scan documents:

1. **Option A: Update Existing Scans** (Recommended for small datasets)
```javascript
// Migration script to update existing scan records
db.scans.updateMany(
  {},
  {
    $set: {
      "deviceInfo.browserVersion": "Unknown",
      "deviceInfo.osVersion": "Unknown", 
      "deviceInfo.deviceType": "unknown",
      "deviceInfo.deviceModel": "Unknown",
      "deviceInfo.isAndroid": false,
      "deviceInfo.isIOS": false,
      "deviceInfo.isDesktop": false,
      "deviceInfo.isMobile": false,
      "deviceInfo.isTablet": false,
      "location.country": "Unknown",
      "location.region": "Unknown",
      "location.city": "Unknown",
      "location.latitude": null,
      "location.longitude": null
    }
  }
)
```

2. **Option B: Start Fresh** (If you don't need historical scan data)
```javascript
// Clear existing scans and start with new schema
db.scans.deleteMany({})
```

## 🚀 Priority Order (Updated)

1. **CRITICAL**: Update Scan model schema with new fields
2. **CRITICAL**: Install ua-parser-js library  
3. **HIGH**: Update QR scan recording logic
4. **HIGH**: Fix analytics route registration
5. **HIGH**: Update analytics logic to use new fields
6. **MEDIUM**: Run database migration
7. **MEDIUM**: Test and deploy to production
8. **LOW**: Add geographic analytics features

## 🔄 Current Status (Updated)

- ✅ Frontend components implemented and working
- ✅ TypeScript errors resolved  
- ✅ UI components integrated in dashboard
- ❌ **Scan model missing analytics fields** (CRITICAL)
- ❌ **Device detection not implemented in scan recording** (CRITICAL)
- ❌ Backend routes not accessible (404 errors)
- ❌ Analytics logic needs schema alignment
- ❌ Production deployment incomplete

**Next Step**: Update Scan model schema and implement device detection in QR scan recording.
