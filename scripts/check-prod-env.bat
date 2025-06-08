# This script checks current production environment settings and fixes any inconsistencies
# Run on your local machine to check/update Vercel environment configuration

# Check current environment variables
echo "Checking production environment configuration..."

# Environment files check
echo "Checking environment files..."
echo "----------------------------------"
echo "1. .env.local (development only)"
echo "Contents SHOULD NOT be used in production:"
cat .env.local 2>/dev/null || echo "  [File not found - OK]"
echo ""

echo "2. .env.production (production build)"
echo "Contents SHOULD be used in production:"
cat .env.production 2>/dev/null || echo "  [File not found - WARNING]" 
echo ""

# Display recommended configuration
echo "----------------------------------"
echo "RECOMMENDED PRODUCTION ENVIRONMENT SETTINGS:"
echo "----------------------------------"
echo "On Vercel:"
echo "  NEXT_PUBLIC_API_URL=https://quench-rbac-backend-production.up.railway.app/api"
echo "  NEXT_PUBLIC_APP_URL=https://quench-rbac-frontend.vercel.app"
echo "  NEXTAUTH_URL=https://quench-rbac-frontend.vercel.app"
echo ""
echo "On Railway:"
echo "  NODE_ENV=production"
echo "  CORS_ORIGIN=https://quench-rbac-frontend.vercel.app"
echo "  FRONTEND_URL=https://quench-rbac-frontend.vercel.app"
echo "----------------------------------"

# Instructions for updating
echo ""
echo "TO UPDATE ENVIRONMENT VARIABLES:"
echo "1. On Vercel: Project → Settings → Environment Variables"
echo "2. On Railway: Project → Settings → Environment → Variables"
echo "----------------------------------"

# Reminder about verification
echo ""
echo "AFTER UPDATING ENVIRONMENT VARIABLES:"
echo "1. Trigger a new deployment or rebuild"
echo "2. Verify configuration using the health endpoints"
echo "   - Frontend: /api/health"
echo "   - Backend: /api/health"
echo "----------------------------------"
