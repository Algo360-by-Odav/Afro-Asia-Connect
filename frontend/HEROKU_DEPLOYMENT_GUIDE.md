# 🚀 AfroAsiaConnect Heroku Deployment Guide

## 📊 Current Status
- **✅ Frontend:** Live at https://afroasiaconnect-platform.windsurf.build
- **🔧 Backend:** Ready for Heroku deployment
- **✅ Environment:** Production variables configured

---

## 🚀 OPTION 1: Heroku CLI Deployment (Recommended)

### Step 1: Install Heroku CLI
1. Download from: https://devcenter.heroku.com/articles/heroku-cli
2. Run installer as administrator
3. Restart terminal/PowerShell

### Step 2: Run Deployment Script
```powershell
# Navigate to project root
cd c:\Users\FVMY\CascadeProjects\AfroAsiaConnect

# Run the deployment script
.\deploy-heroku.ps1
```

---

## 🌐 OPTION 2: Heroku Web Dashboard Deployment

### Step 1: Create Heroku Account
1. Go to [heroku.com](https://heroku.com)
2. Sign up for free account
3. Verify email address

### Step 2: Create New App
1. Click "New" → "Create new app"
2. App name: `afroasiaconnect-api`
3. Region: United States
4. Click "Create app"

### Step 3: Add PostgreSQL Database
1. Go to "Resources" tab
2. Search for "Heroku Postgres"
3. Select "Hobby Dev - Free"
4. Click "Submit Order Form"

### Step 4: Configure Environment Variables
Go to "Settings" → "Config Vars" and add:

```env
JWT_SECRET=3a6c82362091d5424bbcfb25ce57ec8d6195a3c6d650f6b05f725efcfb8c7daa425616f553f4798443eff295e7efcc1d6a9b6c6ddb153297b43c62a1a6b00629
JWT_EXPIRES_IN=7d
FRONTEND_URL=https://afroasiaconnect-platform.windsurf.build
CORS_ORIGIN=https://afroasiaconnect-platform.windsurf.build
STRIPE_SECRET_KEY=sk_test_HNmrtHYefUko9Ho7PRmuNl5b
STRIPE_PUBLISHABLE_KEY=pk_test_Zj2HL23sL0VeOEhcUOxth5ns
TWILIO_ACCOUNT_SID=AC80e4fb649b7f71084b62b425ae6a78dd
TWILIO_AUTH_TOKEN=3402412f65d87ef0cccc308987a877c1
TWILIO_PHONE_NUMBER=+12543584566
EMAIL_USER=afroasiaconnect2025@gmail.com
EMAIL_PASSWORD=Adell Nate Catelia Era
EMAIL_FROM=AfroAsiaConnect <noreply@afroasiaconnect.com>
NODE_ENV=production
MAX_FILE_SIZE=10485760
```

### Step 5: Connect GitHub Repository
1. Go to "Deploy" tab
2. Select "GitHub" as deployment method
3. Connect your GitHub account
4. Search for "AfroAsiaConnect" repository
5. Click "Connect"

### Step 6: Deploy
1. Scroll to "Manual deploy"
2. Select "master" branch
3. Click "Deploy Branch"
4. Wait for build to complete

### Step 7: Run Database Setup
1. Go to "More" → "Run console"
2. Run these commands one by one:
```bash
npx prisma migrate deploy
npx prisma generate
npm run seed
```

---

## 🔧 OPTION 3: Alternative Platforms

### Railway (Modern Alternative)
1. Go to [railway.app](https://railway.app)
2. Connect GitHub repository
3. Add PostgreSQL service
4. Configure environment variables
5. Deploy automatically

### DigitalOcean App Platform
1. Go to [cloud.digitalocean.com](https://cloud.digitalocean.com)
2. Create new App
3. Connect GitHub repository
4. Add managed PostgreSQL database
5. Configure and deploy

---

## 📋 Post-Deployment Checklist

### ✅ After Backend Deployment:
1. **Update Frontend API URL:**
   - Backend will be at: `https://afroasiaconnect-api.herokuapp.com`
   - Update frontend environment variables to point to this URL

2. **Test API Endpoints:**
   ```bash
   # Test health check
   curl https://afroasiaconnect-api.herokuapp.com/

   # Test authentication
   curl https://afroasiaconnect-api.herokuapp.com/api/auth/config
   ```

3. **Update .env.production:**
   ```env
   API_URL=https://afroasiaconnect-api.herokuapp.com
   ```

4. **Run Production Tests:**
   ```bash
   node test-api-production.js
   ```

---

## 🚨 Important Notes

### Security:
- ✅ Gmail App Password configured
- ✅ JWT secret is secure
- ✅ CORS properly configured
- ⚠️ Using test Stripe keys (update for live payments)

### Database:
- ✅ PostgreSQL will be automatically provisioned
- ✅ Prisma migrations will run on deployment
- ✅ Database URL automatically set by Heroku

### Monitoring:
- Check Heroku logs: `heroku logs --tail --app afroasiaconnect-api`
- Monitor app performance in Heroku dashboard
- Set up alerts for downtime or errors

---

## 🎯 Expected Results

After successful deployment:
- **Backend API:** `https://afroasiaconnect-api.herokuapp.com`
- **Frontend:** `https://afroasiaconnect-platform.windsurf.build`
- **Database:** Heroku PostgreSQL (automatically configured)
- **Status:** Full production environment ready

---

## 🆘 Troubleshooting

### Common Issues:
1. **Build Fails:** Check package.json scripts and dependencies
2. **Database Connection:** Verify DATABASE_URL is set automatically
3. **CORS Errors:** Ensure CORS_ORIGIN matches frontend URL
4. **Email Issues:** Verify Gmail App Password is correct

### Support:
- Heroku documentation: [devcenter.heroku.com](https://devcenter.heroku.com)
- Check deployment logs for specific error messages
- Verify all environment variables are set correctly
