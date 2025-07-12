import { NextRequest, NextResponse } from 'next/server';
import { UsageTracker } from '@/lib/usage-tracker';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ 
        success: false, 
        error: '사용자 ID가 필요합니다.' 
      }, { status: 400 });
    }

    // 사용량 추적기에서 활동 내역 가져오기
    const usageTracker = new UsageTracker(userId);
    const activities = usageTracker.getActivities();

    // 활동 내역을 대시보드 형식으로 변환
    const formattedActivities = activities.map((activity, index) => ({
      id: activity.id,
      action: activity.action,
      items: activity.items || 0,
      time: activity.time,
      status: activity.status || 'info',
      type: activity.action.includes('자동') ? 'scheduled' : 'manual'
    }));

    // 최근 순으로 정렬
    formattedActivities.sort((a, b) => b.id - a.id);

    return NextResponse.json({
      success: true,
      activities: formattedActivities.slice(0, 10) // 최근 10개만 반환
    });

  } catch (error) {
    console.error('Dashboard activities error:', error);
    return NextResponse.json({ 
      success: false, 
      error: '활동 내역 조회 중 오류가 발생했습니다.' 
    }, { status: 500 });
  }
}