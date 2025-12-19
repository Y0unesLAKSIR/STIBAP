import { createClient } from '@supabase/supabase-js';

const fallbackUrl = 'https://ibrcdwgyocvqkogxhnqh.supabase.co';
const fallbackKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlicmNkd2d5b2N2cWtvZ3hobnFoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI2MTU3NzAsImV4cCI6MjA3ODE5MTc3MH0.zLfcJkmBWdl7HYAzk9-QY7EgbPe81YKPlmWUGN6U4h4';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || fallbackUrl;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || fallbackKey;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export { supabase };
