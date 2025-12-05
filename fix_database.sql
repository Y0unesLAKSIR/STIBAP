-- ⚠️ DESTRUCTIVE: Drops existing tables to ensure a clean slate
DROP TABLE IF EXISTS public.ai_recommendations CASCADE;
DROP TABLE IF EXISTS public.user_course_progress CASCADE;
DROP TABLE IF EXISTS public.user_unit_progress CASCADE;
DROP TABLE IF EXISTS public.user_preferences CASCADE;
DROP TABLE IF EXISTS public.course_unit_assets CASCADE;
DROP TABLE IF EXISTS public.course_units CASCADE;
DROP TABLE IF EXISTS public.course_modules CASCADE;
DROP TABLE IF EXISTS public.courses CASCADE;
DROP TABLE IF EXISTS public.difficulty_levels CASCADE;
DROP TABLE IF EXISTS public.categories CASCADE;

-- 1. Create categories table
CREATE TABLE public.categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    icon TEXT,
    parent_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create difficulty levels table
CREATE TABLE public.difficulty_levels (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    level INTEGER NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create courses table
CREATE TABLE public.courses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    slug TEXT UNIQUE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category_id UUID REFERENCES public.categories(id) ON DELETE CASCADE NOT NULL,
    difficulty_id UUID REFERENCES public.difficulty_levels(id) ON DELETE SET NULL,
    duration_minutes INTEGER,
    keywords TEXT[],
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

-- 4. Create AI recommendations table
CREATE TABLE public.ai_recommendations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL, -- Simplified for initial setup
    prompt TEXT NOT NULL,
    recommended_courses UUID[],
    confidence_scores JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days')
);

-- 5. Insert Seed Data (Categories)
INSERT INTO public.categories (name, description, icon) VALUES
('Python', 'Python Programming', 'PY'),
('JavaScript', 'Web Development', 'JS'),
('Machine Learning', 'AI and ML', '🤖'),
('Data Science', 'Data Analysis & Viz', '📊'),
('Web Development', 'Frontend & Backend', '🌐')
ON CONFLICT (name) DO NOTHING;

-- 6. Insert Seed Data (Difficulty)
INSERT INTO public.difficulty_levels (name, level) VALUES
('Beginner', 1),
('Intermediate', 2),
('Advanced', 3)
ON CONFLICT (name) DO NOTHING;

-- 7. Insert Seed Data (Sample Courses)
INSERT INTO public.courses (title, description, category_id, difficulty_id, keywords) VALUES
(
    'Python for Beginners',
    'Learn the basics of Python programming.',
    (SELECT id FROM public.categories WHERE name = 'Python' LIMIT 1),
    (SELECT id FROM public.difficulty_levels WHERE name = 'Beginner' LIMIT 1),
    ARRAY['python', 'coding', 'basics']
),
(
    'Advanced Machine Learning',
    'Deep dive into neural networks.',
    (SELECT id FROM public.categories WHERE name = 'Machine Learning' LIMIT 1),
    (SELECT id FROM public.difficulty_levels WHERE name = 'Advanced' LIMIT 1),
    ARRAY['ai', 'ml', 'neural networks']
);
