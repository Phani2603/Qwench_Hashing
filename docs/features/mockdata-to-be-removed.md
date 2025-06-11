# Mock Data Documentation

## Overview

This document identifies all instances of mock/hardcoded data in the Qwench Hashing application that should be replaced with real-time data from the backend. It serves as a comprehensive guide for development teams to ensure the application is production-ready by removing test data, hardcoded values, and security concerns.

## Table of Contents

1. [Admin Dashboard](#admin-dashboard)
2. [Backend Admin Analytics](#backend-admin-analytics)
3. [Scan Activity Analytics](#scan-activity-analytics)
4. [Test Routes and Demo Data](#test-routes-and-demo-data)
5. [Test Accounts and Credentials](#test-accounts-and-credentials)
6. [Security Implications](#security-implications)
7. [Additional Recommendations](#additional-recommendations)
8. [Implementation Priority](#implementation-priority)
9. [Implementation Checklist](#implementation-checklist)

## Purpose

Mock data is useful during development but must be replaced with real data for production use. This document:

- Identifies all instances of mock data throughout the codebase
- Explains why each mock data instance needs to be replaced
- Recommends appropriate solutions for each instance
- Prioritizes implementation tasks for production readiness

The goal is to ensure that the Qwench Hashing application presents accurate, real-time data to users and administrators rather than hardcoded or randomly generated values.

## Admin Dashboard

### System Status
**File:** `app/admin/dashboard/page.tsx` (Line 36)
```javascript
systemStatus: "Online",
```
**Description:** The system status is currently hardcoded as "Online" in the stats state. This should be replaced with a real system health check from the backend.

**Recommended Solution:** Implement a system health check API endpoint that returns the actual status of various system components.

### Server Uptime
**File:** `app/admin/dashboard/page.tsx` (Line 292)
```javascript
<span className="text-sm font-medium">99.9%</span>
```
**Description:** Server uptime is hardcoded to 99.9%. This should be replaced with actual server uptime metrics.

### Database Status & API Status
**File:** `app/admin/dashboard/page.tsx` (Lines 271-282)
```javascript
<div className="flex items-center space-x-2">
  <Database className="h-4 w-4 text-green-500" />
  <span className="text-sm text-green-600 dark:text-green-400">Connected</span>
</div>
// ...
<div className="flex items-center space-x-2">
  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
  <span className="text-sm text-green-600 dark:text-green-400">Operational</span>
</div>
```
**Description:** The database and API status indicators are hardcoded to show "Connected" and "Operational" with green status indicators.

**Recommended Solution:** Implement real-time monitoring of database connection status and API health.

## Backend Admin Analytics

### System Metrics
**File:** `backend/routes/admin-analytics.js` (Lines 360-382)
```javascript
// Get disk usage (mock data as Node.js doesn't provide this directly)
const diskUsage = Math.round(Math.random() * 20 + 30)

// Get active connections (mock data)
const activeConnections = Math.round(Math.random() * 50 + 50)

// Calculate requests per minute (mock data)
const requestsPerMinute = Math.round(Math.random() * 500 + 500)

// Calculate error rate (mock data)
const errorRate = (Math.random() * 0.05).toFixed(2)

// Calculate response time (mock data)
const responseTime = Math.round(Math.random() * 100 + 50)
```
**Description:** Various system metrics (disk usage, active connections, requests per minute, error rate, response time) are generated randomly instead of using real system data.

**Recommended Solution:** Implement a monitoring system or use existing Node.js monitoring packages like `prom-client` or `node-os-utils` to collect real system metrics.

### Performance Data
**File:** `backend/routes/admin-analytics.js` (Lines 384-394)
```javascript
// Generate performance data for the last 24 hours
const performanceData = []
const now = new Date()

for (let i = 23; i >= 0; i--) {
  const hour = new Date(now)
  hour.setHours(now.getHours() - i)

  performanceData.push({
    time: `${String(hour.getHours()).padStart(2, "0")}:00`,
    cpu: Math.round(Math.random() * 20 + cpuUsage - 10),
    memory: Math.round(Math.random() * 10 + memoryUsage - 5),
    requests: Math.round(Math.random() * 200 + requestsPerMinute - 100),
  })
}
```
**Description:** Historical performance data for charts is randomly generated rather than using actual historical data.

**Recommended Solution:** Implement a time-series database or logging mechanism that tracks these metrics over time, then query that historical data.

### Feature Usage
**File:** `backend/routes/admin-analytics.js` (Lines 400-406)
```javascript
// Get feature usage statistics
const featureUsage = [
  { feature: "QR Code Generation", usage: 89, trend: 12 },
  { feature: "User Management", usage: 67, trend: -3 },
  { feature: "Category Management", usage: 45, trend: 8 },
  { feature: "Analytics Dashboard", usage: 78, trend: 15 },
  { feature: "API Endpoints", usage: 92, trend: 5 },
]
```
**Description:** Feature usage statistics are hardcoded rather than calculated from actual system usage.

**Recommended Solution:** Implement feature usage tracking in the application that logs when users interact with different features.

### Audit Logs
**File:** `backend/routes/admin-analytics.js` (Lines 425-446)
```javascript
// If no audit logs in the database yet, use mock data
if (auditLogs.length === 0) {
  auditLogs = [
    {
      id: "1",
      timestamp: new Date().toISOString(),
      user: "admin@example.com",
      action: "User Role Updated",
      resource: "User Management",
      ipAddress: "192.168.1.100",
    },
    // More mock audit logs...
  ];
}
```
**Description:** When no audit logs are found in the database, mock data is used instead.

**Recommended Solution:** This is a reasonable fallback during development, but all routes that modify data should generate proper audit logs in production. Remove the mock data once the audit logging system is fully implemented.

## Scan Activity Analytics

### Empty State
**File:** `components/user/scan-activity-analytics.tsx` (Lines 161-194)
```javascript
<div className="bg-muted/40 rounded-lg p-4 inline-block mb-3 max-w-md border-l-4 border-l-muted">
  <p className="text-sm font-medium flex items-center">
    {errorMessage?.includes("No QR codes") ? (
      <>
        <AlertCircle className="h-4 w-4 mr-2 text-amber-500" />
        <span>No QR codes found</span>
      </>
    ) : (
      <>
        <InfoIcon className="items-center h-4 w-4 mr-2 text-blue-500" />
        <span>No scan activity detected yet</span>
      </>
    )}
  </p>
  // More UI elements...
</div>
```
**Description:** The component checks for error messages about missing QR codes to determine how to display the empty state. While this is not mock data per se, it's a UI state that relies on specific error message text rather than structured data.

**Recommended Solution:** Backend should provide a structured response with clear flags like `hasQRCodes: false` or `scanCount: 0` to better distinguish between these scenarios.

## Test Routes and Demo Data

In the test files and scripts throughout the project, there are various instances of demo QR codes, test routes, and verification flows that may need to be adapted or removed in a production environment:

### Demo QR Codes
**File:** Various test files (tests/*)
```javascript
const testUrl = `${FRONTEND_URL}/verify/test-demo-code`;
```

**Description:** These test URLs and demo verification flows are meant for testing but aren't suitable for production.

**Recommended Solution:** Ensure all test routes and demo data are either disabled in production or properly secured.

### Hardcoded API URLs
**File:** Multiple components and test files
```javascript
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"
const BACKEND_URL = 'https://quench-rbac-backend-production.up.railway.app';
const FRONTEND_URL = 'https://quench-rbac-frontend.vercel.app';
```

**Description:** API URLs are sometimes hardcoded with fallbacks to localhost or specific deployment URLs, which could cause issues when migrating between environments.

**Recommended Solution:**
1. Consistently use environment variables for all API endpoints
2. Implement proper environment configuration management
3. Create separate configuration files for development, testing, and production

## Security Implications

Using mock data in production environments can have several security implications:

1. **Exposure of Internal Information**: Mock data might reveal internal system structure, naming conventions, or business logic that could aid attackers.

2. **Predictability**: Hardcoded or predictably generated data patterns may be exploited in security attacks.

3. **False Security Sense**: Mock status indicators showing "Online" or "Connected" when systems are actually failing can hide security incidents.

4. **Credential Exposure**: Hardcoded credentials can lead to unauthorized access if not properly managed.

5. **Inconsistent Data**: Random data generation can cause inconsistencies that might be exploited or cause system instability.

## Additional Recommendations

1. **Create a Monitoring System**: Implement a proper monitoring system that collects and stores real-time metrics about system performance, feature usage, and other important indicators.

2. **Use Environment-Based Configuration**: Use environment variables to control whether mock data is used (for development) or real data is required (for production).

3. **Implement Proper Error Handling**: Ensure all API endpoints have consistent error handling that provides structured data rather than just error messages.

4. **Add Data Validation**: Add validation to ensure that no endpoints return mock data in production environments.

5. **Security Review**: Conduct a comprehensive security review to identify and remove any remaining hardcoded credentials, test accounts, or sensitive information.

6. **Environment Separation**: Clearly separate development, testing, and production environments with appropriate data isolation.

7. **Data Sanitization**: Implement processes to sanitize test/mock data from production databases.

8. **Secret Management**: Use a proper secret management solution for storing sensitive credentials and API keys.

9. **CI/CD Pipeline**: Add automated checks in the CI/CD pipeline to detect and flag hardcoded values or mock data.

## Test Accounts and Credentials

Throughout the codebase, particularly in test files, there are hardcoded admin credentials that should be replaced or secured before production deployment:

### Admin Account
**File:** Multiple test files (tests/, scripts/)
```javascript
const ADMIN_EMAIL = 'admin@quench.com';
const ADMIN_PASSWORD = 'QuenchAdmin2024!';
```

**Description:** These credentials are widely used in test files for login testing and are visible in plaintext throughout the codebase.

**Recommended Solution:** 
1. Ensure these default credentials are changed in production environments
2. Store test credentials in environment variables or configuration files not committed to the repository
3. Consider implementing a test credentials rotation policy
4. For tests, use randomly generated credentials when possible

### Default User Accounts
**File:** Various test files (tests/integration-test.js, tests/advanced-integration-test.js)
```javascript
// Helper function to generate random test data
function generateTestUser() {
  const timestamp = Date.now();
  return {
    name: `Test User`,
    email: `test${timestamp}@example.com`,
    password: 'SecurePass123!'
  };
}
```

**Description:** While these test accounts use randomly generated emails, they use a consistent pattern and predictable password that could be exploited in a production environment.

**Recommended Solution:**
1. Ensure all test users are removed from production databases
2. Implement safeguards to prevent test account registration in production
3. Use environment-specific credential generation with stronger entropy

## Implementation Priority

1. **High Priority (Security Critical)**
   - Replace systemStatus hardcoded value with real-time status check endpoint
   - Implement proper audit logging with structured data
   - Secure or replace hardcoded admin credentials
   - Remove test routes and demo verification flows in production
   - Implement proper environment variable management across all environments

2. **Medium Priority (Functional Enhancement)**
   - Replace system metrics with real data from monitoring tools
   - Update feature usage statistics with actual usage tracking
   - Add database and API status monitoring with health check endpoints
   - Implement structured error responses for empty states
   - Clean up test accounts from production databases

3. **Low Priority (Optimization)**
   - Implement historical performance data collection and storage
   - Add server uptime percentage tracking
   - Enhance analytics visualizations with real-time data
   - Implement automated monitoring and alerting systems
   - Create comprehensive logging and metrics dashboards

## Implementation Checklist

For each item identified in this document:

- [ ] Locate all instances of the mock data
- [ ] Determine appropriate real data source or API
- [ ] Create appropriate backend endpoints or services
- [ ] Update frontend components to use real data
- [ ] Add error handling for when data is unavailable
- [ ] Test in development and staging environments
- [ ] Deploy to production
- [ ] Monitor for issues after deployment