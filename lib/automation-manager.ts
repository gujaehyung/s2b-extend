import { EventEmitter } from 'events';
import { AutomationConfig, ProgressUpdate, AutomationResult } from './s2b-automation';

export interface AutomationSession {
  id: string;
  userId: string;
  status: 'pending' | 'running' | 'completed' | 'error' | 'cancelled';
  config: AutomationConfig;
  startTime: Date;
  endTime?: Date;
  progress: {
    current: number;
    total: number;
    percentage: number;
    currentTask: string;
  };
  result?: AutomationResult;
  logs: ProgressUpdate[];
}

class AutomationManager extends EventEmitter {
  private sessions: Map<string, AutomationSession> = new Map();
  private activeProcesses: Map<string, boolean> = new Map();

  // 새 세션 생성
  createSession(userId: string, config: AutomationConfig): string {
    const sessionId = `automation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const session: AutomationSession = {
      id: sessionId,
      userId,
      status: 'pending',
      config,
      startTime: new Date(),
      progress: {
        current: 0,
        total: 0,
        percentage: 0,
        currentTask: '자동화 준비 중...'
      },
      logs: []
    };

    this.sessions.set(sessionId, session);
    console.log(`새 자동화 세션 생성: ${sessionId} (사용자: ${userId})`);
    
    return sessionId;
  }

  // 세션 상태 가져오기
  getSession(sessionId: string): AutomationSession | undefined {
    return this.sessions.get(sessionId);
  }

  // 사용자의 모든 세션 가져오기
  getUserSessions(userId: string): AutomationSession[] {
    return Array.from(this.sessions.values()).filter(session => session.userId === userId);
  }

  // 세션 상태 업데이트
  updateSessionStatus(sessionId: string, status: AutomationSession['status']): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.status = status;
      if (status === 'completed' || status === 'error' || status === 'cancelled') {
        session.endTime = new Date();
        this.activeProcesses.delete(sessionId);
      }
      this.emit('sessionStatusChanged', sessionId, status);
    }
  }

  // 진행상황 업데이트
  updateProgress(sessionId: string, update: ProgressUpdate): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      // 로그 추가 (timestamp 포함)
      session.logs.push({
        ...update,
        type: update.type,
        message: update.message,
        timestamp: new Date().toISOString()
      });

      // 진행상황 업데이트
      if (update.current !== undefined && update.total !== undefined) {
        session.progress.current = update.current;
        session.progress.total = update.total;
        session.progress.percentage = Math.round((update.current / update.total) * 100);
      }

      session.progress.currentTask = update.message;

      // 클라이언트에 실시간 업데이트 전송
      this.emit('progressUpdate', sessionId, update);
    }
  }

  // 세션 결과 설정
  setSessionResult(sessionId: string, result: AutomationResult): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.result = result;
      session.status = result.success ? 'completed' : 'error';
      session.endTime = new Date();
      this.activeProcesses.delete(sessionId);
      
      this.emit('sessionCompleted', sessionId, result);
    }
  }

  // 세션 취소
  cancelSession(sessionId: string): boolean {
    const session = this.sessions.get(sessionId);
    if (session && session.status === 'running') {
      this.activeProcesses.set(sessionId, false); // 취소 플래그 설정
      this.updateSessionStatus(sessionId, 'cancelled');
      return true;
    }
    return false;
  }

  // 세션이 취소되었는지 확인
  isSessionCancelled(sessionId: string): boolean {
    return this.activeProcesses.get(sessionId) === false;
  }

  // 활성 프로세스로 표시
  markAsActive(sessionId: string): void {
    this.activeProcesses.set(sessionId, true);
    this.updateSessionStatus(sessionId, 'running');
  }

  // 세션 삭제 (완료된 세션 정리용)
  deleteSession(sessionId: string): boolean {
    const session = this.sessions.get(sessionId);
    if (session && session.status !== 'running') {
      this.sessions.delete(sessionId);
      this.activeProcesses.delete(sessionId);
      return true;
    }
    return false;
  }

  // 실행 중인 세션 수
  getActiveSessionsCount(): number {
    return Array.from(this.sessions.values()).filter(session => session.status === 'running').length;
  }

  // 세션 로그 가져오기
  getSessionLogs(sessionId: string): ProgressUpdate[] {
    const session = this.sessions.get(sessionId);
    return session ? session.logs : [];
  }

  // 세션 통계 가져오기
  getSessionStats(sessionId: string): { processed: number; total: number; success: number; failed: number } {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return { processed: 0, total: 0, success: 0, failed: 0 };
    }
    
    const successLogs = session.logs.filter(log => log.type === 'success').length;
    const errorLogs = session.logs.filter(log => log.type === 'error').length;
    
    return {
      processed: session.progress.current,
      total: session.progress.total,
      success: successLogs,
      failed: errorLogs
    };
  }

  // 사용자별 실행 중인 세션 수
  getUserActiveSessionsCount(userId: string): number {
    return Array.from(this.sessions.values())
      .filter(session => session.userId === userId && session.status === 'running').length;
  }

  // 세션 성능 통계
  getSessionPerformanceStats(sessionId: string): {
    duration: number;
    itemsPerMinute: number;
    estimatedTimeRemaining: number;
  } | null {
    const session = this.sessions.get(sessionId);
    if (!session) return null;

    const now = new Date();
    const duration = now.getTime() - session.startTime.getTime();
    const durationInMinutes = duration / (1000 * 60);

    const itemsPerMinute = session.progress.current > 0 ? session.progress.current / durationInMinutes : 0;
    const remainingItems = session.progress.total - session.progress.current;
    const estimatedTimeRemaining = itemsPerMinute > 0 ? remainingItems / itemsPerMinute : 0;

    return {
      duration: Math.round(duration / 1000), // 초 단위
      itemsPerMinute: Math.round(itemsPerMinute * 100) / 100,
      estimatedTimeRemaining: Math.round(estimatedTimeRemaining) // 분 단위
    };
  }

  // 메모리 정리 (오래된 세션 삭제)
  cleanup(): void {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    for (const [sessionId, session] of this.sessions.entries()) {
      if (session.status !== 'running' && session.startTime < oneHourAgo) {
        this.deleteSession(sessionId);
        console.log(`오래된 세션 정리: ${sessionId}`);
      }
    }
  }
}

// 싱글톤 인스턴스
export const automationManager = new AutomationManager();

// 1시간마다 정리 작업 실행
setInterval(() => {
  automationManager.cleanup();
}, 60 * 60 * 1000);

export default automationManager;