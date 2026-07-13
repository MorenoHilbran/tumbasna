# TUMBASNA DEPLOYMENT SCRIPT (Windows/PowerShell)
# Run this from your local machine to deploy to VPS
# Date: 2026-07-13

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "🚀 TUMBASNA DEPLOYMENT SCRIPT" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

$vpsUser = "moreno"
$vpsHost = "202.155.13.225"

# Step 1: Commit and push local changes
Write-Host "Step 1: Committing local changes..." -ForegroundColor Yellow
git add .
git commit -m "feat: new checkout flow with multi-supplier support"
git push origin main
Write-Host "✓ Code pushed to repository" -ForegroundColor Green
Write-Host ""

# Step 2: Deploy to VPS
Write-Host "Step 2: Deploying to VPS..." -ForegroundColor Yellow
Write-Host "Connecting to $vpsUser@$vpsHost..." -ForegroundColor Cyan

$deployScript = @"
cd /opt/tumbasna/tumbasna-dashboard
git pull origin main
npm install
npm run build
pm2 restart tumbasna-dashboard
pm2 list
"@

ssh "$vpsUser@$vpsHost" $deployScript

Write-Host ""
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "✅ DEPLOYMENT COMPLETE!" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "🌐 Check your app at:" -ForegroundColor Cyan
Write-Host "  • https://dashboard.tumbasna.my.id/" -ForegroundColor White
Write-Host "  • https://app.tumbasna.my.id/" -ForegroundColor White
Write-Host ""
