import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import automationManager from '@/lib/automation-manager';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    // 인증 확인
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    }

    // Bearer 토큰에서 액세스 토큰 추출
    const accessToken = authHeader.substring(7);
    
    // Supabase 클라이언트 생성 및 사용자 확인
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (error || !user) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    }

    const { sessionId } = await params;
    const session = automationManager.getSession(sessionId);

    if (!session) {
      return NextResponse.json({ error: '세션을 찾을 수 없습니다.' }, { status: 404 });
    }

    // 사용자 권한 확인
    if (session.userId !== user.id) {
      return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 });
    }

    // 세션 통계 계산
    const stats = automationManager.getSessionStats(sessionId);

    return NextResponse.json({
      session: {
        id: session.id,
        status: session.status,
        startTime: session.startTime,
        endTime: session.endTime,
        progress: session.progress,
        result: session.result,
        stats,
        recentLogs: session.logs.slice(-10) // 최근 10개 로그만
      }
    });

  } catch (error) {
    console.error('세션 상태 조회 오류:', error);
    return NextResponse.json({ 
      error: '세션 상태 조회 중 오류가 발생했습니다.' 
    }, { status: 500 });
  }
}