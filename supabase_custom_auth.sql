-- ============================================
-- CUSTOM AUTHENTICATION SYSTEM
-- Server-side password hashing with pgcrypto
-- ============================================
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. Enable pgcrypto extension for password hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2. Drop existing profiles table and recreate for custom auth
DROP TABLE IF EXISTS public.user_activities CASCADE;
DROP TABLE IF EXISTS public.user_settings CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- 3. Create custom profiles table with authentication fields
CREATE TABLE public.profiles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    bio TEXT,
    is_active BOOLEAN DEFAULT true,
    email_verified BOOLEAN DEFAULT false,
    failed_login_attempts INTEGER DEFAULT 0,
    locked_until TIMESTAMP WITH TIME ZONE,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Create sessions table for secure session management
CREATE TABLE public.sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    session_token TEXT UNIQUE NOT NULL,
    ip_address TEXT,
    user_agent TEXT,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Create indexes for performance
CREATE INDEX idx_profiles_email ON public.profiles(email);
CREATE INDEX idx_sessions_token ON public.sessions(session_token);
CREATE INDEX idx_sessions_user_id ON public.sessions(user_id);
CREATE INDEX idx_sessions_expires ON public.sessions(expires_at);

-- 6. Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;

-- 7. RLS Policies for profiles (users can only see/update their own data)
CREATE POLICY "Users can view own profile"
    ON public.profiles
    FOR SELECT
    USING (id = current_setting('app.current_user_id', true)::uuid);

CREATE POLICY "Users can update own profile"
    ON public.profiles
    FOR UPDATE
    USING (id = current_setting('app.current_user_id', true)::uuid);

-- 8. RLS Policies for sessions
CREATE POLICY "Users can view own sessions"
    ON public.sessions
    FOR SELECT
    USING (user_id = current_setting('app.current_user_id', true)::uuid);

-- ============================================
-- AUTHENTICATION FUNCTIONS
-- ============================================

-- 9. Function: Register new user
CREATE OR REPLACE FUNCTION public.register_user(
    p_email TEXT,
    p_password TEXT,
    p_full_name TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    v_user_id UUID;
    v_email_exists BOOLEAN;
BEGIN
    -- Validate email format
    IF p_email !~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Invalid email format'
        );
    END IF;

    -- Validate password length
    IF LENGTH(p_password) < 6 THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Password must be at least 6 characters'
        );
    END IF;

    -- Check if email already exists
    SELECT EXISTS(SELECT 1 FROM public.profiles WHERE email = LOWER(p_email)) INTO v_email_exists;
    
    IF v_email_exists THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Email already registered'
        );
    END IF;

    -- Insert new user with hashed password
    INSERT INTO public.profiles (email, password_hash, full_name)
    VALUES (
        LOWER(p_email),
        crypt(p_password, gen_salt('bf', 10)),  -- Bcrypt with cost factor 10
        p_full_name
    )
    RETURNING id INTO v_user_id;

    RETURN json_build_object(
        'success', true,
        'user_id', v_user_id,
        'message', 'User registered successfully'
    );

EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Registration failed: ' || SQLERRM
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. Function: Login user
CREATE OR REPLACE FUNCTION public.login_user(
    p_email TEXT,
    p_password TEXT,
    p_ip_address TEXT DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    v_user_record RECORD;
    v_session_token TEXT;
    v_expires_at TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Get user record
    SELECT * INTO v_user_record
    FROM public.profiles
    WHERE email = LOWER(p_email);

    -- Check if user exists
    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Invalid email or password'
        );
    END IF;

    -- Check if account is locked
    IF v_user_record.locked_until IS NOT NULL AND v_user_record.locked_until > NOW() THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Account is locked. Please try again later.'
        );
    END IF;

    -- Check if account is active
    IF NOT v_user_record.is_active THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Account is deactivated'
        );
    END IF;

    -- Verify password
    IF v_user_record.password_hash = crypt(p_password, v_user_record.password_hash) THEN
        -- Password correct - reset failed attempts
        UPDATE public.profiles
        SET 
            failed_login_attempts = 0,
            locked_until = NULL,
            last_login = NOW()
        WHERE id = v_user_record.id;

        -- Generate session token
        v_session_token := encode(gen_random_bytes(32), 'base64');
        v_expires_at := NOW() + INTERVAL '7 days';

        -- Create session
        INSERT INTO public.sessions (user_id, session_token, ip_address, user_agent, expires_at)
        VALUES (v_user_record.id, v_session_token, p_ip_address, p_user_agent, v_expires_at);

        -- Clean up expired sessions
        DELETE FROM public.sessions WHERE expires_at < NOW();

        RETURN json_build_object(
            'success', true,
            'user', json_build_object(
                'id', v_user_record.id,
                'email', v_user_record.email,
                'full_name', v_user_record.full_name,
                'avatar_url', v_user_record.avatar_url,
                'last_login', v_user_record.last_login
            ),
            'session_token', v_session_token,
            'expires_at', v_expires_at
        );
    ELSE
        -- Password incorrect - increment failed attempts
        UPDATE public.profiles
        SET 
            failed_login_attempts = failed_login_attempts + 1,
            locked_until = CASE 
                WHEN failed_login_attempts + 1 >= 5 THEN NOW() + INTERVAL '15 minutes'
                ELSE NULL
            END
        WHERE id = v_user_record.id;

        RETURN json_build_object(
            'success', false,
            'error', 'Invalid email or password'
        );
    END IF;

EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Login failed: ' || SQLERRM
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 11. Function: Verify session token
CREATE OR REPLACE FUNCTION public.verify_session(
    p_session_token TEXT
)
RETURNS JSON AS $$
DECLARE
    v_session_record RECORD;
    v_user_record RECORD;
BEGIN
    -- Get session
    SELECT * INTO v_session_record
    FROM public.sessions
    WHERE session_token = p_session_token
    AND expires_at > NOW();

    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Invalid or expired session'
        );
    END IF;

    -- Get user
    SELECT * INTO v_user_record
    FROM public.profiles
    WHERE id = v_session_record.user_id
    AND is_active = true;

    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false,
            'error', 'User not found or deactivated'
        );
    END IF;

    RETURN json_build_object(
        'success', true,
        'user', json_build_object(
            'id', v_user_record.id,
            'email', v_user_record.email,
            'full_name', v_user_record.full_name,
            'avatar_url', v_user_record.avatar_url,
            'bio', v_user_record.bio,
            'last_login', v_user_record.last_login,
            'created_at', v_user_record.created_at
        )
    );

EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Session verification failed: ' || SQLERRM
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 12. Function: Logout (invalidate session)
CREATE OR REPLACE FUNCTION public.logout_user(
    p_session_token TEXT
)
RETURNS JSON AS $$
BEGIN
    DELETE FROM public.sessions
    WHERE session_token = p_session_token;

    RETURN json_build_object(
        'success', true,
        'message', 'Logged out successfully'
    );

EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Logout failed: ' || SQLERRM
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 13. Function: Change password
CREATE OR REPLACE FUNCTION public.change_password(
    p_session_token TEXT,
    p_old_password TEXT,
    p_new_password TEXT
)
RETURNS JSON AS $$
DECLARE
    v_user_id UUID;
    v_current_hash TEXT;
BEGIN
    -- Verify session and get user_id
    SELECT user_id INTO v_user_id
    FROM public.sessions
    WHERE session_token = p_session_token
    AND expires_at > NOW();

    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Invalid session'
        );
    END IF;

    -- Validate new password length
    IF LENGTH(p_new_password) < 6 THEN
        RETURN json_build_object(
            'success', false,
            'error', 'New password must be at least 6 characters'
        );
    END IF;

    -- Get current password hash
    SELECT password_hash INTO v_current_hash
    FROM public.profiles
    WHERE id = v_user_id;

    -- Verify old password
    IF v_current_hash != crypt(p_old_password, v_current_hash) THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Current password is incorrect'
        );
    END IF;

    -- Update password
    UPDATE public.profiles
    SET password_hash = crypt(p_new_password, gen_salt('bf', 10)),
        updated_at = NOW()
    WHERE id = v_user_id;

    RETURN json_build_object(
        'success', true,
        'message', 'Password changed successfully'
    );

EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Password change failed: ' || SQLERRM
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 14. Function: Clean up expired sessions (run periodically)
CREATE OR REPLACE FUNCTION public.cleanup_expired_sessions()
RETURNS void AS $$
BEGIN
    DELETE FROM public.sessions WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 15. Create updated_at trigger
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_profile_updated
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- ============================================
-- RECREATE RELATED TABLES
-- ============================================

-- User activities table
CREATE TABLE public.user_activities (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    activity_type TEXT NOT NULL,
    description TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.user_activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own activities"
    ON public.user_activities FOR SELECT
    USING (user_id = current_setting('app.current_user_id', true)::uuid);

CREATE POLICY "Users can insert own activities"
    ON public.user_activities FOR INSERT
    WITH CHECK (user_id = current_setting('app.current_user_id', true)::uuid);

CREATE INDEX idx_activities_user_id ON public.user_activities(user_id);
CREATE INDEX idx_activities_created_at ON public.user_activities(created_at DESC);

-- User settings table
CREATE TABLE public.user_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE NOT NULL,
    theme TEXT DEFAULT 'light' CHECK (theme IN ('light', 'dark', 'auto')),
    notifications_enabled BOOLEAN DEFAULT true,
    language TEXT DEFAULT 'en',
    preferences JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own settings"
    ON public.user_settings FOR SELECT
    USING (user_id = current_setting('app.current_user_id', true)::uuid);

CREATE POLICY "Users can update own settings"
    ON public.user_settings FOR UPDATE
    USING (user_id = current_setting('app.current_user_id', true)::uuid);

CREATE POLICY "Users can insert own settings"
    ON public.user_settings FOR INSERT
    WITH CHECK (user_id = current_setting('app.current_user_id', true)::uuid);

CREATE TRIGGER on_user_settings_updated
    BEFORE UPDATE ON public.user_settings
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- ============================================
-- GRANT PERMISSIONS
-- ============================================

-- Grant execute permissions on functions to anon and authenticated users
GRANT EXECUTE ON FUNCTION public.register_user TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.login_user TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.verify_session TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.logout_user TO authenticated;
GRANT EXECUTE ON FUNCTION public.change_password TO authenticated;

-- ============================================
-- SUCCESS MESSAGE
-- ============================================
DO $$
BEGIN
    RAISE NOTICE 'Custom authentication system installed successfully!';
    RAISE NOTICE 'Tables created: profiles, sessions, user_activities, user_settings';
    RAISE NOTICE 'Functions created: register_user, login_user, verify_session, logout_user, change_password';
END $$;
