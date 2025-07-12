import { createClient as createSupabase } from '@supabase/supabase-js'

export function createClient() {
  const supabaseUrl = 'https://pixpjdiytwicrrsmbcyi.supabase.co'
  const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBpeHBqZGl5dHdpY3Jyc21iY3lpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0Mjc1MzMsImV4cCI6MjA2NzAwMzUzM30.I12ihzcXEhGl2xvQUeJEoCeS-PAzAgfm2HJsTs9Bg7E'
  
  console.log('Creating Supabase client with URL:', supabaseUrl)
  
  return createSupabase(supabaseUrl, supabaseAnonKey)
}