-- ============================================
-- COURSE RECOMMENDATION SYSTEM - DATABASE SCHEMA
-- ============================================
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. Create categories table (main subjects)
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    icon TEXT,
    parent_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create difficulty levels table
CREATE TABLE IF NOT EXISTS public.difficulty_levels (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    level INTEGER NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create courses/lessons table
CREATE TABLE IF NOT EXISTS public.courses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    slug TEXT UNIQUE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category_id UUID REFERENCES public.categories(id) ON DELETE CASCADE NOT NULL,
    difficulty_id UUID REFERENCES public.difficulty_levels(id) ON DELETE SET NULL,
    duration_minutes INTEGER,
    keywords TEXT[], -- Array of keywords for AI matching
    prerequisites TEXT[],
    learning_outcomes TEXT[],
    content_url TEXT,
    thumbnail_url TEXT,
    source_file_url TEXT,
    has_structure BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3a. Course module hierarchy
CREATE TABLE IF NOT EXISTS public.course_modules (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
    slug TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    order_index INTEGER NOT NULL,
    estimated_minutes INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(course_id, slug),
    UNIQUE(course_id, order_index)
);

CREATE TABLE IF NOT EXISTS public.course_units (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    module_id UUID REFERENCES public.course_modules(id) ON DELETE CASCADE NOT NULL,
    slug TEXT NOT NULL,
    title TEXT NOT NULL,
    unit_type TEXT CHECK (unit_type IN ('chapter', 'exercise', 'quiz', 'project')) DEFAULT 'chapter',
    content JSONB,
    order_index INTEGER NOT NULL,
    estimated_minutes INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(module_id, slug),
    UNIQUE(module_id, order_index)
);

CREATE TABLE IF NOT EXISTS public.course_unit_assets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    unit_id UUID REFERENCES public.course_units(id) ON DELETE CASCADE NOT NULL,
    file_name TEXT NOT NULL,
    storage_path TEXT NOT NULL,
    file_type TEXT,
    file_size_bytes BIGINT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Create user preferences table (stores onboarding data)
CREATE TABLE IF NOT EXISTS public.user_preferences (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE NOT NULL,
    onboarding_completed BOOLEAN DEFAULT false,
    learning_goals TEXT,
    preferred_difficulty_id UUID REFERENCES public.difficulty_levels(id),
    preferred_categories UUID[], -- Array of category IDs
    time_availability_minutes INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Create user course progress table
CREATE TABLE IF NOT EXISTS public.user_course_progress (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
    status TEXT CHECK (status IN ('not_started', 'in_progress', 'completed')) DEFAULT 'not_started',
    progress_percentage INTEGER DEFAULT 0,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, course_id)
);

-- 6. Create AI recommendations table (cache recommendations)
CREATE TABLE IF NOT EXISTS public.ai_recommendations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    prompt TEXT NOT NULL,
    recommended_courses UUID[], -- Array of course IDs
    confidence_scores JSONB, -- Store scores for each recommendation
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days')
);

-- 7. Create indexes for better performance
CREATE INDEX idx_courses_category ON public.courses(category_id);
CREATE INDEX idx_courses_difficulty ON public.courses(difficulty_id);
CREATE INDEX idx_courses_keywords ON public.courses USING GIN(keywords);
CREATE INDEX idx_course_modules_course ON public.course_modules(course_id);
CREATE INDEX idx_course_modules_slug ON public.course_modules(slug);
CREATE INDEX idx_course_units_module ON public.course_units(module_id);
CREATE INDEX idx_course_units_type ON public.course_units(unit_type);
CREATE INDEX idx_course_unit_assets_unit ON public.course_unit_assets(unit_id);
CREATE INDEX idx_user_preferences_user ON public.user_preferences(user_id);
CREATE INDEX idx_user_progress_user ON public.user_course_progress(user_id);
CREATE INDEX idx_user_progress_course ON public.user_course_progress(course_id);
CREATE INDEX idx_ai_recommendations_user ON public.ai_recommendations(user_id);
CREATE INDEX idx_categories_parent ON public.categories(parent_id);

