# 🚂 Railway Deployment Guide - RECOMMENDED

## 🌟 Why Railway is Better than Heroku:
- ⚡ **3x Faster** deployments (30 seconds vs 2-3 minutes)
- 💰 **Cheaper** - Pay only for what you use ($0.000463/GB-hour)
- 🎨 **Modern UI** - Beautiful, intuitive dashboard
- 🔄 **Auto-deploys** - Automatic deployments from GitHub
- 🗄️ **Better Database** - High-performance PostgreSQL included
- 🌐 **Global CDN** - Faster worldwide performance

---

## 🚀 RAILWAY DEPLOYMENT STEPS:

### Step 1: Create Railway Account
1. Go to [railway.app](https://railway.app)
2. Click "Start a New Project"
3. Sign up with GitHub (recommended)

### Step 2: Deploy from GitHub
1. Click "Deploy from GitHub repo"
2. Select your "AfroAsiaConnect" repository
3. Choose "backend" folder as root directory
4. Railway will auto-detect Node.js and deploy

### Step 3: Add PostgreSQL Database
1. Click "New" → "Database" → "Add PostgreSQL"
2. Database will be automatically connected
3. DATABASE_URL will be set automatically

### Step 4: Set Environment Variables
Go to your service → Variables tab and add:

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

### Step 5: Deploy & Get URL
1. Railway will automatically deploy
2. You'll get a URL like: `https://afroasiaconnect-backend-production.up.railway.app`
3. Copy this URL for frontend configuration

### Step 6: Run Database Setup
1. Go to your service → Settings → "One-click Deploy"
2. Or use Railway CLI:
```bash
railway run npx prisma migrate deploy
railway run npx prisma generate
railway run npm run seed
```

---

## 💰 PRICING COMPARISON:
- **Heroku:** $7/month minimum + $9/month for database = $16/month
- **Railway:** ~$2-5/month for typical usage (pay-per-use)
- **Savings:** 60-70% cheaper than Heroku!

---

## ⚡ PERFORMANCE COMPARISON:
- **Heroku:** 2-3 minute deployments, slower cold starts
- **Railway:** 30-60 second deployments, faster performance
- **Result:** 3x faster development workflow!

---

## 🎯 EXPECTED RESULT:
- **Backend URL:** `https://your-app-name.up.railway.app`
- **Deployment Time:** 30-60 seconds
- **Database:** High-performance PostgreSQL included
- **Auto-deploys:** Every GitHub push automatically deploys
