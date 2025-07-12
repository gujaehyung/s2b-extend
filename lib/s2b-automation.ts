import puppeteer, { Browser, Page } from 'puppeteer';
import { promises as fs } from 'fs';
import path from 'path';
import { UsageTracker } from './usage-tracker';

// 타입 정의
export interface AutomationConfig {
  loginId: string;
  loginPassword: string;
  priceIncreaseRate: number;
  userId: string; // Supabase 사용자 ID
  userPlan?: string; // 사용자 플랜
  sessionId?: string; // 세션 ID (취소 확인용)
}

export interface ProgressUpdate {
  type: 'status' | 'collecting' | 'processing' | 'price' | 'error' | 'total' | 'complete' | 'success';
  message: string;
  current?: number;
  total?: number;
  itemNo?: string;
  timestamp?: string;
}

export interface AutomationResult {
  success: boolean;
  totalItems: number;
  processedItems: number;
  processedCount?: number; // 추가
  totalCount?: number; // 추가
  errors: string[];
  summary: string;
}

// 날짜 범위 계산 (기존 getDateRange 함수)
export function getDateRange() {
  const today = new Date();
  const twoWeeksLater = new Date(today);
  twoWeeksLater.setDate(today.getDate() + 14);

  const formatDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}${month}${day}`;
  };

  return {
    startDate: formatDate(today),
    endDate: formatDate(twoWeeksLater)
  };
}

// Chrome 찾기 함수 (서버 환경용으로 수정)
export async function findChrome(): Promise<string> {
  // 서버 환경에서는 시스템의 Chrome 사용
  const possiblePaths = [
    '/usr/bin/google-chrome',
    '/usr/bin/chromium-browser',
    '/usr/bin/chromium',
    '/snap/bin/chromium',
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  ];

  for (const chromePath of possiblePaths) {
    try {
      await fs.access(chromePath);
      return chromePath;
    } catch (error) {
      continue;
    }
  }
  
  // Chrome이 없으면 Puppeteer의 내장 Chromium 사용
  return '';
}

// 다이얼로그 처리 함수 (개별 처리를 위해 비활성화)
export async function handleDialogs(page: Page): Promise<void> {
  // 개별 물품 처리에서 다이얼로그를 직접 처리하므로 전역 처리는 비활성화
  console.log('다이얼로그 전역 처리 비활성화 (개별 처리 사용)');
}

// 팝업 처리 함수
export async function handlePopup(browser: Browser, page: Page): Promise<void> {
  try {
    await new Promise(resolve => setTimeout(resolve, 2000));

    const pages = await browser.pages();
    for (const newPage of pages) {
      if (newPage !== page) {
        const url = await newPage.url();
        console.log('팝업 URL:', url);

        if (url.includes('certificateInfo_pop.jsp')) {
          console.log('인증서 정보 팝업 감지 - 닫기 시도');
          await newPage.close();
        }
      }
    }
  } catch (error) {
    console.error('팝업 처리 중 오류:', error);
  }
}

// S2B 로그인 함수
export async function login(page: Page, config: AutomationConfig): Promise<boolean> {
  try {
    console.log('로그인 페이지로 이동 중...');
    await page.goto('https://www.s2b.kr/S2BNCustomer/Login.do?type=sp', {
      waitUntil: 'networkidle0',
      timeout: 30000
    });

    console.log('로그인 폼 대기 중...');
    await page.waitForSelector('form[name="vendor_loginForm"] .login_type2', {
      visible: true,
      timeout: 10000
    });

    console.log('로그인 정보 입력 중...');
    await page.type('form[name="vendor_loginForm"] .login_type2 input[name="uid"]', config.loginId);
    await page.type('form[name="vendor_loginForm"] .login_type2 input[name="pwd"]', config.loginPassword);

    console.log('로그인 버튼 클릭...');
    await Promise.all([
      page.click('form[name="vendor_loginForm"] .login_type2 .btn_login a'),
      page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 30000 })
    ]);

    // 로그인 후 쿠키 저장 (사용자별로)
    const cookies = await page.cookies();
    const cookiesPath = path.join(process.cwd(), 'temp', `cookies_${config.userId}.json`);
    
    // temp 디렉토리 생성
    await fs.mkdir(path.dirname(cookiesPath), { recursive: true });
    await fs.writeFile(cookiesPath, JSON.stringify(cookies, null, 2));
    
    console.log('새로운 세션이 저장되었습니다.');
    return true;
  } catch (error) {
    console.error('로그인 중 오류 발생:', error);
    return false;
  }
}

// 검색 결과 수 가져오기
export async function getSearchResults(page: Page, config: AutomationConfig): Promise<number> {
  try {
    console.log('검색 페이지로 이동 중...');
    const dates = getDateRange();
    const searchUrl = `https://www.s2b.kr/S2BNVendor/S2B/srcweb/remu/rema/rema100_list_new.jsp?searchOk=Y&tgruStatus=&search_date=LIMIT_DATE&search_date_start=${dates.startDate}&search_date_end=${dates.endDate}`;
    
    await page.goto(searchUrl, {
      waitUntil: 'networkidle0',
      timeout: 30000
    });

    // 100개씩 보기로 변경
    await changeRowCount(page);

    // 검색 결과 수 가져오기
    const searchResult = await page.evaluate(() => {
      const resultText = document.querySelector('td h1 span.t_r:nth-child(5)');
      if (resultText) {
        const count = resultText.textContent?.match(/\d+/);
        return count ? parseInt(count[0]) : 0;
      }
      return 0;
    });

    console.log(`검색 결과: 총 ${searchResult}건`);
    return searchResult;
  } catch (error) {
    console.error('검색 결과 가져오기 실패:', error);
    return 0;
  }
}