-- 8. Enable Row Level Security
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.difficulty_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_unit_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_course_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_recommendations ENABLE ROW LEVEL SECURITY;

-- 9. RLS Policies - Categories and Difficulty (Public Read)
CREATE POLICY "Anyone can view categories"
    ON public.categories FOR SELECT
    USING (true);

CREATE POLICY "Anyone can view difficulty levels"
    ON public.difficulty_levels FOR SELECT
    USING (true);

-- 10. RLS Policies - Courses (Public Read)
CREATE POLICY "Anyone can view active courses"
    ON public.courses FOR SELECT
    USING (is_active = true);

CREATE POLICY "Anyone can view course modules"
    ON public.course_modules FOR SELECT
    USING (true);

CREATE POLICY "Anyone can view course units"
    ON public.course_units FOR SELECT
    USING (true);

CREATE POLICY "Anyone can view course unit assets"
    ON public.course_unit_assets FOR SELECT
    USING (true);

-- 11. RLS Policies - User Preferences (User-specific)
CREATE POLICY "Users can view own preferences"
    ON public.user_preferences FOR SELECT
    USING (user_id = current_setting('app.current_user_id', true)::uuid);

CREATE POLICY "Users can insert own preferences"
    ON public.user_preferences FOR INSERT
    WITH CHECK (user_id = current_setting('app.current_user_id', true)::uuid);

CREATE POLICY "Users can update own preferences"
    ON public.user_preferences FOR UPDATE
    USING (user_id = current_setting('app.current_user_id', true)::uuid);

-- 12. RLS Policies - User Course Progress
CREATE POLICY "Users can view own progress"
    ON public.user_course_progress FOR SELECT
    USING (user_id = current_setting('app.current_user_id', true)::uuid);

CREATE POLICY "Users can insert own progress"
    ON public.user_course_progress FOR INSERT
    WITH CHECK (user_id = current_setting('app.current_user_id', true)::uuid);

CREATE POLICY "Users can update own progress"
    ON public.user_course_progress FOR UPDATE
    USING (user_id = current_setting('app.current_user_id', true)::uuid);

-- 13. RLS Policies - AI Recommendations
CREATE POLICY "Users can view own recommendations"
    ON public.ai_recommendations FOR SELECT
    USING (user_id = current_setting('app.current_user_id', true)::uuid);

CREATE POLICY "Users can insert own recommendations"
    ON public.ai_recommendations FOR INSERT
    WITH CHECK (user_id = current_setting('app.current_user_id', true)::uuid);

-- 14. Create updated_at triggers
CREATE TRIGGER on_courses_updated
    BEFORE UPDATE ON public.courses
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER on_user_preferences_updated
    BEFORE UPDATE ON public.user_preferences
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER on_user_progress_updated
    BEFORE UPDATE ON public.user_course_progress
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- ============================================
-- SEED DATA - Difficulty Levels
-- ============================================

INSERT INTO public.difficulty_levels (name, level, description) VALUES
('Beginner', 1, 'No prior knowledge required. Start from scratch.'),
('Intermediate', 2, 'Some basic knowledge required. Build on fundamentals.'),
('Advanced', 3, 'Strong foundation required. Deep dive into complex topics.')
ON CONFLICT (name) DO NOTHING;

-- ============================================
-- SEED DATA - Categories
-- ============================================

-- Main Categories
INSERT INTO public.categories (id, name, description, icon, parent_id) VALUES
-- Languages
(gen_random_uuid(), 'Languages', 'Programming and spoken languages', '🗣️', NULL),
-- Science
(gen_random_uuid(), 'Science', 'Natural and applied sciences', '🔬', NULL),
-- Mathematics
(gen_random_uuid(), 'Mathematics', 'Pure and applied mathematics', '📐', NULL),
-- Physics
(gen_random_uuid(), 'Physics', 'Classical and modern physics', '⚛️', NULL)
ON CONFLICT (name) DO NOTHING;

