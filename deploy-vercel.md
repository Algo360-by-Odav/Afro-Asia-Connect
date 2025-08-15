# ⚡ Vercel Deployment Guide - Serverless Option

## 🌟 Why Vercel is Great:
- ⚡ **Ultra-fast** - Global edge network
- 🆓 **Generous free tier** - Perfect for startups
- 🔄 **Auto-deploys** from GitHub
- 🌐 **Global CDN** - Worldwide performance
- 📱 **Perfect for Next.js** - Made by Vercel team

---

## 🚀 VERCEL DEPLOYMENT STEPS:

### Step 1: Create Vercel Account
1. Go to [vercel.com](https://vercel.com)
2. Sign up with GitHub
3. Import your AfroAsiaConnect repository

### Step 2: Configure for Full-Stack
1. Set root directory to "frontend"
2. Vercel will auto-detect Next.js
3. Add API routes in `/api` folder (serverless functions)

### Step 3: Add Database
1. Use Vercel Postgres (recommended)
2. Or connect external database (PlanetScale, Supabase)
3. DATABASE_URL automatically configured

### Step 4: Environment Variables
Add in Vercel dashboard → Settings → Environment Variables:

```env
DATABASE_URL=postgresql://... (auto-generated)
JWT_SECRET=3a6c82362091d5424bbcfb25ce57ec8d6195a3c6d650f6b05f725efcfb8c7daa425616f553f4798443eff295e7efcc1d6a9b6c6ddb153297b43c62a1a6b00629
STRIPE_SECRET_KEY=sk_test_HNmrtHYefUko9Ho7PRmuNl5b
TWILIO_ACCOUNT_SID=AC80e4fb649b7f71084b62b425ae6a78dd
EMAIL_USER=afroasiaconnect2025@gmail.com
EMAIL_PASSWORD=Adell Nate Catelia Era
```

### Step 5: Deploy
1. Click "Deploy"
2. Get URL: `https://afroasiaconnect.vercel.app`
3. Both frontend and API in one deployment!

---

## 💰 PRICING:
- **Free:** 100GB bandwidth, 1000 serverless invocations
- **Pro:** $20/month for teams
- **Perfect for:** Startups and medium-scale apps
