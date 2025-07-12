import { NextRequest, NextResponse } from 'next/server';
import { UsageTracker } from '@/lib/usage-tracker';
import { automationScheduler } from '@/lib/automation-scheduler';
import { promises as fs } from 'fs';
import path from 'path';

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

    // 사용량 추적기 초기화
    const usageTracker = new UsageTracker(userId);
    const monthlyUsage = usageTracker.getMonthlyUsage();
    const totalProcessed = usageTracker.getTotalProcessed();

    // 오늘 통계 계산
    const today = new Date().toISOString().split('T')[0];
    const todayActivities = usageTracker.getActivities().filter(activity => {
      const activityDate = new Date(activity.id).toISOString().split('T')[0];
      return activityDate === today;
    });

    const todayStats = {
      processed: todayActivities.reduce((sum, act) => sum + (act.items || 0), 0),
      success: todayActivities.filter(act => act.status === 'success').length,
      failed: todayActivities.filter(act => act.status === 'error').length,
      nextScheduled: null as Date | null
    };

    // 다음 스케줄 확인
    const schedules = await automationScheduler.getSchedulesForUser(userId);
    
    if (schedules.isSchedulingEnabled && schedules.schedules.length > 0) {
      const activeSchedules = schedules.schedules
        .filter(s => s.isActive)
        .map(s => new Date(s.nextRunTime))
        .sort((a, b) => a.getTime() - b.getTime());
      
      if (activeSchedules.length > 0) {
        todayStats.nextScheduled = activeSchedules[0];
      }
    }

    // 일별 통계 (최근 7일)
    const dailyStats = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const dayActivities = usageTracker.getActivities().filter(activity => {
        const activityDate = new Date(activity.id).toISOString().split('T')[0];
        return activityDate === dateStr;
      });
      
      dailyStats.push({
        date: dateStr,
        count: dayActivities.reduce((sum, act) => sum + (act.items || 0), 0)
      });
    }

    return NextResponse.json({
      success: true,
      monthlyUsage,
      totalProcessed,
      todayStats,
      dailyStats
    });

  } catch (error) {
    console.error('Dashboard stats error:', error);
    return NextResponse.json({ 
      success: false, 
      error: '통계 조회 중 오류가 발생했습니다.' 
    }, { status: 500 });
  }
}