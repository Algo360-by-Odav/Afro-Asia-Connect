# AfroAsiaConnect Production Setup Script
# Run this script to set up production environment

Write-Host "🚀 AfroAsiaConnect Production Setup" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Green

# Check if running as administrator
if (-NOT ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")) {
    Write-Host "❌ Please run this script as Administrator" -ForegroundColor Red
    exit 1
}

# Install global dependencies
Write-Host "📦 Installing global dependencies..." -ForegroundColor Yellow
npm install -g pm2 vercel @railway/cli

# Setup backend
Write-Host "🔧 Setting up backend..." -ForegroundColor Yellow
Set-Location backend
npm install --production
Write-Host "✅ Backend dependencies installed" -ForegroundColor Green

# Setup frontend
Write-Host "🌐 Setting up frontend..." -ForegroundColor Yellow
Set-Location ../frontend
npm install
npm run build
Write-Host "✅ Frontend built successfully" -ForegroundColor Green

# Setup mobile app
Write-Host "📱 Setting up mobile app..." -ForegroundColor Yellow
Set-Location ../AfroAsiaConnectMobile
npm install
Write-Host "✅ Mobile app dependencies installed" -ForegroundColor Green

# Return to root
Set-Location ..

Write-Host "🎉 Setup complete!" -ForegroundColor Green
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Configure environment variables in .env files" -ForegroundColor White
Write-Host "2. Set up production database" -ForegroundColor White
Write-Host "3. Configure Stripe and Twilio accounts" -ForegroundColor White
Write-Host "4. Deploy using the deployment guide" -ForegroundColor White
Write-Host ""
Write-Host "📚 See PRODUCTION_DEPLOYMENT_GUIDE.md for detailed instructions" -ForegroundColor Cyan
