import axios, { AxiosInstance } from 'axios';
import { promises as fs } from 'fs';
import path from 'path';
import puppeteer from 'puppeteer';
import { AutomationConfig, ProgressUpdate, getDateRange, ProcessedItemsManager } from './s2b-automation';
import { automationManager } from './automation-manager';
import { UsageTracker } from './usage-tracker';

// axios 인스턴스 생성
const createAxiosInstance = (): AxiosInstance => {
  return axios.create({
    baseURL: 'https://www.s2b.kr',
    headers: {
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
      'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
      'Connection': 'keep-alive',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36'
    },
    timeout: 30000
  });
};

// 쿠키 파일 경로 생성
const getCookiesPath = (userId: string): string => {
  return path.join(process.cwd(), 'temp', `cookies_${userId}.json`);
};

// 쿠키 로드
export async function loadCookies(userId: string): Promise<any[]> {
  try {
    const cookiesPath = getCookiesPath(userId);
    if (await fs.access(cookiesPath).then(() => true).catch(() => false)) {
      const cookies = JSON.parse(await fs.readFile(cookiesPath, 'utf8'));
      console.log(`✅ 쿠키 로드 완료: ${cookies.length}개`);
      return cookies;
    }
  } catch (error) {
    console.log('❌ 쿠키 로드 실패:', error);
  }
  return [];
}

// 쿠키를 문자열로 변환
export function convertCookiesToString(cookies: any[]): string {
  return cookies.map(cookie => `${cookie.name}=${cookie.value}`).join('; ');
}

