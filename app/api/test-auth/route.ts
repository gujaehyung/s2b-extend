import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    // 요청에서 토큰 확인
    const authHeader = request.headers.get('authorization');
    const body = await request.json();
    
    console.log('=== 인증 테스트 시작 ===');
    console.log('Authorization 헤더:', authHeader ? '있음' : '없음');
    console.log('토큰 형식:', authHeader?.startsWith('Bearer ') ? '올바름' : '잘못됨');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ 
        error: '인증 헤더가 없거나 형식이 잘못되었습니다.',
        authHeader: authHeader 
      }, { status: 401 });
    }
    
    const accessToken = authHeader.substring(7);
    console.log('토큰 길이:', accessToken.length);
    console.log('토큰 앞 20자:', accessToken.substring(0, 20) + '...');
    
    // Supabase 클라이언트 생성
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    
    console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
    console.log('Anon Key 존재:', !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
    
    // getUser 메서드로 사용자 확인
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    console.log('getUser 결과:');
    console.log('- 사용자:', user ? `ID: ${user.id}, Email: ${user.email}` : 'null');
    console.log('- 에러:', error ? error.message : 'null');
    
    if (error) {
      return NextResponse.json({ 
        error: 'Supabase 인증 실패',
        details: error.message,
        tokenInfo: {
          length: accessToken.length,
          prefix: accessToken.substring(0, 20)
        }
      }, { status: 401 });
    }
    
    if (!user) {
      return NextResponse.json({ 
        error: '사용자를 찾을 수 없습니다.',
        tokenInfo: {
          length: accessToken.length,
          prefix: accessToken.substring(0, 20)
        }
      }, { status: 401 });
    }
    
    // 사용자 프로필 조회
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    
    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        metadata: user.user_metadata
      },
      profile: profile,
      message: '인증 성공!'
    });
    
  } catch (error) {
    console.error('인증 테스트 오류:', error);
    return NextResponse.json({ 
      error: '서버 오류',
      details: error instanceof Error ? error.message : '알 수 없는 오류'
    }, { status: 500 });
  }
}