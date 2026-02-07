
import { createClient } from '@supabase/supabase-js';

export const supabaseUrl = 'https://vzriehbewfrsnoxezatp.supabase.co';
export const supabaseAnonKey = 'sb_publishable_5reruEzouT75dWG1yj9zOA_9byfcdSs';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
