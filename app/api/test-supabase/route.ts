import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  try {
    console.log('Supabase 테스트 시작');
    
    // 서비스 키 사용 (RLS 우회)
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // 1. 테이블 목록 확인
    const { data: tables, error: tablesError } = await supabaseAdmin
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .like('table_name', '%s2b%');

    console.log('테이블 목록:', tables);
    console.log('테이블 에러:', tablesError);

    // 2. s2b_accounts 테이블 구조 확인
    const { data: columns, error: columnsError } = await supabaseAdmin
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_schema', 'public')
      .eq('table_name', 's2b_accounts');

    console.log('컬럼 정보:', columns);
    console.log('컬럼 에러:', columnsError);

    // 3. RLS 정책 확인
    const { data: policies, error: policiesError } = await supabaseAdmin
      .rpc('pg_policies')
      .eq('schemaname', 'public')
      .eq('tablename', 's2b_accounts');

    console.log('RLS 정책:', policies);
    console.log('RLS 에러:', policiesError);

    // 4. 직접 SQL로 데이터 확인 (서비스 키 필요)
    let sqlResult = null;
    let sqlError = null;
    
    if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
      try {
        const { data, error } = await supabaseAdmin.rpc('exec_sql', {
          query: 'SELECT COUNT(*) as count FROM s2b_accounts'
        });
        sqlResult = data;
        sqlError = error;
      } catch (e) {
        sqlError = e;
      }
    }

    // 5. 간단한 테스트 계정 생성 시도
    const testUserId = '00000000-0000-0000-0000-000000000000';
    const { data: testCreate, error: createError } = await supabaseAdmin
      .from('s2b_accounts')
      .insert({
        user_id: testUserId,
        account_name: 'TEST_ACCOUNT',
        s2b_login_id: 'test',
        s2b_password: 'test',
        price_increase_rate: 5,
        is_active: true,
        is_default: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select();

    console.log('테스트 계정 생성:', testCreate);
    console.log('생성 에러:', createError);

    // 생성한 테스트 계정 삭제
    if (testCreate && testCreate.length > 0) {
      await supabaseAdmin
        .from('s2b_accounts')
        .delete()
        .eq('id', testCreate[0].id);
    }

    return NextResponse.json({
      tables: tables || [],
      columns: columns || [],
      policies: policies || [],
      sqlResult,
      sqlError: sqlError?.toString(),
      testCreate: !!testCreate,
      createError: createError?.message,
      hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY
    });

  } catch (error) {
    console.error('Supabase 테스트 오류:', error);
    return NextResponse.json({ 
      error: 'Supabase 테스트 중 오류가 발생했습니다.',
      details: error instanceof Error ? error.message : '알 수 없는 오류'
    }, { status: 500 });
  }
}