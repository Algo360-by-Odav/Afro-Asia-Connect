-- AfroAsiaConnect RLS Policies and Triggers (Safe Version)
-- Run these in your Supabase SQL Editor after creating the schema
-- This version drops existing policies first to avoid conflicts

-- ========================
-- 1. USERS TABLE
-- ========================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies first
DROP POLICY IF EXISTS "Users can read their own data" ON users;
DROP POLICY IF EXISTS "Users can update their own data" ON users;
DROP POLICY IF EXISTS "Admins can manage users" ON users;

-- Allow users to read their own record
CREATE POLICY "Users can read their own data"
ON users FOR SELECT
USING (auth.uid() = users.id OR users.role = 'admin');

-- Allow users to update their own record
CREATE POLICY "Users can update their own data"
ON users FOR UPDATE
USING (auth.uid() = users.id)
WITH CHECK (auth.uid() = users.id);

-- Allow admins full access
CREATE POLICY "Admins can manage users"
ON users FOR ALL
USING (EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = 'admin'));

-- ========================
-- 2. COMPANIES TABLE
-- ========================
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

-- Drop existing policies first
DROP POLICY IF EXISTS "Anyone can view companies" ON companies;
DROP POLICY IF EXISTS "Members can manage their company" ON companies;

-- Public can read companies
CREATE POLICY "Anyone can view companies"
ON companies FOR SELECT
USING (true);

-- Members can insert/update/delete their company
CREATE POLICY "Members can manage their company"
ON companies FOR ALL
USING (auth.uid() = companies.created_by OR EXISTS (
  SELECT 1 FROM company_members cm
  WHERE cm.user_id = auth.uid() AND cm.company_id = companies.id
));

-- ========================
-- 3. COMPANY MEMBERS
-- ========================
ALTER TABLE company_members ENABLE ROW LEVEL SECURITY;

-- Drop existing policies first
DROP POLICY IF EXISTS "Users can view their membership" ON company_members;
DROP POLICY IF EXISTS "Company owners or admins manage memberships" ON company_members;

CREATE POLICY "Users can view their membership"
ON company_members FOR SELECT
USING (auth.uid() = company_members.user_id OR EXISTS (
  SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = 'admin'
));

CREATE POLICY "Company owners or admins manage memberships"
ON company_members FOR ALL
USING (EXISTS (
  SELECT 1 FROM company_members cm
  WHERE cm.company_id = company_members.company_id
  AND cm.user_id = auth.uid()
  AND cm.role = 'owner'
) OR EXISTS (
  SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = 'admin'
));

-- ========================
-- 4. TRADE LISTINGS
-- ========================
ALTER TABLE trade_listings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies first
DROP POLICY IF EXISTS "Anyone can view listings" ON trade_listings;
DROP POLICY IF EXISTS "Company members manage their listings" ON trade_listings;

-- Public read access
CREATE POLICY "Anyone can view listings"
ON trade_listings FOR SELECT
USING (true);

-- Only company members manage their listings
CREATE POLICY "Company members manage their listings"
ON trade_listings FOR ALL
USING (EXISTS (
  SELECT 1 FROM company_members cm
  WHERE cm.company_id = trade_listings.company_id
  AND cm.user_id = auth.uid()
));

-- ========================
-- 5. TRADE REQUESTS
-- ========================
ALTER TABLE trade_requests ENABLE ROW LEVEL SECURITY;

-- Drop existing policies first
DROP POLICY IF EXISTS "Companies involved can view trade requests" ON trade_requests;
DROP POLICY IF EXISTS "Requesting company can create" ON trade_requests;

CREATE POLICY "Companies involved can view trade requests"
ON trade_requests FOR SELECT
USING (
  trade_requests.from_company IN (SELECT company_id FROM company_members WHERE user_id = auth.uid())
  OR trade_requests.listing_id IN (SELECT tl.id FROM trade_listings tl
                    JOIN company_members cm ON cm.company_id = tl.company_id
                    WHERE cm.user_id = auth.uid())
);

