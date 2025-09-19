-- AfroAsiaConnect Database Schema (SQL DDL)
-- Run this in your Supabase SQL Editor first, then run rls-policies.sql

-- ========================
-- USERS
-- ========================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone_number TEXT,
    password_hash TEXT, -- handled by Supabase Auth
    role TEXT CHECK (role IN ('admin','member','seller','supplier','service_provider')) DEFAULT 'member',
    user_type TEXT CHECK (user_type IN ('admin','member','seller','supplier','service_provider')) DEFAULT 'member',
    created_at TIMESTAMP DEFAULT now()
);

-- ========================
-- COMPANIES
-- ========================
CREATE TABLE companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    country TEXT NOT NULL,
    industry TEXT,
    website TEXT,
    logo_url TEXT,
    created_by UUID REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT now()
);

-- ========================
-- COMPANY MEMBERS (M:M between users and companies)
-- ========================
CREATE TABLE company_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    role TEXT CHECK (role IN ('owner','manager','staff')) DEFAULT 'staff',
    joined_at TIMESTAMP DEFAULT now(),
    UNIQUE (user_id, company_id)
);

-- ========================
-- TRADE LISTINGS
-- ========================
CREATE TABLE trade_listings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    type TEXT CHECK (type IN ('import','export')) NOT NULL,
    product_name TEXT NOT NULL,
    description TEXT,
    quantity NUMERIC,
    unit TEXT,
    price NUMERIC,
    currency TEXT DEFAULT 'USD',
    status TEXT CHECK (status IN ('active','closed')) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT now()
);

-- ========================
-- TRADE REQUESTS
-- ========================
CREATE TABLE trade_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id UUID REFERENCES trade_listings(id) ON DELETE CASCADE,
    from_company UUID REFERENCES companies(id),
    message TEXT,
    status TEXT CHECK (status IN ('pending','accepted','declined')) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT now()
);

-- ========================
-- MESSAGES (linked to trade requests)
-- ========================
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id UUID REFERENCES users(id) ON DELETE CASCADE,
    receiver_id UUID REFERENCES users(id) ON DELETE CASCADE,
    trade_request_id UUID REFERENCES trade_requests(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT now()
);

-- ========================
-- DOCUMENTS (licenses, certifications, etc.)
-- ========================
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    file_url TEXT NOT NULL,
    file_type TEXT,
    uploaded_at TIMESTAMP DEFAULT now()
);

-- ========================
-- ADMIN ACTIONS (audit log)
-- ========================
CREATE TABLE admin_actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID REFERENCES users(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    target_table TEXT,
    target_id UUID,
    details JSONB,
    created_at TIMESTAMP DEFAULT now()
);

-- ========================
-- MODERATION QUEUE
-- ========================
CREATE TABLE moderation_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_type TEXT CHECK (item_type IN ('listing','document','company','user')),
    item_id UUID NOT NULL,
    status TEXT CHECK (status IN ('pending','approved','rejected')) DEFAULT 'pending',
    assigned_admin UUID REFERENCES users(id),
    notes TEXT,
    created_at TIMESTAMP DEFAULT now(),
    reviewed_at TIMESTAMP
);

-- ========================
-- SYSTEM SETTINGS
-- ========================
CREATE TABLE system_settings (
    id SERIAL PRIMARY KEY,
    setting_key TEXT UNIQUE NOT NULL,
    setting_value JSONB,
    updated_at TIMESTAMP DEFAULT now(),
    updated_by UUID REFERENCES users(id)
);
