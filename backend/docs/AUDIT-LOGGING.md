# Audit Logging System Documentation

## Overview

The audit logging system tracks important operations and changes within the application for security, compliance, and troubleshooting purposes. Each audit log captures who performed an action, what action was performed, when it happened, and additional context.

## Audit Log Structure

Each audit log entry includes:

- **User Email**: The email of the user who performed the action
- **Action**: The specific action performed (e.g., "QR Code Deletion", "User Login")
- **Resource**: The type of resource affected (e.g., "QR Code", "User", "Category")
- **Resource ID**: Identifier for the specific resource (when applicable)
- **Details**: Additional context-specific information about the action
- **IP Address**: The IP address from which the action was performed
- **User Agent**: Browser/client information
- **Timestamp**: When the action occurred (automatically added via timestamps)

## Current Implementation

The system currently logs the following operations:

### Security & Authentication
- User Registration
- User Login
- Initial Admin Setup
- Password Changes
- User Role Updates

### QR Code Management
- QR Code Creation
- QR Code Deletion

### User Management
- Profile Updates
- Website URL Addition
- Website URL Update
- Website URL Deletion
- User Deletion (by admin)

### Category Management
- Category Creation
- Category Update
- Category Deletion

### System Settings
- Security Settings Updates
- Backup Operations
- Certificate Management
- IP Restrictions Management

## Using the Audit Logger

A utility function is provided for creating consistent audit log entries:

```javascript
const { createAuditLog } = require('../utils/auditLogger');

// Example usage
await createAuditLog(
  req,                    // Express request object
  "QR Code Deletion",     // Action
  "QR Code",              // Resource type
  codeId,                 // Resource ID
  {                       // Additional details
    websiteTitle: qrCode.websiteTitle,
    websiteURL: qrCode.websiteURL,
    scanCount: qrCode.scanCount
  }
);
```

## Viewing Audit Logs

Audit logs can be viewed in the admin dashboard under the Settings section. The logs can be filtered by:

- User
- Action type
- Resource type
- Date range

## Best Practices

When adding new audit logs:

1. Use the `createAuditLog` utility function for consistency
2. For updates, include both the previous and new values in the details
3. For deletions, include key information about the deleted resource for future reference
4. Use clear, consistent action names (follow existing naming conventions)
5. Include meaningful details that would help an administrator understand what happened

## Future Enhancements

Potential future improvements:

1. Export audit logs (CSV, PDF)
2. Advanced filtering options
3. Configurable retention periods
4. Alert triggers for specific high-risk actions
5. Dashboard visualizations of audit activity
