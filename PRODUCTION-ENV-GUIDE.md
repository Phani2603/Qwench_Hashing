# Environment Configuration for Production

## Next.js Environment Configuration

Next.js uses different environment files depending on the environment:

1. **`.env.local`** - Used for local development, not used in production
2. **`.env.production`** - Used only during production builds
3. **`.env.development`** - Used only during development

## Current Setup

We've correctly configured:

- **`.env.production`** - Contains all production environment variables
- **Vercel Environment Variables** - Set directly in the Vercel dashboard, takes precedence over file-based configuration

## Important Notes

1. **DO NOT rely on `.env.local` for production settings**
   - This file is intended for local development only
   - It can override production settings if accidentally included in deployment

2. **Best Practices**
   - Always set environment variables in the Vercel dashboard for frontend
   - Always set environment variables in the Railway dashboard for backend
   - Use `.env.production` as a fallback/documentation

3. **Critical Environment Variables**:

   **Frontend (Vercel)**:
   ```
   NEXT_PUBLIC_API_URL=https://quench-rbac-backend-production.up.railway.app/api
   NEXT_PUBLIC_APP_URL=https://quench-rbac-frontend.vercel.app
   NEXTAUTH_URL=https://quench-rbac-frontend.vercel.app
   ```

   **Backend (Railway)**:
   ```
   NODE_ENV=production
   CORS_ORIGIN=https://quench-rbac-frontend.vercel.app
   FRONTEND_URL=https://quench-rbac-frontend.vercel.app
   MONGODB_URI=[your-mongodb-connection-string]
   ```

## Verification

You can verify the current environment configuration using:
```
./check-prod-env.bat
```

This will show the current settings and provide recommendations for production.