// Puppeteer로 로그인 (쿠키 없거나 만료 시)
export async function loginWithPuppeteer(config: AutomationConfig): Promise<any[] | null> {
  let browser;
  try {
    console.log('🔐 Puppeteer로 로그인 중...');
    
    browser = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox', 
        '--disable-setuid-sandbox',
        '--disable-blink-features=AutomationControlled',
        '--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      ]
    });
    
    const page = await browser.newPage();
    
    await page.goto('https://www.s2b.kr/S2BNCustomer/Login.do?type=sp', {
      waitUntil: 'networkidle0',
      timeout: 30000
    });
    
    await page.waitForSelector('form[name="vendor_loginForm"] .login_type2');
    await page.type('form[name="vendor_loginForm"] .login_type2 input[name="uid"]', config.loginId);
    await page.type('form[name="vendor_loginForm"] .login_type2 input[name="pwd"]', config.loginPassword);
    
    // 로그인 버튼 클릭 (검색결과.js와 동일한 방식)
    await page.click('form[name="vendor_loginForm"] .login_type2 .btn_login a');
    
    // 로그인 후 페이지 이동 대기
    await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 60000 });
    
    // 로그인 성공 확인
    const currentUrl = page.url();
    if (currentUrl.includes('Login.do')) {
      throw new Error('로그인 실패: 아이디 또는 비밀번호를 확인해주세요.');
    }
    
    const newCookies = await page.cookies();
    const cookiesPath = getCookiesPath(config.userId);
    
    await fs.mkdir(path.dirname(cookiesPath), { recursive: true });
    await fs.writeFile(cookiesPath, JSON.stringify(newCookies, null, 2));
    
    console.log('✅ 로그인 완료 및 쿠키 저장');
    return newCookies;
  } catch (error) {
    console.error('❌ 로그인 실패:', error);
    return null;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// axios로 검색 결과 가져오기
export async function searchWithAxios(
  axiosInstance: AxiosInstance,
  cookies: any[],
  viewCount: string = '100',
  startIndex: string = '0'
): Promise<{ success: boolean; count?: number; html?: string; needReLogin?: boolean }> {
  try {
    const dateRange = getDateRange();
    const cookieString = convertCookiesToString(cookies);
    
    const response = await axiosInstance.get(
      '/S2BNVendor/S2B/srcweb/remu/rema/rema100_list_new.jsp',
      {
        params: {
          'searchOk': 'Y',
          'tgruStatus': '',
          'search_date': 'LIMIT_DATE',
          'search_date_start': dateRange.startDate,
          'search_date_end': dateRange.endDate,
          'viewCount': viewCount,
          'startIndex': startIndex
        },
        headers: {
          'Cookie': cookieString,
          'Referer': 'https://www.s2b.kr/S2BNVendor/vendorMain.do'
        }
      }
    );
    
    // 로그인 확인
    if (response.data.includes('Login.do')) {
      return { success: false, needReLogin: true };
    }
    
    // 검색 결과 개수 추출
    const match = response.data.match(/var\s+totalResultCount\s*=\s*'(\d+)'/);
    if (match) {
      return {
        success: true,
        count: parseInt(match[1]),
        html: response.data
      };
    }
    
    return { success: false, needReLogin: false };
  } catch (error) {
    console.error('검색 요청 실패:', error);
    return { success: false, needReLogin: true };
  }
}

// 물품번호 추출
export function extractGoodsNumbers(html: string): string[] {
  const goodsNumbers: string[] = [];
  const pattern = /javascript:fnGoodsInfo\('(\d+)','N'\)/g;
  let match;
  
  while ((match = pattern.exec(html)) !== null) {
    const goodsNumber = match[1];
    if (!goodsNumbers.includes(goodsNumber)) {
      goodsNumbers.push(goodsNumber);
    }
  }
  
  return goodsNumbers;
}

// 전체 물품번호 수집
export async function collectAllGoodsNumbers(
  config: AutomationConfig,
  onProgress: (update: ProgressUpdate) => void
): Promise<string[]> {
  console.log('📋 물품번호 수집 시작...');
  
  const axiosInstance = createAxiosInstance();
  let cookies = await loadCookies(config.userId);
  
  // 쿠키가 없으면 로그인
  if (cookies.length === 0) {
    onProgress({ type: 'status', message: '로그인 중...' });
    cookies = await loginWithPuppeteer(config);
    if (!cookies) {
      throw new Error('로그인 실패');
    }
  }
  
  const allGoodsNumbers: string[] = [];
  let startIndex = 0;
  const pageSize = 100;
  
  // 첫 페이지로 전체 개수 확인 - 로그 없음
  let firstResult = await searchWithAxios(axiosInstance, cookies, '100', '0');
  
  if (!firstResult.success) {
    if (firstResult.needReLogin) {
      onProgress({ type: 'status', message: '세션 만료 - 재로그인 중...' });
      cookies = await loginWithPuppeteer(config);
      if (!cookies) {
        throw new Error('재로그인 실패');
      }
      firstResult = await searchWithAxios(axiosInstance, cookies, '100', '0');
      if (!firstResult.success) {
        throw new Error('검색 실패');
      }
    } else {
      throw new Error('검색 실패');
    }
  }
  
  const totalCount = firstResult.count || 0;
  const priceIncreaseRate = config.priceIncreaseRate || 0;
  onProgress({ type: 'total', message: `연장 품목 ${totalCount}개 발견 가격인상률(${priceIncreaseRate}%)로 작업을 시작합니다.` });
  
  // 첫 페이지 물품번호 추출
  if (firstResult.html) {
    allGoodsNumbers.push(...extractGoodsNumbers(firstResult.html));
  }
  
  // 나머지 페이지 순회
  const totalPages = Math.ceil(totalCount / pageSize);
  for (let page = 1; page < totalPages; page++) {
    startIndex = page * pageSize;
    onProgress({ 
      type: 'collecting', 
      message: `물품번호 수집 중: ${page + 1}/${totalPages} 페이지`,
      current: page + 1,
      total: totalPages
    });
    
    const result = await searchWithAxios(axiosInstance, cookies, '100', startIndex.toString());
    if (result.success && result.html) {
      allGoodsNumbers.push(...extractGoodsNumbers(result.html));
    }
    
    // 요청 간 대기
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  const uniqueNumbers = [...new Set(allGoodsNumbers)];
  console.log(`✅ 총 ${uniqueNumbers.length}개 물품번호 수집 완료`);
  return uniqueNumbers;
}

// 가격 인상 (axios 버전)
export async function updatePriceWithAxios(
  axiosInstance: AxiosInstance,
  cookies: any[],
  goodsCode: string,
  increaseRate: number = 5
): Promise<{ success: boolean; oldPrice?: number; newPrice?: number; message?: string }> {
  try {
    const dateRange = getDateRange();
    const cookieString = convertCookiesToString(cookies);
    
    // 상세 페이지에서 현재 가격 가져오기
    const detailResponse = await axiosInstance.get('/S2BNVendor/rema100.do', {
      params: {
        'forwardName': 'detail',
        'f_re_estimate_code': goodsCode,
        's_category_code1': '',
        's_category_code2': '',
        's_category_code3': '',
        'tgruStatus': '',
        'search_query': '',
        'toggleGbn': '2',
        'viewCount': '100',
        'startIndex': '0',
        'reviewYn': '',
        'qnaYn': '',
        'search_date': 'LIMIT_DATE',
        'search_date_start': dateRange.startDate,
        'search_date_end': dateRange.endDate,
        'orderByClm': '',
        'orderByClmPro': '',
        'orderByGubun': ''
      },
      headers: {
        'Cookie': cookieString,
        'Referer': 'https://www.s2b.kr/S2BNVendor/S2B/srcweb/remu/rema/rema100_list_new.jsp'
      }
    });
    
    // 현재 가격 추출
    const currentPriceMatch = detailResponse.data.match(/name="f_estimate_amt"[^>]*value="([^"]+)"/);
    if (!currentPriceMatch) {
      return { success: false, message: '현재 가격을 찾을 수 없음' };
    }
    
    const currentPrice = parseInt(currentPriceMatch[1].replace(/,/g, ''));
    const newPrice = Math.round(currentPrice * (1 + increaseRate / 100) / 100) * 100;
    
    console.log(`💰 ${goodsCode}: ${currentPrice.toLocaleString()}원 → ${newPrice.toLocaleString()}원`);
    
    // 가격 업데이트 폼 데이터 추출
    const formDataMatches = {
      f_goods_name: detailResponse.data.match(/name="f_goods_name"[^>]*value="([^"]+)"/)?.[1] || '',
      f_goods_spec: detailResponse.data.match(/name="f_goods_spec"[^>]*value="([^"]+)"/)?.[1] || '',
      f_goods_unit: detailResponse.data.match(/name="f_goods_unit"[^>]*value="([^"]+)"/)?.[1] || '',
      f_vendor_item_code: detailResponse.data.match(/name="f_vendor_item_code"[^>]*value="([^"]+)"/)?.[1] || '',
      f_goods_code: detailResponse.data.match(/name="f_goods_code"[^>]*value="([^"]+)"/)?.[1] || goodsCode
    };
    
    // 가격 업데이트 요청
    const updateResponse = await axiosInstance.post('/S2BNVendor/rema100.do',
      new URLSearchParams({
        'forwardName': 'update',
        'f_re_estimate_code': goodsCode,
        'f_goods_name': formDataMatches.f_goods_name,
        'f_goods_spec': formDataMatches.f_goods_spec,
        'f_goods_unit': formDataMatches.f_goods_unit,
        'f_vendor_item_code': formDataMatches.f_vendor_item_code,
        'f_goods_code': formDataMatches.f_goods_code,
        'f_estimate_amt': newPrice.toString(),
        's_category_code1': '',
        's_category_code2': '',
        's_category_code3': '',
        'tgruStatus': '',
        'search_query': '',
        'toggleGbn': '2',
        'viewCount': '100',
        'startIndex': '0',
        'reviewYn': '',
        'qnaYn': '',
        'search_date': 'LIMIT_DATE',
        'search_date_start': dateRange.startDate,
        'search_date_end': dateRange.endDate,
        'orderByClm': '',
        'orderByClmPro': '',
        'orderByGubun': ''
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Cookie': cookieString,
          'Referer': `https://www.s2b.kr/S2BNVendor/rema100.do?forwardName=detail&f_re_estimate_code=${goodsCode}`
        }
      }
    );
    
    // 업데이트 성공 여부 확인
    if (updateResponse.data.includes('성공') || updateResponse.status === 200) {
      return { success: true, oldPrice: currentPrice, newPrice: newPrice };
    }
    
    return { success: false, message: '가격 업데이트 실패' };
    
  } catch (error) {
    console.error(`가격 업데이트 실패 (${goodsCode}):`, error);
    return { success: false, message: error instanceof Error ? error.message : '알 수 없는 오류' };
  }
}

