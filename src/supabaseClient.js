import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://bjznunoyfhwuevhylnxa.supabase.co';
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJqem51bm95Zmh3dWV2aHlsbnhhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE0Mjc0MjcsImV4cCI6MjA3NzAwMzQyN30.nmCzTTemHUUDpTlJEhxWJLBZJrLh-qrF0K_HggDr6QM';

const supabase = createClient(supabaseUrl, supabaseKey);

export default supabase;
