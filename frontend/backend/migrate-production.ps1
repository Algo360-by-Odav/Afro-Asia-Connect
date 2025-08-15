# AfroAsiaConnect Production Database Migration Script
# Run this to apply database migrations to Render PostgreSQL

Write-Host "Starting AfroAsiaConnect Production Database Migration..." -ForegroundColor Green

# Set production environment
$env:NODE_ENV = "production"

# Get Render database URL (you'll need to set this)
Write-Host "Setting up production database connection..." -ForegroundColor Blue

# Run Prisma migrations
Write-Host "Running Prisma migrations..." -ForegroundColor Blue
npx prisma migrate deploy

# Generate Prisma client
Write-Host "Generating Prisma client..." -ForegroundColor Blue
npx prisma generate

# Optional: Run database seeding
Write-Host "Do you want to run database seeding? (y/n)" -ForegroundColor Yellow
$seedChoice = Read-Host

if ($seedChoice -eq "y" -or $seedChoice -eq "Y") {
    Write-Host "Running database seed..." -ForegroundColor Blue
    npx prisma db seed
}

Write-Host "Migration complete!" -ForegroundColor Green
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Restart your Render service" -ForegroundColor White
Write-Host "2. Test API endpoints" -ForegroundColor White
Write-Host "3. Verify scheduled_messages table exists" -ForegroundColor White
