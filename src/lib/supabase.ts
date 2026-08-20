// AgroNexus web — Supabase client
// Same Supabase project as the mobile app so data is shared.

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://xvszdnaulqekenfvsjmt.databasepad.com';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6ImIxYWEzOTA5LWEwZDQtNDE5MC05MWM3LTgxYTE4NjkwZDA0YiJ9.eyJwcm9qZWN0SWQiOiJ4dnN6ZG5hdWxxZWtlbmZ2c2ptdCIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNzc4MTcwODMwLCJleHAiOjIwOTM1MzA4MzAsImlzcyI6ImZhbW91cy5kYXRhYmFzZXBhZCIsImF1ZCI6ImZhbW91cy5jbGllbnRzIn0.RziNuuv2z9u-gE62AIEftEb5ChLV_FrxNDRSbN-MgVk';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: true, autoRefreshToken: true },
});
