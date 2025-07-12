import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth-verify';
import { UsageTracker } from '@/lib/usage-tracker';

export async function GET(request: NextRequest) {
  try {
    // 인증 확인
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const authResult = await verifyAuth(token);
    
    if (!authResult.valid || !authResult.user) {
      return NextResponse.json(
        { error: '유효하지 않은 토큰입니다.' },
        { status: 401 }
      );
    }

    // 사용량 추적기에서 완료 기록 가져오기
    const usageTracker = new UsageTracker(authResult.user.id);
    const history = usageTracker.getCompletionHistory();

    return NextResponse.json({ history });
  } catch (error) {
    console.error('기록 조회 오류:', error);
    return NextResponse.json(
      { error: '기록 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}