// 관리일 연장 (axios 버전)
export async function extendLimitDateWithAxios(
  axiosInstance: AxiosInstance,
  cookies: any[],
  goodsCode: string
): Promise<{ success: boolean; message?: string }> {
  try {
    const dateRange = getDateRange();
    const cookieString = convertCookiesToString(cookies);
    
    const response = await axiosInstance.post('/S2BNVendor/rema100.do',
      new URLSearchParams({
        'forwardName': 'limitDateUpdate',
        'f_re_estimate_code': goodsCode,
        's_category_code1': '',
        's_category_code2': '',
        's_category_code3': '',
        'tgruStatus': '',
        'search_query': '',
        'toggleGbn': '2',
        'viewCount': '100',
        'startIndex': '0',
        'reviewYn': '',
        'qnaYn': '',
        'search_date': 'LIMIT_DATE',
        'search_date_start': dateRange.startDate,
        'search_date_end': dateRange.endDate,
        'orderByClm': '',
        'orderByClmPro': '',
        'orderByGubun': ''
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Cookie': cookieString,
          'Referer': `https://www.s2b.kr/S2BNVendor/rema100.do?forwardName=detail&f_re_estimate_code=${goodsCode}`
        }
      }
    );
    
    if (response.status === 200) {
      console.log(`📅 ${goodsCode}: 관리일 연장 완료`);
      return { success: true };
    }
    
    return { success: false, message: '관리일 연장 실패' };
    
  } catch (error) {
    console.error(`관리일 연장 실패 (${goodsCode}):`, error);
    return { success: false, message: error instanceof Error ? error.message : '알 수 없는 오류' };
  }
}
// ProcessedItemsManager는 s2b-automation.ts에서 import해서 사용