// 페이지당 행 개수 변경
export async function changeRowCount(page: Page): Promise<boolean> {
  try {
    console.log('페이지당 행 개수 100개로 변경 중...');

    await page.select('#rowCount', '100');
    await Promise.all([
      page.click('img[src*="btn_select01.gif"]'),
      page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 30000 })
    ]);

    console.log('페이지당 행 개수가 100개로 변경되었습니다.');
    return true;
  } catch (error) {
    console.error('행 개수 변경 중 오류:', error);
    return false;
  }
}

// 다음 페이지로 이동
export async function goToNextPage(page: Page, targetPageNumber: number, totalPages: number): Promise<boolean> {
  try {
    if (targetPageNumber > totalPages) {
      console.log(`페이지 이동 중단: 타겟 페이지 ${targetPageNumber}이 전체 페이지 ${totalPages}를 초과`);
      return false;
    }

    console.log(`페이지 이동 시작: ${targetPageNumber} 페이지로 (movePage(${targetPageNumber * 100}) 호출)`);

    // movePage 함수가 존재하는지 확인
    const movePageExists = await page.evaluate(() => {
      return typeof (window as any).movePage === 'function';
    });

    if (!movePageExists) {
      console.error('movePage 함수를 찾을 수 없습니다.');
      return false;
    }

    await Promise.all([
      page.evaluate((pageNum) => {
        console.log(`브라우저에서 movePage(${pageNum * 100}) 호출`);
        (window as any).movePage(pageNum * 100);
      }, targetPageNumber),
      page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 30000 })
    ]);

    console.log(`페이지 이동 성공: ${targetPageNumber} 페이지`);
    return true;
  } catch (error) {
    console.error(`페이지 이동 중 오류: ${error}`);
    return false;
  }
}

