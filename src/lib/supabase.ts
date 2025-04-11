
import { createClient } from '@supabase/supabase-js';

// Use the explicit URL and key from your Supabase project
const supabaseUrl = 'https://oqbegbmlahmyimawyxuk.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9xYmVnYm1sYWhteWltYXd5eHVrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM4NTc0OTcsImV4cCI6MjA1OTQzMzQ5N30.P8YIqNJlhCqfsY8v79ma4LJE8ri6nsYylQhnwJ58kM4';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