-- Sub-categories for Languages
INSERT INTO public.categories (name, description, icon, parent_id) VALUES
('Programming Languages', 'Software development languages', '💻', (SELECT id FROM public.categories WHERE name = 'Languages' LIMIT 1)),
('Spoken Languages', 'Human communication languages', '🌍', (SELECT id FROM public.categories WHERE name = 'Languages' LIMIT 1)),
('JavaScript', 'Modern web development language', 'JS', (SELECT id FROM public.categories WHERE name = 'Programming Languages' LIMIT 1)),
('Python', 'Versatile programming language', 'PY', (SELECT id FROM public.categories WHERE name = 'Programming Languages' LIMIT 1)),
('English', 'Global communication language', 'EN', (SELECT id FROM public.categories WHERE name = 'Spoken Languages' LIMIT 1)),
('Spanish', 'Widely spoken language', 'ES', (SELECT id FROM public.categories WHERE name = 'Spoken Languages' LIMIT 1)),
('French', 'Romance language', 'FR', (SELECT id FROM public.categories WHERE name = 'Spoken Languages' LIMIT 1))
ON CONFLICT (name) DO NOTHING;

-- Sub-categories for Science
INSERT INTO public.categories (name, description, icon, parent_id) VALUES
('Biology', 'Study of living organisms', '🧬', (SELECT id FROM public.categories WHERE name = 'Science' LIMIT 1)),
('Chemistry', 'Study of matter and its properties', '⚗️', (SELECT id FROM public.categories WHERE name = 'Science' LIMIT 1)),
('Computer Science', 'Theory and practice of computation', '🖥️', (SELECT id FROM public.categories WHERE name = 'Science' LIMIT 1)),
('Environmental Science', 'Study of environment and ecosystems', '🌱', (SELECT id FROM public.categories WHERE name = 'Science' LIMIT 1))
ON CONFLICT (name) DO NOTHING;

-- Sub-categories for Mathematics
INSERT INTO public.categories (name, description, icon, parent_id) VALUES
('Algebra', 'Symbolic manipulation and equations', '𝑥', (SELECT id FROM public.categories WHERE name = 'Mathematics' LIMIT 1)),
('Calculus', 'Study of change and motion', '∫', (SELECT id FROM public.categories WHERE name = 'Mathematics' LIMIT 1)),
('Geometry', 'Study of shapes and spaces', '△', (SELECT id FROM public.categories WHERE name = 'Mathematics' LIMIT 1)),
('Statistics', 'Data analysis and probability', '📊', (SELECT id FROM public.categories WHERE name = 'Mathematics' LIMIT 1)),
('Linear Algebra', 'Vector spaces and matrices', '⊕', (SELECT id FROM public.categories WHERE name = 'Mathematics' LIMIT 1))
ON CONFLICT (name) DO NOTHING;

-- Sub-categories for Physics
INSERT INTO public.categories (name, description, icon, parent_id) VALUES
('Classical Mechanics', 'Newton laws and motion', '🎱', (SELECT id FROM public.categories WHERE name = 'Physics' LIMIT 1)),
('Quantum Physics', 'Subatomic particle behavior', '⚛️', (SELECT id FROM public.categories WHERE name = 'Physics' LIMIT 1)),
('Thermodynamics', 'Heat and energy transfer', '🌡️', (SELECT id FROM public.categories WHERE name = 'Physics' LIMIT 1)),
('Electromagnetism', 'Electric and magnetic fields', '⚡', (SELECT id FROM public.categories WHERE name = 'Physics' LIMIT 1)),
('Astrophysics', 'Physics of celestial objects', '🌌', (SELECT id FROM public.categories WHERE name = 'Physics' LIMIT 1))
ON CONFLICT (name) DO NOTHING;

-- ============================================
-- SEED DATA - Sample Courses
-- ============================================

