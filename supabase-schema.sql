-- Supabase Database Schema for SEO Content Generator SaaS
-- Run this in Supabase SQL Editor (Database → SQL Editor → New Query)

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- User Profiles Table (extends Supabase Auth)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  products_limit INT DEFAULT 10,
  articles_limit INT DEFAULT 5,
  products_used INT DEFAULT 0,
  articles_used INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Stores Table (user's connected stores)
CREATE TABLE IF NOT EXISTS stores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('salla', 'woocommerce')),
  store_name TEXT,
  store_url TEXT,
  access_token TEXT,
  consumer_key TEXT,
  consumer_secret TEXT,
  wp_username TEXT,
  wp_app_password TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Generated Content History
CREATE TABLE IF NOT EXISTS content (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('product', 'article')),
  title TEXT,
  keyword TEXT,
  content JSONB,
  seo_score INT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Function to automatically create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    CASE 
      WHEN NEW.email = 'admin@app.com' THEN 'admin' 
      ELSE 'user' 
    END
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call the function on new user
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to increment usage
CREATE OR REPLACE FUNCTION public.increment_usage(user_id UUID, field_name TEXT)
RETURNS VOID AS $$
BEGIN
  IF field_name = 'products_used' THEN
    UPDATE profiles SET products_used = products_used + 1 WHERE id = user_id;
  ELSIF field_name = 'articles_used' THEN
    UPDATE profiles SET articles_used = articles_used + 1 WHERE id = user_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Row Level Security (RLS) Policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE content ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Admin can view all profiles
CREATE POLICY "Admins can view all profiles" ON profiles
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can update all profiles" ON profiles
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Stores policies
CREATE POLICY "Users can manage own stores" ON stores
  FOR ALL USING (auth.uid() = user_id);

-- Content policies
CREATE POLICY "Users can manage own content" ON content
  FOR ALL USING (auth.uid() = user_id);

-- Create first admin user (run this after creating your account)
-- UPDATE profiles SET role = 'admin' WHERE email = 'YOUR_EMAIL@example.com';

-- App Settings Table (for global API keys - admin managed)
CREATE TABLE IF NOT EXISTS app_settings (
  key TEXT PRIMARY KEY,
  value TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS for app_settings
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read settings (to use API keys)
CREATE POLICY "Authenticated users can read app_settings" ON app_settings
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Only admins can insert/update/delete settings
CREATE POLICY "Admins can manage app_settings" ON app_settings
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Insert default API key placeholders (admin should update these)
INSERT INTO app_settings (key, value) VALUES ('gemini_api_key', '') ON CONFLICT (key) DO NOTHING;
INSERT INTO app_settings (key, value) VALUES ('openai_api_key', '') ON CONFLICT (key) DO NOTHING;
