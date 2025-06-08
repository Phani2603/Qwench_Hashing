# 🚀 QUENCH RBAC - Vercel + Railway Deployment Guide

## 📋 **Overview**
This guide walks you through deploying the QUENCH RBAC system using:
- **Frontend**: Vercel (Next.js hosting)
- **Backend**: Railway (Node.js hosting)
- **Database**: MongoDB Atlas (Cloud database)

## ⏱️ **Estimated Time**: 30-45 minutes

---

## 🎯 **Step 1: MongoDB Atlas Setup (5-10 minutes)**

### 1.1 Create MongoDB Atlas Account
1. Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Sign up for a free account
3. Create a new project: "QUENCH-RBAC-PROD"

### 1.2 Create Production Cluster
1. Click "Build a Database"
2. Choose "M0 Sandbox" (Free tier)
3. Select your preferred region
4. Name your cluster: `quench-rbac-cluster`
5. Click "Create"

### 1.3 Configure Database Access
1. **Database Access** → **Add New Database User**
   - Username: `quench_admin`
   - Password: Generate a secure password
   - Role: `Atlas Admin`
   - Save credentials securely!

### 1.4 Configure Network Access
1. **Network Access** → **Add IP Address**
   - Click "Allow Access from Anywhere" (0.0.0.0/0)
   - Comment: "Production deployment"

### 1.5 Get Connection String
1. **Clusters** → **Connect**
2. Choose "Connect your application"
3. Copy the connection string
4. Replace `<password>` with your database password

**Save this connection string - you'll need it for Railway!**

---

## 🚂 **Step 2: Backend Deployment with Railway (10-15 minutes)**

### 2.1 Prepare Backend for Deployment
1. Ensure your backend `.env.production` file is ready
2. Make sure `backend/package.json` has a start script:

```json
{
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  }
}
```

