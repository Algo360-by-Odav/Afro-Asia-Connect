# AfroAsiaConnect Heroku Deployment Script
# Run this after installing Heroku CLI

Write-Host "🚀 AfroAsiaConnect Heroku Deployment" -ForegroundColor Green

# Navigate to backend directory
Set-Location "backend"

# Login to Heroku
Write-Host "📝 Logging into Heroku..." -ForegroundColor Yellow
heroku login

# Create Heroku app
Write-Host "🏗️ Creating Heroku app..." -ForegroundColor Yellow
heroku create afroasiaconnect-api

# Add PostgreSQL database
Write-Host "🗄️ Adding PostgreSQL database..." -ForegroundColor Yellow
heroku addons:create heroku-postgresql:hobby-dev --app afroasiaconnect-api

# Set environment variables
Write-Host "⚙️ Setting environment variables..." -ForegroundColor Yellow

# JWT Configuration
heroku config:set JWT_SECRET="3a6c82362091d5424bbcfb25ce57ec8d6195a3c6d650f6b05f725efcfb8c7daa425616f553f4798443eff295e7efcc1d6a9b6c6ddb153297b43c62a1a6b00629" --app afroasiaconnect-api
heroku config:set JWT_EXPIRES_IN="7d" --app afroasiaconnect-api

# Frontend URLs
heroku config:set FRONTEND_URL="https://afroasiaconnect-platform.windsurf.build" --app afroasiaconnect-api
heroku config:set CORS_ORIGIN="https://afroasiaconnect-platform.windsurf.build" --app afroasiaconnect-api

# Stripe Configuration
heroku config:set STRIPE_SECRET_KEY="sk_test_HNmrtHYefUko9Ho7PRmuNl5b" --app afroasiaconnect-api
heroku config:set STRIPE_PUBLISHABLE_KEY="pk_test_Zj2HL23sL0VeOEhcUOxth5ns" --app afroasiaconnect-api

# Twilio Configuration
heroku config:set TWILIO_ACCOUNT_SID="AC80e4fb649b7f71084b62b425ae6a78dd" --app afroasiaconnect-api
heroku config:set TWILIO_AUTH_TOKEN="3402412f65d87ef0cccc308987a877c1" --app afroasiaconnect-api
heroku config:set TWILIO_PHONE_NUMBER="+12543584566" --app afroasiaconnect-api

# Email Configuration
heroku config:set EMAIL_USER="afroasiaconnect2025@gmail.com" --app afroasiaconnect-api
heroku config:set EMAIL_PASSWORD="Adell Nate Catelia Era" --app afroasiaconnect-api
heroku config:set EMAIL_FROM="AfroAsiaConnect <noreply@afroasiaconnect.com>" --app afroasiaconnect-api

# Production Configuration
heroku config:set NODE_ENV="production" --app afroasiaconnect-api
heroku config:set MAX_FILE_SIZE="10485760" --app afroasiaconnect-api

# Deploy to Heroku
Write-Host "🚀 Deploying to Heroku..." -ForegroundColor Yellow
git add .
git commit -m "Production deployment to Heroku"
git push heroku master

# Run database migrations
Write-Host "🗄️ Running database migrations..." -ForegroundColor Yellow
heroku run npx prisma migrate deploy --app afroasiaconnect-api
heroku run npx prisma generate --app afroasiaconnect-api

# Open the deployed app
Write-Host "✅ Deployment complete! Opening app..." -ForegroundColor Green
heroku open --app afroasiaconnect-api

Write-Host "🎉 AfroAsiaConnect API deployed successfully!" -ForegroundColor Green
Write-Host "API URL: https://afroasiaconnect-api.herokuapp.com" -ForegroundColor Cyan
