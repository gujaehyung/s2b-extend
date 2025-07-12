import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseClient } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const supabase = createSupabaseClient();
    
    // 현재 사용자 확인
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    // 현재 세션 확인
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    return NextResponse.json({
      authenticated: !!user,
      user: user ? {
        id: user.id,
        email: user.email,
        metadata: user.user_metadata
      } : null,
      session: session ? {
        access_token: session.access_token ? 'exists' : 'missing',
        expires_at: session.expires_at
      } : null,
      errors: {
        user: userError?.message,
        session: sessionError?.message
      }
    });

  } catch (error) {
    console.error('인증 체크 오류:', error);
    return NextResponse.json({ 
      error: '인증 체크 중 오류가 발생했습니다.',
      details: error instanceof Error ? error.message : '알 수 없는 오류'
    }, { status: 500 });
  }
}