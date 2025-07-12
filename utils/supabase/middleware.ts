import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://pixpjdiytwicrrsmbcyi.supabase.co'
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBpeHBqZGl5dHdpY3Jyc21iY3lpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0Mjc1MzMsImV4cCI6MjA2NzAwMzUzM30.I12ihzcXEhGl2xvQUeJEoCeS-PAzAgfm2HJsTs9Bg7E'
  
  // 쿠키에서 액세스 토큰 가져오기
  const accessToken = request.cookies.get('sb-pixpjdiytwicrrsmbcyi-auth-token')?.value
  
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: accessToken ? {
        Authorization: `Bearer ${JSON.parse(accessToken).access_token}`
      } : {}
    }
  })

  // 세션 새로고침 시도
  const { data: { user }, error } = await supabase.auth.getUser()

  return { supabaseResponse, user, error }
}