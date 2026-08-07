// NOTE: The Supabase client is available for optional direct DB access.
// Authentication is handled by Django GraphQL JWT — not Supabase Auth.
// Credentials are read from environment variables — never hard-coded.
//
// Add to .env.local (dev) or .env.production (prod):
//   VITE_SUPABASE_URL=https://your-project.supabase.co
//   VITE_SUPABASE_ANON_KEY=your-anon-key

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL ?? '';
const supabaseKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY ?? '';

const supabase = supabaseUrl && supabaseKey
  ? createClient(supabaseUrl, supabaseKey)
  : null;

export { supabase };
