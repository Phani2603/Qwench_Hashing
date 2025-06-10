# 📧 Gmail Integration Setup Guide

## Overview

The Quench RBAC system now includes Gmail integration for sending real emails to users. This guide will help you configure Gmail to work with the application.

## Prerequisites

- Gmail account
- 2-factor authentication enabled on Gmail
- App Password generated for the application

## Setup Instructions

### Step 1: Enable 2-Factor Authentication

1. Go to [Google Account Security](https://myaccount.google.com/security)
2. Under "Signing in to Google", click on "2-Step Verification"
3. Follow the prompts to enable 2-factor authentication
4. Verify it's working by signing out and back in

### Step 2: Generate App Password

1. Go to [Google Account Security](https://myaccount.google.com/security)
2. Under "Signing in to Google", click on "App passwords"
3. You may need to sign in again
4. Select "Mail" for the app and "Other (Custom name)" for device
5. Enter "Quench RBAC System" as the custom name
6. Click "Generate"
7. **Copy the 16-character password immediately** (you won't see it again)

### Step 3: Configure Environment Variables

#### Development (.env)
Add these lines to your `backend/.env` file:

```env
# Gmail Configuration
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=your-16-character-app-password
```

#### Production (.env.production)
Add these lines to your `backend/.env.production` file:

```env
# Gmail Configuration
GMAIL_USER=your-production-email@gmail.com
GMAIL_APP_PASSWORD=your-16-character-app-password
```

**⚠️ Security Note**: Never commit these credentials to version control. Always use environment variables or secure secret management.

### Step 4: Test the Configuration

Run the test script to verify everything is working:

```bash
cd backend
node scripts/test-gmail-integration.js
```

## Configuration Examples

### Example .env Configuration
```env
# Gmail Configuration (Development)
GMAIL_USER=admin@yourcompany.com
GMAIL_APP_PASSWORD=abcd efgh ijkl mnop
```

### Example Production Configuration
```env
# Gmail Configuration (Production)
GMAIL_USER=noreply@yourcompany.com
GMAIL_APP_PASSWORD=wxyz abcd efgh ijkl
```

## Email Features

Once configured, the system will send real emails for:

1. **Admin User Notifications**: Emails sent from admin panel to users
2. **Analytics Reports**: PDF/CSV reports sent via email
3. **System Notifications**: Account-related communications

## Fallback Behavior

If Gmail credentials are not configured or fail:
- System automatically falls back to simulation mode
- Emails are logged to console instead of being sent
- All functionality continues to work normally
- No errors or crashes occur

## Troubleshooting

### Common Issues

1. **Authentication Failed**
   - Verify 2-factor authentication is enabled
   - Regenerate the App Password
   - Ensure you're using the App Password, not your regular password

2. **Connection Timeout**
   - Check internet connection
   - Verify firewall isn't blocking SMTP connections
   - Try a different network

3. **Invalid Credentials**
   - Double-check the Gmail address
   - Ensure App Password is exactly 16 characters
   - Remove any spaces from the App Password

### Debug Mode

To see detailed email logs, check the console output when the server starts:

```
✅ Gmail transporter initialized successfully
✅ Gmail connection verified successfully
✅ Email service initialized successfully (Gmail)
```

Or if using simulation:

```
⚠️  Gmail credentials not found. Using simulation mode.
⚠️  Email service running in simulation mode
```

### Test Commands

```bash
# Test Gmail configuration
cd backend
node scripts/test-gmail-integration.js

# Check server startup logs
npm start

# Send test email via API
curl -X POST http://localhost:5000/api/admin/users/USER_ID/email \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"subject":"Test","message":"Hello from Quench RBAC!"}'
```

## Security Best Practices

1. **Use Dedicated Email Account**: Create a dedicated Gmail account for the application
2. **Regular Password Rotation**: Regenerate App Passwords periodically
3. **Monitor Usage**: Check Gmail's account activity regularly
4. **Environment Isolation**: Use different accounts for development and production
5. **Access Control**: Limit who has access to the email credentials

## Production Deployment

### Railway Configuration
1. Go to your Railway project dashboard
2. Navigate to Variables tab
3. Add:
   - `GMAIL_USER`: your-email@gmail.com
   - `GMAIL_APP_PASSWORD`: your-app-password

### Vercel Configuration (if using Vercel for backend)
1. Go to your Vercel project dashboard
2. Navigate to Settings → Environment Variables
3. Add the same variables as above

### Self-hosted Deployment
1. Add variables to your production `.env` file
2. Ensure the file is not committed to version control
3. Set appropriate file permissions (600)

## Monitoring and Maintenance

### Email Logs
Monitor the application logs for email sending status:

```bash
# Production logs (if using PM2)
pm2 logs

# Railway logs
railway logs

# Docker logs
docker logs container-name
```

### Success Indicators
- `✅ Email sent successfully via Gmail`
- `Message ID: [actual-gmail-message-id]`
- `Provider: gmail`

### Failure Indicators
- `❌ Gmail sending failed, falling back to simulation`
- `⚠️ Email service running in simulation mode`

## Support

If you encounter issues:

1. Run the test script: `node scripts/test-gmail-integration.js`
2. Check the server startup logs
3. Verify Gmail account settings
4. Ensure App Password is current and valid
5. Test with a simple email first

The system is designed to be resilient - if Gmail fails, it automatically falls back to simulation mode, ensuring the application continues to function normally.
