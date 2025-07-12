import { NextResponse } from 'next/server';
import automationManager from '@/lib/automation-manager';

export async function POST() {
  try {
    // 모든 세션 강제 중지
    const allSessions = automationManager.getAllSessions();
    
    let stoppedCount = 0;
    for (const sessionId in allSessions) {
      const session = allSessions[sessionId];
      if (session.status === 'running') {
        automationManager.updateSessionStatus(sessionId, 'cancelled', '강제 중지됨');
        automationManager.cancelSession(sessionId);
        stoppedCount++;
        console.log(`[${sessionId}] 강제 중지됨`);
      }
    }

    return NextResponse.json({
      success: true,
      message: `${stoppedCount}개 세션이 중지되었습니다.`
    });

  } catch (error) {
    console.error('모든 세션 중지 오류:', error);
    return NextResponse.json({ 
      error: '세션 중지 중 오류가 발생했습니다.' 
    }, { status: 500 });
  }
}