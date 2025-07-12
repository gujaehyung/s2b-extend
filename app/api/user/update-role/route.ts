import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, newRole, adminAccessToken } = body;

    if (!adminAccessToken) {
      return NextResponse.json({ error: '관리자 인증이 필요합니다.' }, { status: 401 });
    }

    // 관리자 권한 확인
    const userSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data: { user: adminUser }, error: adminError } = await userSupabase.auth.getUser(adminAccessToken);
    
    if (adminError || !adminUser) {
      return NextResponse.json({ error: '관리자 인증에 실패했습니다.' }, { status: 401 });
    }

    // 관리자 권한 확인 (DB에서)
    const { data: adminProfile } = await userSupabase
      .from('user_profiles')
      .select('role')
      .eq('id', adminUser.id)
      .single();

    if (!adminProfile || adminProfile.role !== 'admin') {
      return NextResponse.json({ error: '관리자 권한이 필요합니다.' }, { status: 403 });
    }

    // 서비스 키로 클라이언트 생성
    const serviceSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // 대상 사용자의 메타데이터 업데이트
    const { data: { user: targetUser }, error: getUserError } = await serviceSupabase.auth.admin.getUserById(userId);
    
    if (getUserError || !targetUser) {
      console.error('사용자 조회 오류:', getUserError);
      return NextResponse.json({ error: '사용자를 찾을 수 없습니다.' }, { status: 404 });
    }

    // 메타데이터 업데이트
    const { error: updateError } = await serviceSupabase.auth.admin.updateUserById(
      userId,
      {
        user_metadata: {
          ...targetUser.user_metadata,
          role: newRole
        }
      }
    );

    if (updateError) {
      console.error('메타데이터 업데이트 오류:', updateError);
    }

    // DB 업데이트
    const { error: dbError } = await serviceSupabase
      .from('user_profiles')
      .update({ 
        role: newRole,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (dbError) {
      console.error('DB 업데이트 오류:', dbError);
      return NextResponse.json({ error: '역할 업데이트에 실패했습니다.' }, { status: 500 });
    }

    console.log(`사용자 ${userId} 역할 업데이트: ${newRole}`);

    return NextResponse.json({
      success: true,
      message: `역할이 ${newRole}로 업데이트되었습니다.`
    });

  } catch (error) {
    console.error('역할 업데이트 API 오류:', error);
    return NextResponse.json({ 
      error: '역할 업데이트 중 오류가 발생했습니다.' 
    }, { status: 500 });
  }
}