### 2.2 Deploy to Railway
1. Go to [Railway](https://railway.app)
2. Sign up with GitHub
3. Click "New Project"
4. Choose "Deploy from GitHub repo"
5. Select your QUENCH RBAC repository
6. **Important**: Set the root directory to `backend`

### 2.3 Configure Environment Variables
In Railway dashboard, go to **Variables** and add:

```bash
MONGODB_URI=your-mongodb-atlas-connection-string
MONGODB_DB_NAME=quench_rbac_prod
JWT_SECRET=a8f5f167f44f4964e6c998dee827110c685a3d5d8e1c4b9c6e9a2c3d4e5f6789a1b2c3d4e5f6789a0b1c2d3e4f5g6h7i8j9k0l1m2n3o4p5q6r7s8t9u0v1w2x3y4z5
JWT_EXPIRES_IN=24h
PORT=5000
NODE_ENV=production
FRONTEND_URL=https://your-vercel-domain.vercel.app
QR_BASE_URL=https://your-vercel-domain.vercel.app
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
INITIAL_ADMIN_EMAIL=admin@yourcompany.com
INITIAL_ADMIN_PASSWORD=SecureAdminPassword123!
```

### 2.4 Deploy and Get URL
1. Railway will automatically deploy
2. Once deployed, copy your Railway URL (e.g., `https://your-app.railway.app`)
3. Test the backend: `https://your-app.railway.app/api/health`

---

## ⚡ **Step 3: Frontend Deployment with Vercel (10-15 minutes)**

### 3.1 Install Vercel CLI
```cmd
npm install -g vercel
```

### 3.2 Update Frontend Environment
Update your `.env.production` file with the Railway backend URL:

```bash
NEXT_PUBLIC_API_URL=https://your-railway-app.railway.app/api
NEXT_PUBLIC_APP_URL=https://your-vercel-domain.vercel.app
NEXT_PUBLIC_QR_BASE_URL=https://your-vercel-domain.vercel.app
NEXT_PUBLIC_SECURE_MODE=true
NEXT_PUBLIC_HTTPS_ONLY=true
NEXT_PUBLIC_ENABLE_QR_GENERATION=true
NEXT_PUBLIC_ENABLE_ADMIN_ANALYTICS=true
NEXT_PUBLIC_ENABLE_USER_PROFILES=true
```

### 3.3 Deploy to Vercel
```cmd
# Login to Vercel
vercel login

# Deploy to production
vercel --prod
```

### 3.4 Configure Environment Variables in Vercel
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Add all variables from your `.env.production` file
5. Set environment to "Production"

### 3.5 Update Backend CORS
Update your Railway environment variables:
```bash
FRONTEND_URL=https://your-actual-vercel-domain.vercel.app
QR_BASE_URL=https://your-actual-vercel-domain.vercel.app
```

---

## 🔧 **Step 4: Create Initial Admin (5 minutes)**

### 4.1 Run Admin Creation Script
You can run this locally or in Railway's console:

```cmd
# If running locally (make sure to use production MongoDB URI)
cd backend
node scripts/create-initial-admin.js
```

### 4.2 Alternative: Railway Console
1. In Railway dashboard, go to your project
2. Click on **Console** tab
3. Run: `node scripts/create-initial-admin.js`

---

## ✅ **Step 5: Post-Deployment Testing (5-10 minutes)**

### 5.1 Backend Health Check
Test these URLs in your browser:
- `https://your-railway-app.railway.app/api/health`
- Should return: `{"success":true,"message":"Server is running",...}`

### 5.2 Frontend Access
- Visit: `https://your-vercel-domain.vercel.app`
- Should load the RBAC homepage

### 5.3 Authentication Flow
1. **User Registration**: Try creating a new user account
2. **User Login**: Login with the new account
3. **Admin Login**: Login with your initial admin credentials
4. **Dashboard Access**: Verify role-based dashboard access

### 5.4 QR Code Testing
1. Login as admin
2. Navigate to QR code generation
3. Generate a test QR code
4. Verify the QR code contains the correct production URL

---

## 🔒 **Step 6: Security Finalization**

### 6.1 Update CORS Settings
Ensure your Railway backend only allows your Vercel domain:
```bash
FRONTEND_URL=https://your-actual-vercel-domain.vercel.app
```

### 6.2 Remove Sensitive Environment Variables
After admin creation, remove from Railway:
- `INITIAL_ADMIN_EMAIL`
- `INITIAL_ADMIN_PASSWORD`

### 6.3 Enable Security Headers
Your Next.js config already includes security headers. Verify they're working:
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- Referrer-Policy: origin-when-cross-origin

---

## 📊 **Step 7: Domain Configuration (Optional)**

### 7.1 Custom Domain for Frontend (Vercel)
1. In Vercel dashboard, go to **Settings** → **Domains**
2. Add your custom domain
3. Follow Vercel's DNS configuration instructions
4. Update all environment variables with new domain

### 7.2 Custom Domain for Backend (Railway)
1. In Railway dashboard, go to **Settings** → **Domains**
2. Add your custom domain
3. Configure DNS as instructed
4. Update frontend environment variables

---

## 🎉 **Deployment Complete!**

### **Your Production URLs:**
- **Frontend**: `https://your-vercel-domain.vercel.app`
- **Backend**: `https://your-railway-app.railway.app`
- **Admin Panel**: `https://your-vercel-domain.vercel.app/admin/dashboard`

### **Admin Credentials:**
- **Email**: `admin@yourcompany.com`
- **Password**: `SecureAdminPassword123!`

⚠️ **IMPORTANT**: Change the admin password after first login!

---

## 🔍 **Troubleshooting**

### Common Issues:

#### **1. CORS Errors**
- Ensure `FRONTEND_URL` in Railway matches your Vercel domain exactly
- Check Vercel environment variables are set correctly

#### **2. Database Connection Issues**
- Verify MongoDB Atlas connection string is correct
- Ensure MongoDB Atlas allows connections from anywhere (0.0.0.0/0)
- Check database username/password

#### **3. Environment Variable Issues**
- Ensure all required variables are set in both Railway and Vercel
- Restart deployments after changing environment variables

#### **4. Build Failures**
- Check Railway logs for backend errors
- Check Vercel build logs for frontend errors
- Ensure all dependencies are in package.json

### **Support Resources:**
- Railway Documentation: https://docs.railway.app
- Vercel Documentation: https://vercel.com/docs
- MongoDB Atlas Documentation: https://docs.atlas.mongodb.com

---

## 📋 **Final Checklist**

- [ ] MongoDB Atlas cluster created and configured
- [ ] Railway backend deployed with all environment variables
- [ ] Vercel frontend deployed with all environment variables
- [ ] Initial admin user created
- [ ] Authentication flow tested (signup, login, admin access)
- [ ] QR code generation tested (admin only)
- [ ] CORS properly configured
- [ ] Security headers enabled
- [ ] Sensitive environment variables removed
- [ ] Custom domains configured (if applicable)
- [ ] Production credentials secured

**🎉 Congratulations! Your QUENCH RBAC system is now live in production!**
