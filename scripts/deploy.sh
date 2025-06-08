#!/bin/bash

# QUENCH RBAC System - Production Deployment Script
# This script helps automate the deployment process

echo "🚀 QUENCH RBAC - Production Deployment Script"
echo "=============================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Step 1: Environment Check
echo ""
print_info "Step 1: Checking deployment environment..."

if [ ! -f "backend/.env.production" ]; then
    print_error "backend/.env.production file not found!"
    echo "Please create the production environment file first."
    exit 1
fi

if [ ! -f ".env.production" ]; then
    print_error ".env.production file not found!"
    echo "Please create the frontend production environment file first."
    exit 1
fi

print_status "Environment files found"

# Step 2: Build Frontend
echo ""
print_info "Step 2: Building frontend for production..."

npm install
if [ $? -ne 0 ]; then
    print_error "Frontend npm install failed"
    exit 1
fi

npm run build
if [ $? -ne 0 ]; then
    print_error "Frontend build failed"
    exit 1
fi

print_status "Frontend built successfully"

# Step 3: Backend Dependencies
echo ""
print_info "Step 3: Installing backend dependencies..."

cd backend
npm install --production
if [ $? -ne 0 ]; then
    print_error "Backend npm install failed"
    exit 1
fi

cd ..
print_status "Backend dependencies installed"

# Step 4: Database Setup
echo ""
print_info "Step 4: Setting up database..."

read -p "Do you want to create the initial admin user? (y/n): " create_admin

if [ "$create_admin" = "y" ] || [ "$create_admin" = "Y" ]; then
    cd backend
    node scripts/create-initial-admin.js
    if [ $? -eq 0 ]; then
        print_status "Initial admin user created"
    else
        print_warning "Admin user creation failed or user already exists"
    fi
    cd ..
fi

# Step 5: Deployment Options
echo ""
print_info "Step 5: Choose deployment method..."
echo "1) Deploy to Vercel (Frontend) + Railway (Backend)"
echo "2) Deploy using Docker"
echo "3) Deploy to traditional server with PM2"
echo "4) Manual deployment (show commands only)"

read -p "Choose an option (1-4): " deploy_option

case $deploy_option in
    1)
        echo ""
        print_info "Deploying to Vercel + Railway..."
        
        # Check if Vercel CLI is installed
        if ! command -v vercel &> /dev/null; then
            print_warning "Vercel CLI not found. Installing..."
            npm install -g vercel
        fi
        
        # Deploy frontend to Vercel
        print_info "Deploying frontend to Vercel..."
        vercel --prod
        
        print_info "Backend deployment to Railway:"
        echo "1. Go to https://railway.app"
        echo "2. Connect your GitHub repository"
        echo "3. Select the backend folder"
        echo "4. Add environment variables from backend/.env.production"
        echo "5. Deploy!"
        ;;
        
    2)
        echo ""
        print_info "Docker deployment commands:"
        echo ""
        echo "# Build backend Docker image:"
        echo "docker build -t quench-rbac-backend ./backend"
        echo ""
        echo "# Run backend container:"
        echo "docker run -d \\"
        echo "  --name quench-rbac-backend \\"
        echo "  -p 5000:5000 \\"
        echo "  --env-file backend/.env.production \\"
        echo "  quench-rbac-backend"
        echo ""
        echo "# For frontend, use Vercel or build static export"
        ;;
        
    3)
        echo ""
        print_info "PM2 deployment commands:"
        echo ""
        echo "# Install PM2 globally:"
        echo "npm install -g pm2"
        echo ""
        echo "# Start backend with PM2:"
        echo "cd backend"
        echo "pm2 start server.js --name quench-rbac-backend"
        echo "pm2 startup"
        echo "pm2 save"
        echo ""
        echo "# Frontend: Deploy to Vercel or serve static files"
        ;;
        
    4)
        echo ""
        print_info "Manual deployment steps:"
        echo ""
        echo "FRONTEND (Vercel):"
        echo "1. npm run build"
        echo "2. vercel --prod"
        echo "3. Configure environment variables in Vercel dashboard"
        echo ""
        echo "BACKEND (Railway/Heroku/Render):"
        echo "1. Push code to Git repository"
        echo "2. Connect repository to hosting platform"
        echo "3. Configure environment variables"
        echo "4. Deploy"
        echo ""
        echo "DATABASE (MongoDB Atlas):"
        echo "1. Create production cluster"
        echo "2. Configure network access"
        echo "3. Update MONGODB_URI in environment"
        ;;
esac

# Step 6: Post-deployment checklist
echo ""
print_info "Step 6: Post-deployment checklist"
echo ""
echo "□ Backend health check responds at /api/health"
echo "□ Frontend loads correctly"
echo "□ User registration works"
echo "□ User login works"  
echo "□ Admin login works"
echo "□ QR code generation works (admin only)"
echo "□ HTTPS is enforced"
echo "□ Rate limiting is active"
echo "□ Database connection is stable"
echo "□ Environment variables are secure"

echo ""
print_status "Deployment script completed!"
print_warning "Don't forget to:"
echo "  - Test all functionality after deployment"
echo "  - Remove INITIAL_ADMIN_* from environment variables"
echo "  - Set up monitoring and backups"
echo "  - Update DNS records if needed"

echo ""
echo "🎉 Your QUENCH RBAC system is ready for production!"
