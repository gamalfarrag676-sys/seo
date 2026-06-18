-- =============================================
-- Supabase Schema V2 — Security & Performance Updates
-- Run this AFTER the original supabase-schema.sql
-- =============================================

-- =============================================
-- 1. FIX: Remove admin detection by email
--    (Previously: anyone registering as admin@app.com became admin)
-- =============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    'user'  -- All new users start as 'user'. Admins must be promoted manually.
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- NOTE: To promote a user to admin, run manually in SQL Editor:
-- UPDATE profiles SET role = 'admin' WHERE email = 'your-admin@example.com';


-- =============================================
-- 2. FIX: Restrict app_settings read access
--    (Previously: ALL authenticated users could read API keys)
-- =============================================

-- Drop the old permissive policy
DROP POLICY IF EXISTS "Authenticated users can read app_settings" ON app_settings;

-- New policy: Only admins can read app_settings (API keys)
CREATE POLICY "Only admins can read app_settings" ON app_settings
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- The admin management policy remains unchanged:
-- "Admins can manage app_settings" already exists in v1 schema


-- =============================================
-- 3. PERFORMANCE: Add missing database indexes
-- =============================================

-- Index for content queries by user (dashboard, history)
CREATE INDEX IF NOT EXISTS idx_content_user_created 
  ON content (user_id, created_at DESC);

-- Composite index for store lookups
CREATE INDEX IF NOT EXISTS idx_stores_user_platform 
  ON stores (user_id, platform);

-- Index for profile role lookups (used in RLS policies)
CREATE INDEX IF NOT EXISTS idx_profiles_role 
  ON profiles (role);


-- =============================================
-- 4. SECURITY: Notes on encrypting sensitive store data
-- =============================================
-- 
-- The following fields in the `stores` table contain sensitive data
-- that should be encrypted at rest:
--   - access_token
--   - consumer_key
--   - consumer_secret
--   - wp_username
--   - wp_app_password
--
-- To encrypt these using Supabase Vault:
--
-- Step 1: Enable the pgsodium extension (if not already enabled)
--   CREATE EXTENSION IF NOT EXISTS pgsodium;
--
-- Step 2: Create a new encryption key
--   SELECT pgsodium.create_key(name := 'store_credentials_key');
--
-- Step 3: Use transparent column encryption (TCE)
--   See: https://supabase.com/docs/guides/database/column-encryption
--
-- This requires manual setup in the Supabase Dashboard.


-- =============================================
-- 5. CLEANUP: Auto-delete profile when auth user is deleted
-- =============================================
CREATE OR REPLACE FUNCTION public.handle_user_deleted()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM public.profiles WHERE id = OLD.id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_deleted ON auth.users;
CREATE TRIGGER on_auth_user_deleted
  AFTER DELETE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_user_deleted();
