-- =============================================
-- Supabase Schema V3 — Competitor Reports History
-- =============================================

-- 1. Create table for competitor reports
CREATE TABLE IF NOT EXISTS public.competitor_reports (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  keyword TEXT NOT NULL,
  report_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Enable RLS
ALTER TABLE public.competitor_reports ENABLE ROW LEVEL SECURITY;

-- 3. Policies
CREATE POLICY "Users can insert their own reports"
  ON public.competitor_reports FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own reports"
  ON public.competitor_reports FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reports"
  ON public.competitor_reports FOR DELETE
  USING (auth.uid() = user_id);

-- 4. Index for faster queries
CREATE INDEX IF NOT EXISTS idx_competitor_reports_user_created 
  ON public.competitor_reports (user_id, created_at DESC);
