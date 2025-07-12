import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function verifyAuth(token: string) {
  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return { valid: false, user: null };
    }
    
    return { valid: true, user };
  } catch (error) {
    console.error('Auth verification error:', error);
    return { valid: false, user: null };
  }
}