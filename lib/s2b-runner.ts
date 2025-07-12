import puppeteer from 'puppeteer';
import {
  AutomationConfig,
  ProgressUpdate,
  AutomationResult,
  findChrome,
  handleDialogs,
  handlePopup,
  login,
  getSearchResults,
  getAllItemNumbers,
  processItem,
  ProcessedItemsManager
} from './s2b-automation';
import {
  collectAllGoodsNumbers,
  processAllGoodsWithAxios,
  loadCookies,
  loginWithPuppeteer
} from './s2b-axios-automation';
import { UsageTracker } from './usage-tracker';
import automationManager from './automation-manager';

// axios 방식으로 실행하는 새로운 함수
export async function runAutomationWithAxios(sessionId: string, config: AutomationConfig): Promise<void> {
  try {
    // 이미 실행 중인 세션이 있는지 확인
    const existingSession = automationManager.getSession(sessionId);
    if (existingSession && existingSession.status === 'running') {
      console.log(`[${sessionId}] 이미 실행 중인 세션입니다.`);
      return;
    }

    // 세션을 활성 상태로 표시
    automationManager.markAsActive(sessionId);

    // 사용량 추적기 초기화
    const usageTracker = new UsageTracker(config.userId);

    // 진행 상황 업데이트 함수
    const updateProgress = (update: ProgressUpdate) => {
      automationManager.updateProgress(sessionId, update);
    };

    // 자동화 시작 - 활동 기록 없음 (사용자에게 불필요한 정보)

    updateProgress({
      type: 'status',
      message: '로그인을 시작합니다.'
    });

    // 세션 쿠키 확인
    const cookies = await loadCookies(config.userId);
    if (cookies.length === 0) {
      updateProgress({
        type: 'status',
        message: '로그인을 시작합니다.'
      });
      
      const newCookies = await loginWithPuppeteer(config);
      if (!newCookies) {
        updateProgress({
          type: 'error',
          message: '계정이 올바르지 않은것 같습니다. 계정관리탭에서 계정 설정을 올바르게 해주세요'
        });
        throw new Error('로그인 실패');
      }
    }

    // 취소 확인
    if (automationManager.isSessionCancelled(sessionId)) {
      throw new Error('사용자에 의해 취소되었습니다.');
    }

    // axios 방식으로 처리 (sessionId 포함)
    const result = await processAllGoodsWithAxios({...config, sessionId}, updateProgress);

    // 최종 결과
    const automationResult: AutomationResult = {
      success: result.success,
      totalItems: result.processedCount,
      processedItems: result.processedCount,
      errors: result.errors,
      summary: result.success 
        ? `총 ${result.processedCount}개 항목 처리 완료`
        : `처리 실패: ${result.errors.join(', ')}`
    };

    automationManager.setSessionResult(sessionId, automationResult);
    automationManager.updateSessionStatus(sessionId, result.success ? 'completed' : 'error');

    updateProgress({
      type: 'complete',
      message: result.processedCount === 0 
        ? '연장할 품목이 0개 밖에 없습니다. 연장할 품목이 없어 종료 되었습니다.'
        : `자동 관리일연장 처리 완료: ${result.processedCount}개 처리 완료 되었습니다. s2b사이트에서 확인해보세요`
    });

    // 자동화 완료 활동 추가
    if (result.processedCount > 0) {
      usageTracker.addActivity(`자동화 완료: 총 ${result.processedCount}개 항목 처리 완료`, result.processedCount, 'success');
    } else {
      usageTracker.addActivity('자동화 완료: 처리할 항목이 없습니다', 0, 'info');
    }
    
    // 완료 기록 추가
    if (result.processedCount > 0) {
      usageTracker.addCompletionRecord(result.processedCount);
    }

  } catch (error) {
    console.error('자동화 실행 중 오류:', error);
    
    // 세션 상태를 실패로 업데이트
    automationManager.updateSessionStatus(sessionId, 'error');
    
    const result: AutomationResult = {
      success: false,
      totalItems: 0,
      processedItems: 0,
      errors: [String(error)],
      summary: `자동화 실패: ${error}`
    };

    automationManager.setSessionResult(sessionId, result);
    
    automationManager.updateProgress(sessionId, {
      type: 'error',
      message: `자동화 중단됨: ${error}`
    });

    automationManager.updateProgress(sessionId, {
      type: 'complete',
      message: '자동화가 실패로 종료되었습니다.'
    });
  }
}