-- Python Courses
INSERT INTO public.courses (title, description, category_id, difficulty_id, duration_minutes, keywords, learning_outcomes) VALUES
(
    'Python Basics for Beginners',
    'Learn Python programming from scratch. Perfect for absolute beginners.',
    (SELECT id FROM public.categories WHERE name = 'Python' LIMIT 1),
    (SELECT id FROM public.difficulty_levels WHERE name = 'Beginner' LIMIT 1),
    300,
    ARRAY['python', 'programming', 'basics', 'variables', 'loops', 'functions'],
    ARRAY['Understand Python syntax', 'Write basic programs', 'Use variables and data types', 'Create functions']
),
(
    'Advanced Python: OOP and Design Patterns',
    'Master object-oriented programming and design patterns in Python.',
    (SELECT id FROM public.categories WHERE name = 'Python' LIMIT 1),
    (SELECT id FROM public.difficulty_levels WHERE name = 'Advanced' LIMIT 1),
    480,
    ARRAY['python', 'oop', 'design patterns', 'classes', 'inheritance', 'polymorphism'],
    ARRAY['Implement OOP principles', 'Apply design patterns', 'Write maintainable code']
);

-- JavaScript Courses
INSERT INTO public.courses (title, description, category_id, difficulty_id, duration_minutes, keywords, learning_outcomes) VALUES
(
    'JavaScript Fundamentals',
    'Master the fundamentals of JavaScript for web development.',
    (SELECT id FROM public.categories WHERE name = 'JavaScript' LIMIT 1),
    (SELECT id FROM public.difficulty_levels WHERE name = 'Beginner' LIMIT 1),
    360,
    ARRAY['javascript', 'web development', 'dom', 'events', 'async', 'promises'],
    ARRAY['Manipulate the DOM', 'Handle events', 'Work with async code', 'Build interactive web pages']
);

-- Mathematics Courses
INSERT INTO public.courses (title, description, category_id, difficulty_id, duration_minutes, keywords, learning_outcomes) VALUES
(
    'Calculus I: Limits and Derivatives',
    'Introduction to differential calculus covering limits, continuity, and derivatives.',
    (SELECT id FROM public.categories WHERE name = 'Calculus' LIMIT 1),
    (SELECT id FROM public.difficulty_levels WHERE name = 'Intermediate' LIMIT 1),
    600,
    ARRAY['calculus', 'derivatives', 'limits', 'mathematics', 'differentiation'],
    ARRAY['Calculate limits', 'Find derivatives', 'Apply differentiation rules', 'Solve optimization problems']
),
(
    'Linear Algebra for Machine Learning',
    'Essential linear algebra concepts for data science and machine learning.',
    (SELECT id FROM public.categories WHERE name = 'Linear Algebra' LIMIT 1),
    (SELECT id FROM public.difficulty_levels WHERE name = 'Intermediate' LIMIT 1),
    420,
    ARRAY['linear algebra', 'matrices', 'vectors', 'machine learning', 'eigenvalues'],
    ARRAY['Perform matrix operations', 'Understand vector spaces', 'Apply to ML algorithms']
);

-- Physics Courses
INSERT INTO public.courses (title, description, category_id, difficulty_id, duration_minutes, keywords, learning_outcomes) VALUES
(
    'Introduction to Quantum Mechanics',
    'Explore the fascinating world of quantum physics and wave-particle duality.',
    (SELECT id FROM public.categories WHERE name = 'Quantum Physics' LIMIT 1),
    (SELECT id FROM public.difficulty_levels WHERE name = 'Advanced' LIMIT 1),
    720,
    ARRAY['quantum mechanics', 'physics', 'wave function', 'uncertainty principle', 'quantum states'],
    ARRAY['Understand quantum principles', 'Solve Schrödinger equation', 'Analyze quantum systems']
);

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to check if user completed onboarding
CREATE OR REPLACE FUNCTION public.check_user_onboarding(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_completed BOOLEAN;
BEGIN
    SELECT onboarding_completed INTO v_completed
    FROM public.user_preferences
    WHERE user_id = p_user_id;
    
    RETURN COALESCE(v_completed, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.check_user_onboarding TO authenticated;

-- ============================================
-- SUCCESS MESSAGE
-- ============================================
DO $$
BEGIN
    RAISE NOTICE 'Course recommendation system schema created successfully!';
    RAISE NOTICE 'Tables: categories, difficulty_levels, courses, user_preferences, user_course_progress, ai_recommendations';
    RAISE NOTICE 'Sample data inserted for categories, difficulties, and courses';
END $$;
