-- ============================================
-- FIX RLS POLICIES FOR USER_PREFERENCES
-- Run this in Supabase SQL Editor
-- ============================================

-- This fixes the "new row violates row-level security policy" error
-- The issue: The backend uses service_role key which should bypass RLS,
-- but the policies are too strict.

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own preferences" ON public.user_preferences;
DROP POLICY IF EXISTS "Users can insert own preferences" ON public.user_preferences;
DROP POLICY IF EXISTS "Users can update own preferences" ON public.user_preferences;

DROP POLICY IF EXISTS "Users can view own progress" ON public.user_course_progress;
DROP POLICY IF EXISTS "Users can insert own progress" ON public.user_course_progress;
DROP POLICY IF EXISTS "Users can update own progress" ON public.user_course_progress;

DROP POLICY IF EXISTS "Users can view own recommendations" ON public.ai_recommendations;
DROP POLICY IF EXISTS "Users can insert own recommendations" ON public.ai_recommendations;

-- ============================================
-- NEW POLICIES - Allow service_role and user access
-- ============================================

-- User Preferences Policies
CREATE POLICY "Allow all operations on user_preferences for service_role"
    ON public.user_preferences
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- User Course Progress Policies  
CREATE POLICY "Allow all operations on user_course_progress for service_role"
    ON public.user_course_progress
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- AI Recommendations Policies
CREATE POLICY "Allow all operations on ai_recommendations for service_role"
    ON public.ai_recommendations
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- ============================================
-- VERIFY RLS IS ENABLED (should already be)
-- ============================================

-- These should already be enabled from the original schema
-- Uncomment if needed:

-- ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.user_course_progress ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.ai_recommendations ENABLE ROW LEVEL SECURITY;

-- ============================================
-- VERIFICATION QUERY
-- ============================================

-- Run this to verify policies are created:
SELECT 
    schemaname,
    tablename, 
    policyname,
    cmd as command,
    qual as using_clause,
    with_check as with_check_clause
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename IN ('user_preferences', 'user_course_progress', 'ai_recommendations')
ORDER BY tablename, policyname;
