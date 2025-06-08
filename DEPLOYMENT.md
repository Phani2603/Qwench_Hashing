# RBAC System - Deployment Guide

This guide provides detailed instructions for deploying the RBAC (Role-Based Access Control) system to production environments.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Database Setup](#database-setup)
4. [Backend Deployment](#backend-deployment)
5. [Frontend Deployment](#frontend-deployment)
6. [Domain Configuration](#domain-configuration)
7. [SSL/TLS Setup](#ssltls-setup)
8. [Monitoring & Logging](#monitoring--logging)
9. [Backup Strategy](#backup-strategy)
10. [Troubleshooting](#troubleshooting)

## Prerequisites

Before deploying, ensure you have:

- Node.js 18+ installed
- MongoDB Atlas account (or self-hosted MongoDB)
- Domain name for your application
- SSL certificate (or use Let's Encrypt)
- Cloud hosting account (Vercel, Railway, Heroku, AWS, etc.)

## Environment Setup

### 1. Clone the Repository

\`\`\`bash
git clone <your-repository-url>
cd rbac-system
\`\`\`

### 2. Install Dependencies

\`\`\`bash
# Backend dependencies
cd backend
npm install

# Frontend dependencies
cd ../
npm install
\`\`\`

## Database Setup

### MongoDB Atlas (Recommended)

1. **Create MongoDB Atlas Account**
   - Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
   - Create a free account
   - Create a new cluster

2. **Configure Database Access**
   - Go to Database Access
   - Add a new database user
   - Set username and password
   - Grant "Read and write to any database" privileges

3. **Configure Network Access**
   - Go to Network Access
   - Add IP Address: `0.0.0.0/0` (for production, restrict to your server IPs)

4. **Get Connection String**
   - Go to Clusters → Connect → Connect your application
   - Copy the connection string
   - Replace `<password>` with your database user password

### Self-Hosted MongoDB

If using self-hosted MongoDB:

\`\`\`bash
# Install MongoDB
sudo apt update
sudo apt install -y mongodb

# Start MongoDB service
sudo systemctl start mongodb
sudo systemctl enable mongodb

# Create database and user
mongo
use rbac-system
db.createUser({
  user: "rbac_user",
  pwd: "your_secure_password",
  roles: ["readWrite"]
})
\`\`\`

## Backend Deployment

### Option 1: Railway (Recommended)

1. **Create Railway Account**
   - Go to [Railway](https://railway.app)
   - Sign up with GitHub

2. **Deploy Backend**
   \`\`\`bash
   # Install Railway CLI
   npm install -g @railway/cli
   
   # Login to Railway
   railway login
   
   # Navigate to backend directory
   cd backend
   
   # Initialize Railway project
   railway init
   
   # Add environment variables
   railway variables set MONGODB_URI="your_mongodb_connection_string"
   railway variables set JWT_SECRET="your_super_secret_jwt_key_here_make_it_long_and_random"
   railway variables set JWT_EXPIRES_IN="7d"
   railway variables set NODE_ENV="production"
   railway variables set FRONTEND_URL="https://your-frontend-domain.com"
   
   # Deploy
   railway up
   \`\`\`

3. **Get Backend URL**
   - After deployment, Railway will provide a URL like `https://your-app.railway.app`
   - Note this URL for frontend configuration

### Option 2: Heroku

1. **Install Heroku CLI**
   \`\`\`bash
   # Install Heroku CLI
   curl https://cli-assets.heroku.com/install.sh | sh
   
   # Login to Heroku
   heroku login
   \`\`\`

2. **Deploy Backend**
   \`\`\`bash
   cd backend
   
   # Create Heroku app
   heroku create your-rbac-backend
   
   # Set environment variables
   heroku config:set MONGODB_URI="your_mongodb_connection_string"
   heroku config:set JWT_SECRET="your_super_secret_jwt_key_here_make_it_long_and_random"
   heroku config:set JWT_EXPIRES_IN="7d"
   heroku config:set NODE_ENV="production"
   heroku config:set FRONTEND_URL="https://your-frontend-domain.com"
   
   # Deploy
   git init
   git add .
   git commit -m "Initial commit"
   heroku git:remote -a your-rbac-backend
   git push heroku main
   \`\`\`

### Option 3: VPS/Self-Hosted

1. **Server Setup**
   \`\`\`bash
   # Update system
   sudo apt update && sudo apt upgrade -y
   
   # Install Node.js
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   
   # Install PM2 for process management
   sudo npm install -g pm2
   
   # Install Nginx
   sudo apt install nginx
   \`\`\`

2. **Deploy Application**
   \`\`\`bash
   # Clone repository
   git clone <your-repository-url> /var/www/rbac-system
   cd /var/www/rbac-system/backend
   
   # Install dependencies
   npm install --production
   
   # Create environment file
   sudo nano .env
   \`\`\`

   Add the following to `.env`:
   \`\`\`env
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_super_secret_jwt_key_here_make_it_long_and_random
   JWT_EXPIRES_IN=7d
   NODE_ENV=production
   PORT=5000
   FRONTEND_URL=https://your-frontend-domain.com
   \`\`\`

3. **Configure PM2**
   \`\`\`bash
   # Create PM2 ecosystem file
   nano ecosystem.config.js
   \`\`\`

   Add the following:
   \`\`\`javascript
   module.exports = {
     apps: [{
       name: 'rbac-backend',
       script: 'server.js',
       instances: 'max',
       exec_mode: 'cluster',
       env: {
         NODE_ENV: 'production',
         PORT: 5000
       }
     }]
   }
   \`\`\`

   \`\`\`bash
   # Start application with PM2
   pm2 start ecosystem.config.js
   pm2 save
   pm2 startup
   \`\`\`

4. **Configure Nginx**
   \`\`\`bash
   sudo nano /etc/nginx/sites-available/rbac-backend
   \`\`\`

   Add the following:
   ```nginx
   server {
       listen 80;
       server_name api.yourdomain.com;

       location / {
           proxy_pass http://localhost:5000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
           proxy_cache_bypass $http_upgrade;
       }
   }
   \`\`\`

   \`\`\`bash
   # Enable site
   sudo ln -s /etc/nginx/sites-available/rbac-backend /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   \`\`\`

## Frontend Deployment

### Option 1: Vercel (Recommended)

1. **Install Vercel CLI**
   \`\`\`bash
   npm install -g vercel
   \`\`\`

2. **Deploy Frontend**
   \`\`\`bash
   # Navigate to project root
   cd /path/to/rbac-system
   
   # Login to Vercel
   vercel login
   
   # Deploy
   vercel
   \`\`\`

3. **Configure Environment Variables**
   - Go to Vercel Dashboard → Your Project → Settings → Environment Variables
   - Add: `NEXT_PUBLIC_API_URL` = `https://your-backend-url.com/api`

### Option 2: Netlify

1. **Build the Application**
   \`\`\`bash
   # Create environment file
   echo "NEXT_PUBLIC_API_URL=https://your-backend-url.com/api" > .env.local
   
   # Build the application
   npm run build
   \`\`\`

2. **Deploy to Netlify**
   - Go to [Netlify](https://netlify.com)
   - Drag and drop the `.next` folder
   - Or connect your GitHub repository

### Option 3: Self-Hosted

1. **Build the Application**
   \`\`\`bash
   # Create production environment file
   echo "NEXT_PUBLIC_API_URL=https://api.yourdomain.com/api" > .env.local
   
   # Build the application
   npm run build
   \`\`\`

2. **Configure Nginx for Frontend**
   \`\`\`bash
   sudo nano /etc/nginx/sites-available/rbac-frontend
   \`\`\`

   Add the following:
   ```nginx
   server {
       listen 80;
       server_name yourdomain.com www.yourdomain.com;
       root /var/www/rbac-system/out;
       index index.html;

       location / {
           try_files $uri $uri/ /index.html;
       }

       location /_next/static {
           alias /var/www/rbac-system/.next/static;
           expires 1y;
           access_log off;
       }
   }
   \`\`\`

   \`\`\`bash
   # Enable site
   sudo ln -s /etc/nginx/sites-available/rbac-frontend /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   \`\`\`

## Domain Configuration

### DNS Setup

1. **A Records**
   - `yourdomain.com` → Your server IP
   - `www.yourdomain.com` → Your server IP
   - `api.yourdomain.com` → Your server IP (if self-hosting backend)

2. **CNAME Records** (if using cloud services)
   - `www.yourdomain.com` → `yourdomain.com`
   - `api.yourdomain.com` → `your-backend-service.railway.app`

## SSL/TLS Setup

### Using Let's Encrypt (Free)

\`\`\`bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Obtain SSL certificates
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com -d api.yourdomain.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
\`\`\`

### Using Cloudflare (Recommended)

1. **Add Domain to Cloudflare**
   - Go to [Cloudflare](https://cloudflare.com)
   - Add your domain
   - Update nameservers

2. **Configure SSL**
   - Go to SSL/TLS → Overview
   - Set encryption mode to "Full (strict)"
   - Enable "Always Use HTTPS"

## Monitoring & Logging

### Backend Monitoring

1. **PM2 Monitoring**
   \`\`\`bash
   # Monitor processes
   pm2 monit
   
   # View logs
   pm2 logs
   
   # Restart application
   pm2 restart rbac-backend
   \`\`\`

2. **Log Rotation**
   \`\`\`bash
   # Install logrotate
   sudo nano /etc/logrotate.d/rbac-backend
   \`\`\`

   Add:
   \`\`\`
   /var/www/rbac-system/backend/logs/*.log {
       daily
       missingok
       rotate 52
       compress
       delaycompress
       notifempty
       create 644 www-data www-data
   }
   \`\`\`

### Application Monitoring

1. **Health Check Endpoint**
   - Backend: `https://api.yourdomain.com/api/health`
   - Should return system status

2. **Uptime Monitoring**
   - Use services like UptimeRobot, Pingdom, or StatusCake
   - Monitor both frontend and backend endpoints

## Backup Strategy

### Database Backup

1. **MongoDB Atlas**
   - Automatic backups are included
   - Configure backup schedule in Atlas dashboard

2. **Self-Hosted MongoDB**
   \`\`\`bash
   # Create backup script
   nano /home/ubuntu/backup-mongodb.sh
   \`\`\`

   Add:
   \`\`\`bash
   #!/bin/bash
   DATE=$(date +%Y%m%d_%H%M%S)
   BACKUP_DIR="/home/ubuntu/backups"
   
   mkdir -p $BACKUP_DIR
   
   mongodump --host localhost --port 27017 --db rbac-system --out $BACKUP_DIR/mongodb_$DATE
   
   # Compress backup
   tar -czf $BACKUP_DIR/mongodb_$DATE.tar.gz -C $BACKUP_DIR mongodb_$DATE
   rm -rf $BACKUP_DIR/mongodb_$DATE
   
   # Keep only last 7 days of backups
   find $BACKUP_DIR -name "mongodb_*.tar.gz" -mtime +7 -delete
   \`\`\`

   \`\`\`bash
   # Make executable and schedule
   chmod +x /home/ubuntu/backup-mongodb.sh
   crontab -e
   # Add: 0 2 * * * /home/ubuntu/backup-mongodb.sh
   \`\`\`

### Application Backup

\`\`\`bash
# Create application backup script
nano /home/ubuntu/backup-app.sh
\`\`\`

Add:
\`\`\`bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/home/ubuntu/backups"
APP_DIR="/var/www/rbac-system"

mkdir -p $BACKUP_DIR

# Backup application files
tar -czf $BACKUP_DIR/app_$DATE.tar.gz -C /var/www rbac-system

# Keep only last 7 days of backups
find $BACKUP_DIR -name "app_*.tar.gz" -mtime +7 -delete
\`\`\`

## Troubleshooting

### Common Issues

1. **Database Connection Failed**
   \`\`\`bash
   # Check MongoDB status
   sudo systemctl status mongodb
   
   # Check connection string
   echo $MONGODB_URI
   
   # Test connection
   mongo "your_connection_string"
   \`\`\`

2. **CORS Errors**
   - Ensure `FRONTEND_URL` is correctly set in backend environment
   - Check that frontend URL matches exactly (including https://)

3. **JWT Token Issues**
   - Verify `JWT_SECRET` is set and consistent
   - Check token expiration settings

4. **File Upload Issues**
   - Ensure QR code directory exists and has proper permissions
   \`\`\`bash
   sudo mkdir -p /var/www/rbac-system/backend/public/qrcodes
   sudo chown -R www-data:www-data /var/www/rbac-system/backend/public
   sudo chmod -R 755 /var/www/rbac-system/backend/public
   \`\`\`

5. **Performance Issues**
   - Monitor system resources: `htop`, `free -h`, `df -h`
   - Check PM2 logs: `pm2 logs`
   - Optimize database queries and add indexes

### Log Locations

- **PM2 Logs**: `~/.pm2/logs/`
- **Nginx Logs**: `/var/log/nginx/`
- **Application Logs**: `/var/www/rbac-system/backend/logs/`

### Emergency Recovery

1. **Database Recovery**
   \`\`\`bash
   # Restore from backup
   mongorestore --host localhost --port 27017 --db rbac-system /path/to/backup
   \`\`\`

2. **Application Recovery**
   \`\`\`bash
   # Stop application
   pm2 stop rbac-backend
   
   # Restore from backup
   cd /var/www
   sudo rm -rf rbac-system
   sudo tar -xzf /home/ubuntu/backups/app_YYYYMMDD_HHMMSS.tar.gz
   
   # Restart application
   cd rbac-system/backend
   pm2 start ecosystem.config.js
   \`\`\`

## Security Checklist

- [ ] Use strong, unique passwords for all accounts
- [ ] Enable 2FA where possible
- [ ] Keep all software updated
- [ ] Use HTTPS everywhere
- [ ] Implement proper firewall rules
- [ ] Regular security audits
- [ ] Monitor access logs
- [ ] Backup encryption
- [ ] Environment variable security
- [ ] Database access restrictions

## Performance Optimization

1. **Database Optimization**
   \`\`\`javascript
   // Add indexes for frequently queried fields
   db.users.createIndex({ email: 1 })
   db.qrcodes.createIndex({ assignedTo: 1 })
   db.qrcodes.createIndex({ category: 1 })
   db.scans.createIndex({ timestamp: -1 })
   \`\`\`

2. **Caching**
   - Implement Redis for session storage
   - Use CDN for static assets
   - Enable browser caching

3. **Load Balancing**
   - Use multiple PM2 instances
   - Implement Nginx load balancing
   - Consider horizontal scaling

## Support

For deployment issues or questions:

1. Check the troubleshooting section above
2. Review application logs
3. Consult the main README.md for development setup
4. Create an issue in the repository

---

**Note**: This deployment guide assumes a production environment. Always test deployments in a staging environment first.