CREATE POLICY "Requesting company can create"
ON trade_requests FOR INSERT
WITH CHECK (
  trade_requests.from_company IN (SELECT company_id FROM company_members WHERE user_id = auth.uid())
);

-- ========================
-- 6. MESSAGES
-- ========================
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Drop existing policies first
DROP POLICY IF EXISTS "Sender or receiver can view" ON messages;
DROP POLICY IF EXISTS "Sender can insert" ON messages;

CREATE POLICY "Sender or receiver can view"
ON messages FOR SELECT
USING (messages.sender_id = auth.uid() OR messages.receiver_id = auth.uid());

CREATE POLICY "Sender can insert"
ON messages FOR INSERT
WITH CHECK (messages.sender_id = auth.uid());

-- ========================
-- 7. DOCUMENTS
-- ========================
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- Drop existing policies first
DROP POLICY IF EXISTS "Company members and admins can view documents" ON documents;
DROP POLICY IF EXISTS "Company members upload documents" ON documents;

CREATE POLICY "Company members and admins can view documents"
ON documents FOR SELECT
USING (
  documents.company_id IN (SELECT company_id FROM company_members WHERE user_id = auth.uid())
  OR EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin')
);

CREATE POLICY "Company members upload documents"
ON documents FOR INSERT
WITH CHECK (documents.company_id IN (SELECT company_id FROM company_members WHERE user_id = auth.uid()));

-- ========================
-- 8. ADMIN ACTIONS
-- ========================
ALTER TABLE admin_actions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies first
DROP POLICY IF EXISTS "Only admins can manage admin actions" ON admin_actions;

CREATE POLICY "Only admins can manage admin actions"
ON admin_actions FOR ALL
USING (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin'));

-- ========================
-- 9. MODERATION QUEUE
-- ========================
ALTER TABLE moderation_queue ENABLE ROW LEVEL SECURITY;

-- Drop existing policies first
DROP POLICY IF EXISTS "Only admins can manage moderation" ON moderation_queue;

CREATE POLICY "Only admins can manage moderation"
ON moderation_queue FOR ALL
USING (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin'));

-- ========================
-- 10. SYSTEM SETTINGS
-- ========================
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies first
DROP POLICY IF EXISTS "Only admins can manage system settings" ON system_settings;

CREATE POLICY "Only admins can manage system settings"
ON system_settings FOR ALL
USING (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin'));



-- ========================
-- TRIGGERS
-- ========================

-- 1. AUTO-INSERT INTO USERS AFTER SIGNUP
-- (Supabase uses auth.users as default auth table)
CREATE OR REPLACE FUNCTION handle_new_auth_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO users (id, full_name, email, role, user_type, created_at)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', NEW.email, 'member', 'member', now())
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION handle_new_auth_user();


-- 2. AUTO-LOG ADMIN ACTIONS ON MODERATION QUEUE CHANGES
CREATE OR REPLACE FUNCTION log_admin_moderation()
RETURNS trigger AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin') THEN
    INSERT INTO admin_actions (admin_id, action, target_table, target_id, details, created_at)
    VALUES (auth.uid(), 'moderation_update', 'moderation_queue', NEW.id, row_to_json(NEW), now());
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS moderation_log_trigger ON moderation_queue;
CREATE TRIGGER moderation_log_trigger
AFTER UPDATE ON moderation_queue
FOR EACH ROW
EXECUTE FUNCTION log_admin_moderation();


-- 3. AUTO-LOG ADMIN ACTIONS ON SYSTEM SETTINGS CHANGES
CREATE OR REPLACE FUNCTION log_admin_settings()
RETURNS trigger AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin') THEN
    INSERT INTO admin_actions (admin_id, action, target_table, target_id, details, created_at)
    VALUES (auth.uid(), 'settings_update', 'system_settings', NEW.id, row_to_json(NEW), now());
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS system_settings_log_trigger ON system_settings;
CREATE TRIGGER system_settings_log_trigger
AFTER UPDATE ON system_settings
FOR EACH ROW
EXECUTE FUNCTION log_admin_settings();
