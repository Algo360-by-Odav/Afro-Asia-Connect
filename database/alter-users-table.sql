-- Alter existing users table to support all roles
-- Run this in Supabase SQL Editor to fix role constraints

-- First, drop the existing check constraint on role
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;

-- Add user_type column if it doesn't exist
ALTER TABLE users ADD COLUMN IF NOT EXISTS user_type TEXT DEFAULT 'member';

-- Add new check constraints that support all roles
ALTER TABLE users ADD CONSTRAINT users_role_check 
CHECK (role IN ('admin','member','seller','supplier','service_provider'));

ALTER TABLE users ADD CONSTRAINT users_user_type_check 
CHECK (user_type IN ('admin','member','seller','supplier','service_provider'));

-- Update existing users to have matching user_type
UPDATE users SET user_type = role WHERE user_type IS NULL OR user_type = '';

-- Make user_type NOT NULL
ALTER TABLE users ALTER COLUMN user_type SET NOT NULL;
