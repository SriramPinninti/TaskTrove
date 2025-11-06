import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  {
    auth: {
      // 👇 This ensures all Supabase emails (signup/reset) redirect correctly
      redirectTo: process.env.NEXT_PUBLIC_SITE_URL + '/auth/callback',
    },
  }
);
