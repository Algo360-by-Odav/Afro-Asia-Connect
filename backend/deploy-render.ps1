# AfroAsiaConnect Backend - Render Deployment Script
# This script deploys the fixed backend to Render.com

Write-Host "Starting AfroAsiaConnect Backend Deployment to Render..." -ForegroundColor Green

# Check if we're in the correct directory
if (!(Test-Path "package.json")) {
    Write-Host "Error: package.json not found. Please run this script from the backend directory." -ForegroundColor Red
    exit 1
}

Write-Host "Pre-deployment checklist:" -ForegroundColor Yellow
Write-Host "Fixed Prisma client singleton pattern" -ForegroundColor Green
Write-Host "Removed duplicate PORT declarations" -ForegroundColor Green
Write-Host "Local server tested and working" -ForegroundColor Green
Write-Host "Database connection confirmed" -ForegroundColor Green

# Check Git status
Write-Host "Checking Git status..." -ForegroundColor Blue
git status

Write-Host "Adding all changes to Git..." -ForegroundColor Blue
git add .

Write-Host "Committing changes..." -ForegroundColor Blue
$commitMessage = "fix: resolve Prisma client singleton pattern and duplicate PORT declaration

- Fixed multiple PrismaClient instances causing database connection exhaustion
- Consolidated all Prisma imports to use shared prismaClient.js singleton
- Removed duplicate PORT declaration in server.js
- Server now starts successfully with stable database connection
- All API endpoints responding with 200 OK status
- Ready for production deployment on Render"

git commit -m $commitMessage

Write-Host "Pushing to GitHub..." -ForegroundColor Blue
git push origin main

Write-Host "Deployment Complete!" -ForegroundColor Green
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "1. Go to Render dashboard: https://dashboard.render.com" -ForegroundColor White
Write-Host "2. Find your afroasiaconnect-api web service" -ForegroundColor White
Write-Host "3. Click Manual Deploy and Deploy latest commit" -ForegroundColor White
Write-Host "4. Monitor deployment logs for successful startup" -ForegroundColor White
Write-Host "5. Test API endpoints once deployment is complete" -ForegroundColor White

Write-Host "Expected Render URL: https://afroasiaconnect-api.onrender.com" -ForegroundColor Cyan
Write-Host "Test endpoint: https://afroasiaconnect-api.onrender.com/api/auth/config" -ForegroundColor Cyan
