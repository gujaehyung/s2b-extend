import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import automationManager from '@/lib/automation-manager';
import { runAutomationSmart } from '@/lib/s2b-runner';

export async function POST(request: NextRequest) {
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

    // 요청 데이터 파싱
    const body = await request.json();
    const { loginId, loginPassword, priceIncreaseRate, userPlan: requestedPlan } = body;

    // 입력값 검증
    if (!loginId || !loginPassword || priceIncreaseRate === undefined) {
      return NextResponse.json({ 
        error: '로그인 ID, 비밀번호, 가격 인상률이 필요합니다.' 
      }, { status: 400 });
    }

    if (priceIncreaseRate < 0 || priceIncreaseRate > 100) {
      return NextResponse.json({ 
        error: '가격 인상률은 0-100% 사이여야 합니다.' 
      }, { status: 400 });
    }

    // 이미 실행 중인 세션이 있는지 확인
    const activeSessionsCount = automationManager.getUserActiveSessionsCount(user.id);
    if (activeSessionsCount > 0) {
      return NextResponse.json({ 
        error: '이미 실행 중인 자동화가 있습니다. 완료 후 다시 시도해주세요.' 
      }, { status: 409 });
    }

    // 사용자 프로필 정보 가져오기
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    // 요청에서 전달된 플랜 정보를 우선 사용, 없으면 DB에서 가져온 정보 사용
    const userPlan = requestedPlan || profile?.plan || 'free';
    
    console.log('플랜 정보 확인:');
    console.log('- 요청에서 전달된 플랜:', requestedPlan);
    console.log('- DB에서 가져온 플랜:', profile?.plan);
    console.log('- 최종 사용할 플랜:', userPlan);

    // 플랜별 사용량 한도 확인
    const { UsageTracker } = await import('@/lib/usage-tracker');
    const usageTracker = new UsageTracker(user.id);
    
    if (!usageTracker.canProcessMore(userPlan)) {
      const remaining = usageTracker.getRemainingUsage(userPlan);
      const planLimits = {
        free: '총 10개',
        standard: '월 100개',
        basic: '월 500개',
        premium: '무제한'
      };
      
      return NextResponse.json({ 
        error: `플랜 한도 초과: ${userPlan} 플랜 (${planLimits[userPlan as keyof typeof planLimits]}) 한도를 모두 사용했습니다. 남은 사용량: ${remaining}개`
      }, { status: 403 });
    }

    // 자동화 설정
    const config = {
      loginId,
      loginPassword,
      priceIncreaseRate: parseFloat(priceIncreaseRate),
      userId: user.id,
      userPlan
    };

    // 새 세션 생성
    const sessionId = automationManager.createSession(user.id, config);

    // 백그라운드에서 자동화 실행 (플랜에 따라 자동으로 방식 선택)
    runAutomationSmart(sessionId, config).catch(error => {
      console.error('자동화 실행 중 오류:', error);
      automationManager.updateSessionStatus(sessionId, 'error');
    });

    return NextResponse.json({
      success: true,
      sessionId,
      message: '자동화가 시작되었습니다.'
    });

  } catch (error) {
    console.error('자동화 시작 오류:', error);
    return NextResponse.json({ 
      error: '자동화 시작 중 오류가 발생했습니다.' 
    }, { status: 500 });
  }
}