// 메인 처리 함수 (axios 버전)
export async function processAllGoodsWithAxios(
  config: AutomationConfig,
  onProgress: (update: ProgressUpdate) => void
): Promise<{ success: boolean; processedCount: number; errors: string[] }> {
  console.log('🚀 axios 방식 자동화 시작');
  
  const axiosInstance = createAxiosInstance();
  const processedManager = new ProcessedItemsManager(config.userId);
  const usageTracker = new UsageTracker(config.userId);
  const errors: string[] = [];
  
  try {
    // 처리된 항목 로드
    const processedData = await processedManager.loadProcessedItems();
    
    // 전체 물품번호 수집
    const allGoodsNumbers = await collectAllGoodsNumbers(config, onProgress);
    
    // 미처리 항목 필터링
    const itemsToProcess = allGoodsNumbers.filter(item => !processedData.items.has(item));
    // 처리할 항목 수 확인 - 로그 없음 (연장 품목 발견 메시지에 포함됨)
    
    if (itemsToProcess.length === 0) {
      return { success: true, processedCount: 0, errors: [] };
    }
    
    // 쿠키 로드
    const cookies = await loadCookies(config.userId);
    let successCount = 0;
    
    // 각 물품 처리
    for (let i = 0; i < itemsToProcess.length; i++) {
      // 취소 확인
      if (config.sessionId && automationManager.isSessionCancelled(config.sessionId)) {
        onProgress({
          type: 'status',
          message: '사용자에 의해 중지되었습니다.'
        });
        return {
          success: false,
          processedCount: successCount,
          errors: ['사용자에 의해 중지됨']
        };
      }
      
      const goodsCode = itemsToProcess[i];
      onProgress({
        type: 'processing',
        message: `처리 중: ${goodsCode}`,
        current: i + 1,
        total: itemsToProcess.length,
        itemNo: goodsCode
      });
      
      try {
        // 플랜 한도 확인
        if (!usageTracker.canProcessMore(config.userPlan || 'free')) {
          onProgress({
            type: 'error',
            message: '플랜 한도를 초과했습니다.'
          });
          break;
        }
        
        // 가격 인상
        const priceResult = await updatePriceWithAxios(axiosInstance, cookies, goodsCode, config.priceIncreaseRate);
        if (!priceResult.success) {
          throw new Error(priceResult.message || '가격 인상 실패');
        }
        
        onProgress({
          type: 'price',
          message: `가격 인상 완료: ${priceResult.oldPrice?.toLocaleString()}원 → ${priceResult.newPrice?.toLocaleString()}원`,
          itemNo: goodsCode
        });
        
        // 관리일 연장
        const extendResult = await extendLimitDateWithAxios(axiosInstance, cookies, goodsCode);
        if (!extendResult.success) {
          throw new Error(extendResult.message || '관리일 연장 실패');
        }
        
        // 처리 완료
        await processedManager.saveProcessedItem(goodsCode, processedData);
        successCount++;
        
        // 사용량 추가
        if (priceResult.oldPrice && priceResult.newPrice) {
          usageTracker.addProcessedItem(goodsCode, priceResult.oldPrice, priceResult.newPrice);
        }
        
        onProgress({
          type: 'status',
          message: `✅ ${goodsCode} 처리 완료 (${successCount}/${itemsToProcess.length})`,
          current: successCount,
          total: itemsToProcess.length
        });
        
      } catch (error) {
        const errorMsg = `❌ ${goodsCode} 처리 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`;
        console.error(errorMsg);
        errors.push(errorMsg);
        onProgress({
          type: 'error',
          message: errorMsg,
          itemNo: goodsCode
        });
      }
      
      // 요청 간 대기 (서버 부하 방지)
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    console.log(`\n✅ 처리 완료: ${successCount}/${itemsToProcess.length} 성공`);
    return { success: true, processedCount: successCount, errors };
    
  } catch (error) {
    const errorMsg = `치명적 오류: ${error instanceof Error ? error.message : '알 수 없는 오류'}`;
    console.error(errorMsg);
    errors.push(errorMsg);
    return { success: false, processedCount: 0, errors };
  }
}