// 기존 Puppeteer 방식 (백업용으로 유지)
export async function runAutomation(sessionId: string, config: AutomationConfig): Promise<void> {
  let browser = null;
  let page = null;
  
  try {
    // 이미 실행 중인 세션이 있는지 확인
    const existingSession = automationManager.getSession(sessionId);
    if (existingSession && existingSession.status === 'running') {
      console.log(`[${sessionId}] 이미 실행 중인 세션입니다.`);
      return;
    }

    // 세션을 활성 상태로 표시
    automationManager.markAsActive(sessionId);

    // 사용량 추적기 초기화
    const usageTracker = new UsageTracker(config.userId);

    // 진행 상황 업데이트 함수
    const updateProgress = (update: ProgressUpdate) => {
      automationManager.updateProgress(sessionId, update);
    };

    // 자동화 시작 - 활동 기록 없음 (사용자에게 불필요한 정보)

    updateProgress({
      type: 'status',
      message: '브라우저 실행중...'
    });

    // Chrome 경로 찾기
    const chromePath = await findChrome();
    console.log('Chrome 경로:', chromePath || 'Puppeteer 내장 Chromium 사용');

    // Puppeteer 브라우저 시작
    const launchOptions: any = {
      headless: 'new', // 서버 환경에서는 headless 모드
      defaultViewport: { width: 1920, height: 1080 },
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor'
      ]
    };

    // Chrome 경로가 있으면 사용
    if (chromePath) {
      launchOptions.executablePath = chromePath;
    }

    browser = await puppeteer.launch(launchOptions);
    page = await browser.newPage();

    // 다이얼로그 처리 설정
    await handleDialogs(page);

    updateProgress({
      type: 'status',
      message: 'S2B 로그인중...'
    });

    // 로그인 시도
    let loginSuccess = false;
    let loginError = '';
    
    try {
      loginSuccess = await login(page, config);
    } catch (error) {
      loginError = error.message;
      console.log(`[${sessionId}] 로그인 중 오류:`, error);
      
      // 타임아웃 vs 기타 오류 구분
      if (error.name === 'TimeoutError') {
        updateProgress({
          type: 'error',
          message: '비밀번호가 틀렸습니다. 계정관리에서 다시 설정 해주세요.'
        });
      } else {
        updateProgress({
          type: 'error', 
          message: `로그인 오류: ${error.message}`
        });
      }
    }
    
    if (!loginSuccess) {
      // 상태를 실패로 업데이트
      automationManager.updateSessionStatus(sessionId, 'error');
      
      const errorMsg = loginError ? 
        `로그인에 실패했습니다: ${loginError}` : 
        '로그인에 실패했습니다. 아이디와 비밀번호를 확인해주세요.';
      
      updateProgress({
        type: 'error',
        message: errorMsg
      });
      
      throw new Error(errorMsg);
    }

    // 취소 확인
    if (automationManager.isSessionCancelled(sessionId)) {
      throw new Error('사용자에 의해 취소되었습니다.');
    }

    // 팝업 처리
    await handlePopup(browser, page);

    updateProgress({
      type: 'status',
      message: '처리 대상 물품 검색중...'
    });

    // 검색 결과 가져오기
    const totalResults = await getSearchResults(page, config);
    console.log(`[${sessionId}] 검색 결과:`, totalResults, '개');
    
    if (totalResults === 0) {
      // 검색 결과가 없는 경우 정상 완료 처리
      const result: AutomationResult = {
        success: true,
        totalItems: 0,
        processedItems: 0,
        errors: [],
        summary: '관리일 연장할 대상이 없습니다.'
      };

      automationManager.setSessionResult(sessionId, result);
      automationManager.updateSessionStatus(sessionId, 'completed');
      
      updateProgress({
        type: 'complete',
        message: '자동화 완료 - 관리일 연장할 대상이 없습니다.'
      });

      // 자동화 완료 활동 추가
      usageTracker.addActivity('자동화 완료: 관리일 연장할 대상이 없습니다.', 0, 'info');
      
      return; // 여기서 종료
    }

    updateProgress({
      type: 'total',
      message: `총 ${totalResults}개 물품 발견`
    });

    // 취소 확인
    if (automationManager.isSessionCancelled(sessionId)) {
      throw new Error('사용자에 의해 취소되었습니다.');
    }

    // 모든 물품번호 수집
    const allItems = await getAllItemNumbers(page, totalResults, updateProgress);

    // 처리된 항목 관리자 초기화
    const processedManager = new ProcessedItemsManager(config.userId);

    // 이미 처리된 항목 필터링
    console.log(`\n=== 처리된 항목 필터링 시작 ===`);
    console.log(`전체 수집된 물품번호: ${allItems.length}개`);
    console.log(`이미 처리된 물품번호: ${processedManager.getProcessedCount()}개`);
    
    const unprocessedItems = allItems.filter(itemNo => {
      const isProcessed = processedManager.isProcessed(itemNo);
      if (isProcessed) {
        console.log(`물품번호 ${itemNo}: 이미 처리됨 - 건너뛰기`);
      } else {
        console.log(`물품번호 ${itemNo}: 미처리 - 처리 대상`);
      }
      return !isProcessed;
    });

    console.log(`처리 대상 물품번호: ${unprocessedItems.length}개`);
    console.log(`처리 대상 목록:`, unprocessedItems);
    console.log(`=== 처리된 항목 필터링 완료 ===\n`);

    updateProgress({
      type: 'status',
      message: `${unprocessedItems.length}개 물품 처리 시작`
    });

    let processedCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    // 각 물품 처리
    for (let i = 0; i < unprocessedItems.length; i++) {
      // 취소 확인
      if (automationManager.isSessionCancelled(sessionId)) {
        throw new Error('사용자에 의해 취소되었습니다.');
      }

      const itemNo = unprocessedItems[i];
      const currentIndex = i + 1;

      try {
        const success = await processItem(
          page,
          itemNo,
          currentIndex,
          unprocessedItems.length,
          config,
          updateProgress
        );

        if (success) {
          processedManager.markAsProcessed(itemNo);
          processedCount++;
        } else {
          errorCount++;
          errors.push(`물품번호 ${itemNo}: 처리 실패`);
        }

        // 처리 간 딜레이 (서버 과부하 방지)
        await new Promise(resolve => setTimeout(resolve, 2000));

      } catch (error) {
        console.error(`물품번호 ${itemNo} 처리 중 오류:`, error);
        errorCount++;
        errors.push(`물품번호 ${itemNo}: ${error}`);
        
        updateProgress({
          type: 'error',
          message: `물품번호 ${itemNo} 처리 실패: ${error}`,
          itemNo
        });
      }
    }

    // 최종 결과
    const result: AutomationResult = {
      success: errorCount === 0,
      totalItems: unprocessedItems.length,
      processedItems: processedCount,
      errors,
      summary: `총 ${unprocessedItems.length}개 중 ${processedCount}개 처리 완료${errorCount > 0 ? `, ${errorCount}개 오류` : ''}`
    };

    automationManager.setSessionResult(sessionId, result);

    updateProgress({
      type: 'status',
      message: `자동화 완료 - ${processedCount}개 처리됨`
    });

    // 자동화 완료 활동 추가
    if (processedCount > 0) {
      usageTracker.addActivity(`자동화 완료: 총 ${processedCount}개 항목 처리 완료`, processedCount, 'success');
    } else {
      usageTracker.addActivity('자동화 완료: 처리할 항목이 없습니다', 0, 'info');
    }
    
    // 완료 기록 추가
    if (processedCount > 0) {
      usageTracker.addCompletionRecord(processedCount);
    }

  } catch (error) {
    console.error('자동화 실행 중 오류:', error);
    
    // 세션 상태를 실패로 업데이트
    automationManager.updateSessionStatus(sessionId, 'error');
    
    const result: AutomationResult = {
      success: false,
      totalItems: 0,
      processedItems: 0,
      errors: [String(error)],
      summary: `자동화 실패: ${error}`
    };

    automationManager.setSessionResult(sessionId, result);
    
    automationManager.updateProgress(sessionId, {
      type: 'error',
      message: `자동화 중단됨: ${error}`
    });

    // 최종 완료 상태 알림
    automationManager.updateProgress(sessionId, {
      type: 'complete',
      message: '자동화가 실패로 종료되었습니다.'
    });

  } finally {
    // 리소스 정리
    try {
      if (page) await page.close();
      if (browser) await browser.close();
    } catch (error) {
      console.error('브라우저 정리 중 오류:', error);
    }
  }
}

// 모든 플랜에서 axios 방식을 사용하는 메인 함수
export async function runAutomationSmart(sessionId: string, config: AutomationConfig): Promise<void> {
  // 모든 플랜에서 동일하게 axios 방식 사용
  console.log(`[${sessionId}] ${config.userPlan || 'free'} 플랜 - axios 방식 사용`);
  return runAutomationWithAxios(sessionId, config);
}