import { NextRequest } from 'next/server';
import automationManager from '@/lib/automation-manager';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const { sessionId } = await params;
  
  // SSE 응답 설정
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const sendEvent = (data: any) => {
        const message = `data: ${JSON.stringify(data)}\n\n`;
        controller.enqueue(encoder.encode(message));
      };

      // 초기 상태 전송
      const session = automationManager.getSession(sessionId);
      if (!session) {
        sendEvent({ status: 'error', message: '세션을 찾을 수 없습니다.' });
        controller.close();
        return;
      }

      sendEvent({
        status: session.status,
        currentTask: '자동화 시작 중...',
        progress: 0,
        itemsProcessed: 0,
        totalItems: 0,
        message: '자동화를 시작합니다.'
      });

      // 실제 세션 상태 모니터링
      let checkCount = 0;
      let isClosed = false;
      
      const cleanup = () => {
        if (!isClosed) {
          isClosed = true;
          clearInterval(interval);
          try {
            controller.close();
          } catch (error) {
            // 이미 닫힌 경우 무시
          }
        }
      };

      const interval = setInterval(() => {
        if (isClosed) return;
        
        checkCount++;
        const currentSession = automationManager.getSession(sessionId);
        
        if (!currentSession) {
          sendEvent({ status: 'error', message: '세션을 찾을 수 없습니다.' });
          cleanup();
          return;
        }

        const logs = automationManager.getSessionLogs(sessionId);
        const stats = automationManager.getSessionStats(sessionId);
        
        // 세션이 완료되거나 오류 상태일 때
        if (currentSession.status === 'completed' || currentSession.status === 'error') {
          const finalMessage = currentSession.status === 'completed' 
            ? (currentSession.result?.processedCount === 0 
              ? '자동화가 완료되었습니다. 처리할 항목이 없습니다.'
              : `자동화가 완료되었습니다. 처리된 항목: ${currentSession.result?.processedCount || 0}개`)
            : '자동화 중 오류가 발생했습니다.';
            
          sendEvent({
            status: currentSession.status,
            currentTask: currentSession.status === 'completed' ? '완료' : '오류 발생',
            progress: 100,
            itemsProcessed: currentSession.result?.processedCount || 0,
            totalItems: currentSession.result?.totalCount || 0,
            message: finalMessage
          });
          cleanup();
          return;
        }

        // 진행 상황 업데이트
        const currentTask = currentSession.progress.currentTask || '처리 중...';
        const progress = currentSession.progress.percentage || 0;
        const currentItems = currentSession.progress.current || 0;
        const totalItems = currentSession.progress.total || 0;
        
        sendEvent({
          status: currentSession.status,
          currentTask,
          progress,
          itemsProcessed: currentItems,
          totalItems,
          message: logs.length > 0 ? logs[logs.length - 1]?.message : currentTask
        });

        // 30초 후 타임아웃
        if (checkCount > 30) {
          cleanup();
        }
      }, 1000);

      // 30초 후 타임아웃
      setTimeout(() => {
        cleanup();
      }, 30000);
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}