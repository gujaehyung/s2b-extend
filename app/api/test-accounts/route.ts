import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId');
    if (!userId) {
      return NextResponse.json({ error: 'userId가 필요합니다.' }, { status: 400 });
    }

    console.log('테스트 - userId:', userId);
    console.log('테스트 - Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
    console.log('테스트 - Supabase Key 존재:', !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

    // 서비스 키가 있으면 사용 (RLS 우회)
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    console.log('테스트 - 서비스 키 사용:', !!process.env.SUPABASE_SERVICE_ROLE_KEY);
    
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      supabaseKey!
    );

    // 1. 모든 계정 조회 (조건 없이)
    const { data: allAccounts, error: allError } = await supabase
      .from('s2b_accounts')
      .select('*');
    
    console.log('테스트 - 모든 계정:', allAccounts?.length, '개');
    console.log('테스트 - 모든 계정 에러:', allError);

    // 2. 특정 사용자의 계정 조회
    const { data: userAccounts, error: userError } = await supabase
      .from('s2b_accounts')
      .select('*')
      .eq('user_id', userId);
    
    console.log('테스트 - 사용자 계정:', userAccounts?.length, '개');
    console.log('테스트 - 사용자 계정 에러:', userError);

    // 3. 활성 계정만 조회
    const { data: activeAccounts, error: activeError } = await supabase
      .from('s2b_accounts')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true);
    
    console.log('테스트 - 활성 계정:', activeAccounts?.length, '개');
    console.log('테스트 - 활성 계정 에러:', activeError);

    return NextResponse.json({
      allAccounts: allAccounts?.length || 0,
      allAccountsDetail: allAccounts || [],
      userAccounts: userAccounts || [],
      activeAccounts: activeAccounts || [],
      errors: {
        all: allError?.message,
        user: userError?.message,
        active: activeError?.message
      }
    });

  } catch (error) {
    console.error('테스트 오류:', error);
    return NextResponse.json({ 
      error: '테스트 중 오류가 발생했습니다.',
      details: error instanceof Error ? error.message : '알 수 없는 오류'
    }, { status: 500 });
  }
}