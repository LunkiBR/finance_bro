#!/bin/bash
# Finance Friend - VPS Deployment Script
# Execute this on your Hostinger VPS as root

echo "🚀 Starting Finance Friend Deployment on VPS..."

# 1. Install Node.js & PM2 (if not installed)
if ! command -v node &> /dev/null
then
    echo "📦 Installing Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
fi

if ! command -v pm2 &> /dev/null
then
    echo "📦 Installing PM2..."
    npm install -g pm2
fi

# 2. Setup project directory
mkdir -p /var/www/finance-app
cd /var/www/finance-app

# 3. Pull latest code
echo "📥 Pulling latest code from GitHub..."
if [ -d ".git" ]; then
    git pull origin main
else
    # Ensure this matches your repository URL
    git clone https://github.com/LunkiBR/finance_bro.git .
fi

# 4. Install dependencies and build
echo "⚙️ Installing dependencies and building Next.js..."
npm ci
npm run build

# 5. Start/Restart PM2
echo "🔄 Starting PM2 process..."
pm2 restart finance-app || pm2 start npm --name "finance-app" -- start

# 6. Save PM2 state to run on startup
pm2 save
pm2 startup | tail -n 1 | bash

echo "✅ App is running on localhost:3000 via PM2!"
echo "Next step: Configure Nginx to point to localhost:3000"
