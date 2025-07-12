import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    // 요청 본문에서 토큰 정보 가져오기
    const body = await request.json();
    const { newPlan, accessToken, refreshToken } = body;

    if (!accessToken) {
      return NextResponse.json({ error: '인증 토큰이 필요합니다.' }, { status: 401 });
    }
    
    // 사용자 클라이언트로 인증 확인
    const userSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    
    const { data: { user }, error } = await userSupabase.auth.getUser(accessToken);
    
    if (error || !user) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    }

    // 토큰으로 세션 설정
    const { data: sessionData, error: sessionError } = await userSupabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken || ''
    });

    console.log('세션 설정 결과:', { sessionData: !!sessionData.session, sessionError });

    // 서비스 키로 관리자 클라이언트 생성 (RLS 우회)
    const adminSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    if (!newPlan || !['free', 'standard', 'basic', 'premium'].includes(newPlan)) {
      return NextResponse.json({ error: '올바르지 않은 플랜입니다.' }, { status: 400 });
    }

    console.log(`사용자 ${user.id} 플랜 업데이트: ${newPlan}`);

    // 먼저 DB에서 현재 사용자의 role을 가져옴
    const { data: currentProfile } = await adminSupabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single();
    
    const currentRole = currentProfile?.role || user.user_metadata?.role || 'user';
    console.log('현재 사용자 role:', currentRole);

    // 서비스 키로 메타데이터 업데이트 (세션 무효화 방지)
    const { data: updatedUser, error: metaError } = await adminSupabase.auth.admin.updateUserById(
      user.id,
      {
        user_metadata: {
          ...user.user_metadata,
          plan: newPlan,
          role: currentRole, // DB에서 가져온 role 사용
          updated_at: new Date().toISOString()
        }
      }
    );

    if (metaError) {
      console.error('메타데이터 업데이트 오류:', metaError);
      return NextResponse.json({ 
        error: '사용자 정보 업데이트에 실패했습니다.' 
      }, { status: 500 });
    }

    console.log('메타데이터 업데이트 성공:', updatedUser.user?.user_metadata);

    // user_profiles 테이블도 업데이트
    const { data: profileUpdateData, error: profileError } = await adminSupabase
      .from('user_profiles')
      .update({ 
        plan: newPlan, 
        updated_at: new Date().toISOString() 
      })
      .eq('id', user.id)
      .select()
      .single();

    if (profileError) {
      console.error('프로필 DB 업데이트 오류:', profileError);
      // 프로필이 없으면 생성
      if (profileError.code === 'PGRST116') {
        const { data: newProfile, error: insertError } = await adminSupabase
          .from('user_profiles')
          .insert({
            id: user.id,
            email: user.email || '',
            name: user.user_metadata?.name || user.email?.split('@')[0] || '사용자',
            plan: newPlan,
            role: user.user_metadata?.role || 'user',
            phone: '',
            created_at: user.created_at || new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single();
        
        if (insertError) {
          console.error('프로필 생성 오류:', insertError);
        } else {
          console.log('새 프로필 생성:', newProfile);
        }
      }
    } else {
      console.log('프로필 DB 업데이트 성공:', profileUpdateData);
    }

    // 세션 새로고침 불필요 (admin.updateUserById는 세션을 무효화시키지 않음)

    // 최종 데이터 (DB에서 가져온 실제 데이터 사용)
    const data = profileUpdateData || {
      id: user.id,
      email: user.email || '',
      name: user.user_metadata?.name || user.email?.split('@')[0] || '사용자',
      plan: newPlan,
      role: user.user_metadata?.role || 'user',
      phone: '',
      created_at: user.created_at,
      updated_at: new Date().toISOString()
    };

    console.log('플랜 업데이트 성공:', data);

    return NextResponse.json({
      success: true,
      message: `플랜이 ${newPlan}으로 업데이트되었습니다.`,
      profile: data,
      requiresRefresh: false // DB와 메타데이터 모두 업데이트했으므로 새로고침 불필요
    });

  } catch (error) {
    console.error('플랜 업데이트 API 오류:', error);
    return NextResponse.json({ 
      error: '플랜 업데이트 중 오류가 발생했습니다.' 
    }, { status: 500 });
  }
}