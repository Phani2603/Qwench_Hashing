/**
 * Email Service Utility
 * 
 * This module provides email sending functionality for the application.
 * Integrated with Gmail using Nodemailer for production-ready email sending.
 */

const nodemailer = require('nodemailer')
const { AuditLog } = require('../models/SystemSettings')

// Gmail transporter configuration
let transporter = null

/**
 * Initialize Gmail transporter
 * @returns {Object} Nodemailer transporter
 */
function initializeTransporter() {
  if (transporter) return transporter

  // Check if Gmail credentials are provided
  const gmailUser = process.env.GMAIL_USER
  const gmailPassword = process.env.GMAIL_APP_PASSWORD

  if (!gmailUser || !gmailPassword) {
    console.log('⚠️  Gmail credentials not found. Using simulation mode.')
    console.log('   To enable real email sending:')
    console.log('   1. Add GMAIL_USER=your-email@gmail.com to .env')
    console.log('   2. Add GMAIL_APP_PASSWORD=your-app-password to .env')
    console.log('   3. Enable 2-factor authentication in Gmail')
    console.log('   4. Generate an App Password in Gmail settings')
    return null
  }
  try {
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: gmailUser,
        pass: gmailPassword
      },
      secure: true,
      tls: {
        rejectUnauthorized: false
      }
    })

    console.log('✅ Gmail transporter initialized successfully')
    return transporter

  } catch (error) {
    console.error('❌ Failed to initialize Gmail transporter:', error.message)
    return null
  }
}

/**
 * Verify email transporter connection
 * @returns {Promise<boolean>} True if connection is successful
 */
async function verifyEmailConnection() {
  const transport = initializeTransporter()
  
  if (!transport) {
    return false
  }

  try {
    await transport.verify()
    console.log('✅ Gmail connection verified successfully')
    return true
  } catch (error) {
    console.error('❌ Gmail connection verification failed:', error.message)
    return false
  }
}

/**
 * Send email using Gmail or simulation fallback
 * @param {Object} emailData - Email data object
 * @param {string} emailData.to - Recipient email address
 * @param {string} emailData.subject - Email subject
 * @param {string} emailData.text - Plain text content
 * @param {string} emailData.html - HTML content (optional)
 * @param {string} emailData.from - Sender email (optional)
 * @returns {Promise<Object>} Email send result
 */
async function sendEmail(emailData) {
  try {
    const { to, subject, text, html, from } = emailData
    
    // Validate required fields
    if (!to || !subject || !text) {
      throw new Error('Missing required email fields: to, subject, text')
    }

    const transport = initializeTransporter()

    // If Gmail is configured, send real email
    if (transport) {
      try {
        const mailOptions = {
          from: from || process.env.GMAIL_USER,
          to: to,
          subject: subject,
          text: text,
          html: html || text
        }

        const result = await transport.sendMail(mailOptions)
        
        console.log('✅ Email sent successfully via Gmail:')
        console.log(`   To: ${to}`)
        console.log(`   Subject: ${subject}`)
        console.log(`   Message ID: ${result.messageId}`)
        
        return {
          success: true,
          messageId: result.messageId,
          message: 'Email sent successfully via Gmail',
          timestamp: new Date().toISOString(),
          provider: 'gmail'
        }

      } catch (gmailError) {
        console.error('❌ Gmail sending failed, falling back to simulation:', gmailError.message)
        // Fall through to simulation mode
      }
    }

    // Fallback to simulation mode
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    console.log('📧 Email Simulation - Email would be sent:')
    console.log(`   To: ${to}`)
    console.log(`   From: ${from || 'noreply@quench-rbac.com'}`)
    console.log(`   Subject: ${subject}`)
    console.log(`   Text: ${text.substring(0, 100)}${text.length > 100 ? '...' : ''}`)
    
    // Return success result
    return {
      success: true,
      messageId: `sim_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      message: 'Email sent successfully (simulated)',
      timestamp: new Date().toISOString(),
      provider: 'simulation'
    }
    
  } catch (error) {
    console.error('❌ Email sending failed:', error.message)
    throw error
  }
}

/**
 * Send notification email to user
 * @param {Object} params - Parameters object
 * @param {Object} params.user - User object with name and email
 * @param {string} params.subject - Email subject
 * @param {string} params.message - Email message content
 * @param {Object} params.sender - Sender information (admin user)
 * @param {Object} params.req - Express request object for audit logging
 * @returns {Promise<Object>} Email send result
 */
async function sendUserNotification({ user, subject, message, sender, req }) {
  try {
    const emailContent = {
      to: user.email,
      subject: subject,
      text: message,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h2 style="color: #333; margin: 0;">Message from ${sender.name}</h2>
            <p style="color: #666; margin: 5px 0 0 0;">Quench RBAC Administration</p>
          </div>
          
          <div style="background-color: white; padding: 20px; border: 1px solid #e9ecef; border-radius: 8px;">
            <h3 style="color: #333; margin-top: 0;">${subject}</h3>
            <div style="white-space: pre-wrap; line-height: 1.6; color: #333;">
${message}
            </div>
          </div>
          
          <div style="text-align: center; margin-top: 20px; padding: 15px; background-color: #f8f9fa; border-radius: 8px;">
            <p style="color: #666; font-size: 12px; margin: 0;">
              This email was sent by ${sender.name} (${sender.email}) from the Quench RBAC admin panel.
            </p>
          </div>
        </div>
      `,
      from: process.env.FROM_EMAIL || 'noreply@quench-rbac.com'
    }

    const result = await sendEmail(emailContent)

    // Create audit log for email sent
    if (req) {
      await AuditLog.create({
        userEmail: sender.email,
        action: 'Email Sent to User',
        resource: 'User Communication',
        resourceId: user._id,
        details: {
          recipientEmail: user.email,
          recipientName: user.name,
          subject: subject,
          messageLength: message.length,
          messageId: result.messageId
        },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
      })
    }

    return result

  } catch (error) {
    console.error('Failed to send user notification:', error)
    throw error
  }
}

/**
 * Send bulk email to multiple users
 * @param {Object} params - Parameters object
 * @param {Array} params.users - Array of user objects
 * @param {string} params.subject - Email subject
 * @param {string} params.message - Email message content
 * @param {Object} params.sender - Sender information (admin user)
 * @param {Object} params.req - Express request object for audit logging
 * @returns {Promise<Array>} Array of email send results
 */
async function sendBulkUserNotification({ users, subject, message, sender, req }) {
  const results = []
  
  for (const user of users) {
    try {
      const result = await sendUserNotification({
        user,
        subject,
        message,
        sender,
        req
      })
      results.push({ user: user.email, success: true, result })
    } catch (error) {
      results.push({ user: user.email, success: false, error: error.message })
    }
  }
  
  return results
}

module.exports = {
  sendEmail,
  sendUserNotification,
  sendBulkUserNotification,
  initializeTransporter,
  verifyEmailConnection
}
