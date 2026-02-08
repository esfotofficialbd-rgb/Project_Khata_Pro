
import { createClient } from '@supabase/supabase-js';

export const supabaseUrl = 'https://vzriehbewfrsnoxezatp.supabase.co';
export const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ6cmllaGJld2Zyc25veGV6YXRwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk5MjA3MzYsImV4cCI6MjA4NTQ5NjczNn0.khO5SGpPzpwZrdkUHlqv14RTKRSu6ujq8p_SStmrMGI';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
