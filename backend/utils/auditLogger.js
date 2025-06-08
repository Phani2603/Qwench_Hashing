const { AuditLog } = require('../models/SystemSettings');

/**
 * Creates an audit log entry
 * @param {Object} req - Express request object
 * @param {string} action - The action being performed (e.g., "User Login", "QR Code Creation")
 * @param {string} resource - The resource being acted upon (e.g., "User", "QR Code")
 * @param {string} resourceId - The ID of the resource (optional)
 * @param {Object} details - Additional details about the action (optional)
 * @param {string} userEmail - The email of the user performing the action (defaults to req.user.email)
 * @returns {Promise<Object>} - The created audit log entry
 */
const createAuditLog = async (req, action, resource, resourceId = null, details = {}, userEmail = null) => {
  try {
    return await AuditLog.create({
      userEmail: userEmail || req.user.email,
      action,
      resource,
      resourceId,
      details,
      ipAddress: req.ip || req.connection.remoteAddress || 'Unknown',
      userAgent: req.get('User-Agent') || 'Unknown',
    });
  } catch (error) {
    console.error('Error creating audit log:', error);
    // Don't throw error to prevent disrupting the main operation
    return null;
  }
};

module.exports = {
  createAuditLog
};
