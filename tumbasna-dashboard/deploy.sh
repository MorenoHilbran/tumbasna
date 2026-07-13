#!/bin/bash
# TUMBASNA DEPLOYMENT SCRIPT
# Run this script on your VPS to deploy new checkout flow
# Date: 2026-07-13

echo "========================================="
echo "🚀 TUMBASNA DEPLOYMENT SCRIPT"
echo "========================================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Step 1: Backup current state
echo -e "${YELLOW}Step 1: Creating backup...${NC}"
cd /opt/tumbasna
sudo cp -r tumbasna-dashboard tumbasna-dashboard-backup-$(date +%Y%m%d-%H%M%S)
echo -e "${GREEN}✓ Backup created${NC}"
echo ""

# Step 2: Pull latest code
echo -e "${YELLOW}Step 2: Pulling latest code...${NC}"
cd /opt/tumbasna/tumbasna-dashboard
git pull origin main
echo -e "${GREEN}✓ Code updated${NC}"
echo ""

# Step 3: Install dependencies
echo -e "${YELLOW}Step 3: Installing dependencies...${NC}"
npm install
echo -e "${GREEN}✓ Dependencies installed${NC}"
echo ""

# Step 4: Build project
echo -e "${YELLOW}Step 4: Building project...${NC}"
npm run build
echo -e "${GREEN}✓ Build completed${NC}"
echo ""

# Step 5: Update Nginx config
echo -e "${YELLOW}Step 5: Checking Nginx config...${NC}"
if grep -q "location /wa" /etc/nginx/sites-enabled/tumbasna; then
    echo -e "${GREEN}✓ Nginx /wa location already configured${NC}"
else
    echo -e "${RED}⚠ Nginx /wa location NOT configured${NC}"
    echo -e "${YELLOW}Please add the following to /etc/nginx/sites-enabled/tumbasna:${NC}"
    echo ""
    echo "location /wa {"
    echo "    proxy_pass http://localhost:3002;"
    echo "    proxy_http_version 1.1;"
    echo "    proxy_set_header Upgrade \$http_upgrade;"
    echo "    proxy_set_header Connection 'upgrade';"
    echo "    proxy_set_header Host \$host;"
    echo "    proxy_cache_bypass \$http_upgrade;"
    echo "    rewrite ^/wa/(.*)\$ /\$1 break;"
    echo "}"
    echo ""
    read -p "Press Enter after adding nginx config..."
    sudo nginx -t && sudo systemctl reload nginx
fi
echo ""

# Step 6: Restart services
echo -e "${YELLOW}Step 6: Restarting services...${NC}"
pm2 restart tumbasna-dashboard
echo -e "${GREEN}✓ Dashboard restarted${NC}"

# Check if WA bot is running
if pm2 list | grep -q "tumbasna-whatsapp.*online"; then
    echo -e "${GREEN}✓ WhatsApp bot is running${NC}"
else
    echo -e "${YELLOW}⚠ Starting WhatsApp bot...${NC}"
    cd /opt/tumbasna/tumbasna-whatsapp
    pm2 start ecosystem.config.js --name tumbasna-whatsapp
fi
echo ""

# Step 7: Check services status
echo -e "${YELLOW}Step 7: Checking services status...${NC}"
pm2 list
echo ""

# Step 8: Test endpoints
echo -e "${YELLOW}Step 8: Testing endpoints...${NC}"

# Test dashboard
if curl -f http://localhost:3000 > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Dashboard (port 3000) - OK${NC}"
else
    echo -e "${RED}✗ Dashboard (port 3000) - FAILED${NC}"
fi

# Test WA bot
if curl -f http://localhost:3002/health > /dev/null 2>&1; then
    echo -e "${GREEN}✓ WhatsApp Bot (port 3002) - OK${NC}"
else
    echo -e "${RED}✗ WhatsApp Bot (port 3002) - FAILED${NC}"
fi

echo ""
echo "========================================="
echo -e "${GREEN}✅ DEPLOYMENT COMPLETE!${NC}"
echo "========================================="
echo ""
echo "🌐 Public URLs:"
echo "  • Dashboard: https://dashboard.tumbasna.my.id/"
echo "  • Mobile: https://app.tumbasna.my.id/"
echo "  • Landing: https://tumbasna.my.id/"
echo ""
echo "📋 Next Steps:"
echo "  1. Run database migration (see migration.sql)"
echo "  2. Test checkout flow on mobile app"
echo "  3. Monitor PM2 logs: pm2 logs"
echo ""
echo "📊 Check logs:"
echo "  pm2 logs tumbasna-dashboard"
echo "  pm2 logs tumbasna-whatsapp"
echo ""
