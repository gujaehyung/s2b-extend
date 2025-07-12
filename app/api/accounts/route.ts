import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { s2bAccounts } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    // 인증 확인
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    }

    const accessToken = authHeader.substring(7);
    
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (error || !user) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    }

    console.log('계정 API - 사용자 ID:', user.id);

    // S2B 계정 목록 조회
    const { data: accounts, error: accountsError } = await s2bAccounts.getAll(user.id);
    
    console.log('계정 API - 조회 결과:', { accounts, accountsError });

    if (accountsError) {
      return NextResponse.json({ error: '계정 조회에 실패했습니다.' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      accounts: accounts || []
    });

  } catch (error) {
    console.error('계정 API 오류:', error);
    return NextResponse.json({ 
      error: '계정 조회 중 오류가 발생했습니다.' 
    }, { status: 500 });
  }
}