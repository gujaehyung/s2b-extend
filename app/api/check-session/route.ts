import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  try {
    console.log('세션 체크 시작');
    
    // 헤더에서 Authorization 토큰 확인
    const authHeader = request.headers.get('authorization');
    console.log('Authorization 헤더:', authHeader ? 'exists' : 'missing');
    
    // 쿠키 확인
    const cookies = request.cookies;
    const supabaseCookies = Array.from(cookies).filter(([key]) => key.includes('supabase'));
    console.log('Supabase 관련 쿠키:', supabaseCookies.map(([key]) => key));
    
    // Supabase 클라이언트 생성
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    
    // 1. getUser 시도
    const { data: userData, error: userError } = await supabase.auth.getUser();
    console.log('getUser 결과:', { userData: !!userData, userError: userError?.message });
    
    // 2. getSession 시도
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    console.log('getSession 결과:', { sessionData: !!sessionData?.session, sessionError: sessionError?.message });
    
    // 3. Authorization 헤더로 사용자 조회 시도
    let userFromToken = null;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const { data: { user }, error } = await supabase.auth.getUser(token);
      userFromToken = user;
      console.log('토큰으로 사용자 조회:', { user: !!user, error: error?.message });
    }
    
    return NextResponse.json({
      hasAuthHeader: !!authHeader,
      hasCookies: supabaseCookies.length > 0,
      cookies: supabaseCookies.map(([key, value]) => ({ key, hasValue: !!value })),
      getUserResult: {
        success: !!userData?.user,
        userId: userData?.user?.id,
        email: userData?.user?.email,
        error: userError?.message
      },
      getSessionResult: {
        success: !!sessionData?.session,
        userId: sessionData?.session?.user?.id,
        email: sessionData?.session?.user?.email,
        error: sessionError?.message
      },
      tokenUserResult: {
        success: !!userFromToken,
        userId: userFromToken?.id,
        email: userFromToken?.email
      }
    });

  } catch (error) {
    console.error('세션 체크 오류:', error);
    return NextResponse.json({ 
      error: '세션 체크 중 오류가 발생했습니다.',
      details: error instanceof Error ? error.message : '알 수 없는 오류'
    }, { status: 500 });
  }
}