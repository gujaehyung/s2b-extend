import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { automationScheduler } from '@/lib/automation-scheduler';

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

    // 사용자 스케줄 상태 조회
    const scheduleStatus = await automationScheduler.getSchedulesForUser(user.id);
    
    // 사용자 프로필에서 플랜 정보 가져오기
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('plan')
      .eq('id', user.id)
      .single();

    const userPlan = profile?.plan || 'free';
    const maxAccounts = userPlan === 'premium' ? 5 : userPlan === 'basic' ? 3 : 0;

    return NextResponse.json({
      success: true,
      isSchedulingEnabled: scheduleStatus.isSchedulingEnabled,
      maxAccounts,
      schedules: scheduleStatus.schedules.map(s => ({
        userId: s.userId,
        accountId: s.accountId,
        accountName: s.accountName || '',
        isActive: s.isActive,
        lastRunTime: s.lastRunTime,
        nextRunTime: s.nextRunTime
      }))
    });

  } catch (error) {
    console.error('스케줄 상태 조회 오류:', error);
    return NextResponse.json({ 
      error: '스케줄 상태 조회 중 오류가 발생했습니다.' 
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
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

    // 사용자 프로필 정보 가져오기
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    // 사용자 메타데이터의 플랜을 우선 확인, 없으면 DB 프로필, 그것도 없으면 기본값
    const userPlan = user.user_metadata?.plan || profile?.plan || 'free';
    
    // 디버깅 로그 추가
    console.log('스케줄링 API - 사용자 플랜:', userPlan);
    console.log('스케줄링 API - 프로필 정보:', profile);

    // 요청 본문 파싱
    const body = await request.json();
    const { action, enabled, accountId, accountIds } = body;

    if (action === 'enable' || action === 'disable') {
      // 스케줄링 활성화/비활성화
      const enabled = action === 'enable';
      console.log('스케줄링 API - 활성화 요청:', enabled);
      console.log('스케줄링 API - 선택된 계정들:', accountIds);
      
      const success = await automationScheduler.setSchedulingEnabled(user.id, userPlan, enabled, accountIds);
      
      if (!success) {
        return NextResponse.json({ 
          error: '스케줄링 설정에 실패했습니다. 현재 플랜에서는 자동 스케줄링을 사용할 수 없습니다.' 
        }, { status: 400 });
      }

      return NextResponse.json({
        success: true,
        message: enabled ? '자동 스케줄링이 활성화되었습니다.' : '자동 스케줄링이 비활성화되었습니다.'
      });

    } else if (action === 'run_manual' && accountId) {
      // 수동 스케줄 실행
      const success = await automationScheduler.runScheduleManually(user.id, accountId, userPlan);
      
      if (!success) {
        return NextResponse.json({ 
          error: '수동 실행에 실패했습니다.' 
        }, { status: 400 });
      }

      return NextResponse.json({
        success: true,
        message: '계정의 자동화가 수동으로 실행되었습니다.'
      });

    } else {
      return NextResponse.json({ 
        error: '잘못된 요청입니다.' 
      }, { status: 400 });
    }

  } catch (error) {
    console.error('스케줄링 설정 오류:', error);
    return NextResponse.json({ 
      error: '스케줄링 설정 중 오류가 발생했습니다.' 
    }, { status: 500 });
  }
}