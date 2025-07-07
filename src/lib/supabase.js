import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://cnftsxilzkpzukpmzixm.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNuZnRzeGlsemtwenVrcG16aXhtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0MDIwNjUsImV4cCI6MjA2Njk3ODA2NX0.wGKXHrsLa0GEERisOrwr8fReJUAGSzbARo-yblvyDOU'

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error('Missing Supabase variables');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true
  }
});

export default supabase;