// 페이지의 모든 물품번호 가져오기
export async function getAllItemNumbers(page: Page, totalResults: number, onProgress: (update: ProgressUpdate) => void): Promise<string[]> {
  const totalPages = Math.ceil(totalResults / 100);
  let allItems: string[] = [];

  onProgress({
    type: 'total',
    message: `총 ${totalResults}건이 검색되었습니다.`
  });

  console.log(`=== 물품번호 수집 시작: 총 ${totalPages}페이지 ===`);

  for (let currentPage = 0; currentPage < totalPages; currentPage++) {
    console.log(`\n>>> ${currentPage + 1}/${totalPages} 페이지 물품번호 수집 중...`);

    onProgress({
      type: 'collecting',
      message: `물품번호 수집 중: ${currentPage + 1}/${totalPages} 페이지`,
      current: currentPage + 1,
      total: totalPages
    });

    // 현재 페이지 URL 확인
    const currentUrl = page.url();
    console.log(`현재 페이지 URL: ${currentUrl}`);

    // 현재 페이지의 물품번호 수집
    const pageItems = await page.evaluate(() => {
      const inputs = document.querySelectorAll('input[name="checkValue"]');
      console.log(`페이지에서 찾은 checkValue input 개수: ${inputs.length}`);
      
      return Array.from(inputs).map((input: any) => {
        const fullValue = input.value;
        const itemNo = fullValue.split('#')[0];
        console.log(`Input value: ${fullValue} -> Item No: ${itemNo}`);
        return itemNo;
      });
    });

    console.log(`${currentPage + 1}페이지에서 수집된 물품번호 (${pageItems.length}개):`, pageItems);
    allItems = allItems.concat(pageItems);
    console.log(`현재까지 총 수집된 물품번호: ${allItems.length}개`);

    // 다음 페이지로 이동 (마지막 페이지가 아닐 경우)
    if (currentPage < totalPages - 1) {
      console.log(`\n>>> ${currentPage + 1}페이지에서 ${currentPage + 2}페이지로 이동...`);
      const moveSuccess = await goToNextPage(page, currentPage + 1, totalPages);
      
      if (!moveSuccess) {
        console.error(`페이지 이동 실패: ${currentPage + 1} -> ${currentPage + 2}`);
        break;
      }
      
      // 페이지 이동 후 URL 확인
      const newUrl = page.url();
      console.log(`페이지 이동 완료. 새 URL: ${newUrl}`);
      
      // 페이지 로딩 대기
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  console.log(`\n=== 물품번호 수집 완료: 총 ${allItems.length}개 ===`);
  console.log('수집된 전체 물품번호 목록:', allItems);
  return allItems;
}

// 개별 물품 처리
export async function processItem(
  page: Page, 
  itemNo: string, 
  currentIndex: number, 
  totalItems: number, 
  config: AutomationConfig,
  onProgress: (update: ProgressUpdate) => void
): Promise<boolean> {
  // 사용량 추적기 초기화
  const usageTracker = new UsageTracker(config.userId);
  
  // 플랜 한도 확인
  const userPlan = config.userPlan || 'free';
  if (!usageTracker.canProcessMore(userPlan)) {
    const remaining = usageTracker.getRemainingUsage(userPlan);
    console.log(`플랜 한도 초과: ${userPlan} 플랜 (남은 사용량: ${remaining}개)`);
    onProgress({
      type: 'error',
      message: `플랜 한도 초과 - ${userPlan} 플랜 한도 도달로 중단됨`,
      itemNo
    });
    return false;
  }
  
  try {
    onProgress({
      type: 'processing',
      message: `${currentIndex}/${totalItems} 처리중 - 물품번호 ${itemNo}`,
      current: currentIndex,
      total: totalItems,
      itemNo
    });

    const detailUrl = `https://www.s2b.kr/S2BNVendor/rema100.do?forwardName=detail&f_re_estimate_code=${itemNo}`;
    await page.goto(detailUrl, { waitUntil: 'networkidle0' });

    console.log(`물품번호 ${itemNo} 상세페이지 접속 완료`);

    // 현재 가격 가져오기
    const currentPrice = await page.evaluate(() => {
      const priceInput = document.querySelector('input[name="f_estimate_amt"]') as HTMLInputElement;
      return priceInput ? priceInput.value.replace(/,/g, '') : null;
    });

    if (currentPrice) {
      // 새 가격 계산
      const oldPrice = parseInt(currentPrice);
      const increaseRate = config.priceIncreaseRate / 100;
      const rawNewPrice = oldPrice * (1 + increaseRate);

      // 100원 단위로 반올림
      const newPrice = Math.round(rawNewPrice / 100) * 100;

      const oldPriceFormatted = oldPrice.toLocaleString('ko-KR');
      const newPriceFormatted = newPrice.toLocaleString('ko-KR');
      
      console.log(`물품번호 ${itemNo} - 가격 수정`);
      console.log(`기존 가격: ${oldPriceFormatted}원`);
      console.log(`인상 가격: ${newPriceFormatted}원 (${config.priceIncreaseRate}% 인상, 100원 단위 반올림)`);

      onProgress({
        type: 'price',
        message: `${currentIndex}/${totalItems} 물품번호 ${itemNo} 처리완료 ${oldPriceFormatted}원 → ${newPriceFormatted}원`,
        itemNo
      });

      // 새 가격으로 input 값 수정 및 이벤트 트리거
      await page.evaluate((price) => {
        const input = document.querySelector('input[name="f_estimate_amt"]') as HTMLInputElement;
        input.value = price.toLocaleString();

        // 필요한 함수들 트리거
        input.dispatchEvent(new Event('change'));
        input.dispatchEvent(new Event('blur'));

        if (typeof (window as any).autoSum === 'function') (window as any).autoSum(1);
        if (typeof (window as any).setGoodsInfo === 'function') (window as any).setGoodsInfo(input);
        if (typeof (window as any).amtCheck === 'function') (window as any).amtCheck('1');
      }, newPrice);

      await new Promise(resolve => setTimeout(resolve, 1000));

      console.log('관리일 연장 시작...');

      // 첫 번째 다이얼로그 처리 설정
      await new Promise<void>((resolve) => {
        page.once('dialog', async (dialog) => {
          try {
            console.log('다이얼로그1:', dialog.message());
            if (dialog.type() === 'confirm') {
              await dialog.accept();
            }
          } catch (error) {
            console.log('다이얼로그1 이미 처리됨:', error instanceof Error ? error.message : String(error));
          }
          resolve();
        });

        // 관리일 연장 버튼 클릭
        page.click('a[href="javascript:fnLimitDateUpdate();"]');
      });

      // 잠시 대기 후 두 번째 다이얼로그 대기
      await new Promise(resolve => setTimeout(resolve, 1000));

      // 두 번째 다이얼로그 처리 설정
      await new Promise<void>((resolve) => {
        const timeout = setTimeout(() => {
          console.log('다이얼로그2 타임아웃 - 이미 처리되었을 가능성');
          resolve();
        }, 5000);

        page.once('dialog', async (dialog) => {
          clearTimeout(timeout);
          try {
            console.log('다이얼로그2:', dialog.message());
            if (dialog.type() === 'alert') {
              await dialog.accept();
            }
          } catch (error) {
            console.log('다이얼로그2 이미 처리됨:', error instanceof Error ? error.message : String(error));
          }
          resolve();
        });
      });

      await new Promise(resolve => setTimeout(resolve, 2000));

      console.log(`물품번호 ${itemNo} 처리 완료 - 처리됨으로 표시`);
      
      // 사용량 추적에 추가
      usageTracker.addProcessedItem(itemNo, oldPrice, newPrice);
      
      return true;
    } else {
      console.log(`물품번호 ${itemNo} - 가격 정보를 찾을 수 없음`);
      onProgress({
        type: 'error',
        message: `물품번호 ${itemNo} - 가격 정보를 찾을 수 없음`,
        itemNo
      });
      return false;
    }
  } catch (error) {
    console.error(`물품번호 ${itemNo} 처리 중 오류:`, error);
    onProgress({
      type: 'error',
      message: `오류 발생: 물품번호 ${itemNo} - ${error}`,
      itemNo
    });
    return false;
  }
}

// 처리된 항목 관리
export class ProcessedItemsManager {
  private filePath: string;
  private processedData: { date: string; items: Set<string> };

  constructor(userId: string) {
    this.filePath = path.join(process.cwd(), 'temp', `processed_items_${userId}.json`);
    this.processedData = this.loadProcessedItems();
  }

  private loadProcessedItems(): { date: string; items: Set<string> } {
    try {
      const today = new Date().toISOString().split('T')[0];

      // temp 디렉토리 생성
      const dir = path.dirname(this.filePath);
      if (!require('fs').existsSync(dir)) {
        require('fs').mkdirSync(dir, { recursive: true });
      }

      if (require('fs').existsSync(this.filePath)) {
        const data = require('fs').readFileSync(this.filePath, 'utf8');
        if (!data.trim()) {
          return { date: today, items: new Set() };
        }

        try {
          const parsed = JSON.parse(data);
          if (parsed.date === today) {
            console.log('오늘 처리된 항목 불러옴:', parsed.items.length + '개');
            return { date: today, items: new Set(parsed.items) };
          } else {
            console.log('새로운 날짜 감지, 처리된 항목 초기화');
            return { date: today, items: new Set() };
          }
        } catch (parseError) {
          console.log('처리된 항목 파일 손상, 새로 시작합니다.');
          return { date: today, items: new Set() };
        }
      }

      return { date: today, items: new Set() };
    } catch (error) {
      const today = new Date().toISOString().split('T')[0];
      console.log('처리된 항목 파일 초기화');
      return { date: today, items: new Set() };
    }
  }

  public isProcessed(itemNo: string): boolean {
    return this.processedData.items.has(itemNo);
  }

  public markAsProcessed(itemNo: string): void {
    try {
      this.processedData.items.add(itemNo);
      const dataToSave = {
        date: this.processedData.date,
        items: [...this.processedData.items]
      };
      require('fs').writeFileSync(this.filePath, JSON.stringify(dataToSave, null, 2));
    } catch (error) {
      console.error('처리된 항목 저장 실패:', error);
    }
  }

  public getProcessedCount(): number {
    return this.processedData.items.size;
  }
}