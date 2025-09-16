# AfroAsiaConnect Database Setup

## Setup Instructions

1. **Create Supabase Project**
   - Go to [supabase.com](https://supabase.com)
   - Create a new project
   - Note your project URL and API keys

2. **Run Database Schema**
   - Open Supabase SQL Editor
   - Run `schema.sql` first to create all tables
   - Then run `rls-policies.sql` to enable security and triggers

3. **Environment Variables**
   Set these in your Netlify dashboard:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
   ```

## Security Features

✅ **Row Level Security (RLS)** enabled on all tables
✅ **Role-based access** (admin/member)
✅ **Company-based permissions** for trade data
✅ **Private messaging** between users only
✅ **Document access** restricted to company members

## Database Triggers

✅ **Auto User Creation** - Automatically creates user profile when Supabase Auth user signs up
✅ **Admin Action Logging** - Tracks all moderation and system settings changes
✅ **Audit Trail** - Complete history of admin actions with JSON details

## Key Tables

- `users` - User profiles and authentication
- `companies` - Business entities
- `company_members` - User-company relationships
- `trade_listings` - Import/export opportunities
- `trade_requests` - Business inquiries
- `messages` - Private communications
- `documents` - Company certifications/licenses

## API Integration

Your Next.js API routes in `/api/*` are configured to work with this schema using the Supabase client.
