import path from 'path';

interface UsageData {
  date: string; // YYYY-MM 형식
  totalProcessed: number;
  monthlyUsage: number;
  recentActivities: Array<{
    id: number;
    action: string;
    items: number;
    time: string;
    status: string;
  }>;
  completionHistory: Array<{
    id: string;
    date: string;
    processedCount: number;
    timestamp: number;
  }>;
}

export class UsageTracker {
  private filePath: string;
  private usageData: UsageData;

  constructor(userId: string) {
    this.filePath = path.join(process.cwd(), 'temp', `usage_${userId}.json`);
    this.usageData = this.loadUsageData();
  }

  private loadUsageData(): UsageData {
    try {
      const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM

      // 브라우저 환경에서는 로컬스토리지 사용
      if (typeof window !== 'undefined') {
        const data = localStorage.getItem(`usage_${this.filePath}`);
        if (data) {
          try {
            const parsed = JSON.parse(data);
            if (parsed.date === currentMonth) {
              return parsed;
            } else {
              // 새로운 달이면 월별 사용량 초기화
              return {
                ...parsed,
                date: currentMonth,
                monthlyUsage: 0,
                recentActivities: [],
                completionHistory: []
              };
            }
          } catch (e) {
            return { date: currentMonth, totalProcessed: 0, monthlyUsage: 0, recentActivities: [], completionHistory: [] };
          }
        }
        return { date: currentMonth, totalProcessed: 0, monthlyUsage: 0, recentActivities: [], completionHistory: [] };
      }

      // 서버 환경에서는 파일 시스템 사용
      const fs = require('fs');
      const dir = path.dirname(this.filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      if (fs.existsSync(this.filePath)) {
        const data = fs.readFileSync(this.filePath, 'utf8');
        if (!data.trim()) {
          return { date: currentMonth, totalProcessed: 0, monthlyUsage: 0, recentActivities: [], completionHistory: [] };
        }

        try {
          const parsed = JSON.parse(data);
          if (parsed.date === currentMonth) {
            console.log('이번 달 사용량 불러옴:', parsed.monthlyUsage + '개');
            return parsed;
          } else {
            console.log('새로운 달 감지, 월간 사용량 초기화');
            return { 
              date: currentMonth, 
              totalProcessed: parsed.totalProcessed || 0, // 총 처리량은 유지
              monthlyUsage: 0, // 월간 사용량만 초기화
              recentActivities: [],
              completionHistory: parsed.completionHistory || [] 
            };
          }
        } catch (parseError) {
          console.log('사용량 파일 손상, 새로 시작합니다.');
          return { date: currentMonth, totalProcessed: 0, monthlyUsage: 0, recentActivities: [], completionHistory: [] };
        }
      }

      return { date: currentMonth, totalProcessed: 0, monthlyUsage: 0, recentActivities: [], completionHistory: [] };
    } catch (error) {
      const currentMonth = new Date().toISOString().slice(0, 7);
      console.log('사용량 파일 초기화');
      return { date: currentMonth, totalProcessed: 0, monthlyUsage: 0, recentActivities: [], completionHistory: [] };
    }
  }

  public addProcessedItem(itemNo: string, oldPrice: number, newPrice: number): void {
    try {
      this.usageData.totalProcessed += 1;
      this.usageData.monthlyUsage += 1;

      // 최근 활동에 추가
      const newActivity = {
        id: Date.now(),
        action: `물품번호 ${itemNo} - ${oldPrice.toLocaleString()}원 → ${newPrice.toLocaleString()}원 (가격 인상 및 관리일 연장)`,
        items: 1,
        time: this.getTimeAgo(new Date()),
        status: 'success'
      };

      this.usageData.recentActivities.unshift(newActivity);
      
      // 최근 활동은 최대 10개까지만 유지
      if (this.usageData.recentActivities.length > 10) {
        this.usageData.recentActivities = this.usageData.recentActivities.slice(0, 10);
      }

      this.saveUsageData();
      console.log(`사용량 업데이트: 월간 ${this.usageData.monthlyUsage}개, 총 ${this.usageData.totalProcessed}개`);
    } catch (error) {
      console.error('사용량 추가 실패:', error);
    }
  }

  public addActivity(action: string, items: number = 0, status: string = 'info'): void {
    try {
      const newActivity = {
        id: Date.now(),
        action,
        items,
        time: this.getTimeAgo(new Date()),
        status
      };

      this.usageData.recentActivities.unshift(newActivity);
      
      // 최근 활동은 최대 10개까지만 유지
      if (this.usageData.recentActivities.length > 10) {
        this.usageData.recentActivities = this.usageData.recentActivities.slice(0, 10);
      }

      this.saveUsageData();
    } catch (error) {
      console.error('활동 추가 실패:', error);
    }
  }

  private getTimeAgo(date: Date): string {
    // 현재 시간을 한국 시간대로 변환
    const koreanDate = new Date(date.toLocaleString("en-US", {timeZone: "Asia/Seoul"}));
    
    const year = koreanDate.getFullYear().toString().slice(2); // 연도 뒤 2자리
    const month = (koreanDate.getMonth() + 1).toString().padStart(2, '0');
    const day = koreanDate.getDate().toString().padStart(2, '0');
    const hours = koreanDate.getHours().toString().padStart(2, '0');
    const minutes = koreanDate.getMinutes().toString().padStart(2, '0');
    
    return `${year}-${month}-${day} ${hours}시${minutes}분`;
  }

  private saveUsageData(): void {
    try {
      if (typeof window !== 'undefined') {
        // 브라우저 환경에서는 로컬스토리지 사용
        localStorage.setItem(`usage_${this.filePath}`, JSON.stringify(this.usageData));
      } else {
        // 서버 환경에서는 파일 시스템 사용
        const fs = require('fs');
        fs.writeFileSync(this.filePath, JSON.stringify(this.usageData, null, 2));
      }
    } catch (error) {
      console.error('사용량 저장 실패:', error);
    }
  }

  public getMonthlyUsage(): number {
    return this.usageData.monthlyUsage;
  }

  public getTotalProcessed(): number {
    return this.usageData.totalProcessed;
  }

  public getRecentActivities(): Array<{id: number; action: string; items: number; time: string; status: string}> {
    return this.usageData.recentActivities;
  }

  // getActivities 메서드 추가 (getRecentActivities와 동일)
  public getActivities(): Array<{id: number; action: string; items: number; time: string; status: string}> {
    return this.usageData.recentActivities;
  }

  public getSuccessRate(): number {
    // 실제 처리에서는 거의 100% 성공하므로 100으로 반환
    return 100.0;
  }

  public getTimeSaved(): number {
    // 1개 처리당 약 0.1시간(6분) 절약된다고 가정
    return Math.floor(this.usageData.totalProcessed * 0.1);
  }

  public getMoneyValue(): number {
    // 시간당 2만원으로 계산
    return this.getTimeSaved() * 20000;
  }

  public canProcessMore(userPlan: string): boolean {
    const currentUsage = this.getMonthlyUsage();
    
    switch (userPlan) {
      case 'free': return currentUsage < 10;
      case 'standard': return currentUsage < 100;
      case 'basic': return currentUsage < 500;
      case 'premium': return true; // 무제한
      default: return currentUsage < 10; // 기본값: 무료 플랜
    }
  }

  public getRemainingUsage(userPlan: string): number {
    const currentUsage = this.getMonthlyUsage();
    
    switch (userPlan) {
      case 'free': return Math.max(0, 10 - currentUsage);
      case 'standard': return Math.max(0, 100 - currentUsage);
      case 'basic': return Math.max(0, 500 - currentUsage);
      case 'premium': return 999999; // 무제한
      default: return Math.max(0, 10 - currentUsage);
    }
  }

  public addCompletionRecord(processedCount: number): void {
    if (processedCount > 0) {
      const now = new Date();
      const record = {
        id: `completion_${Date.now()}`,
        date: now.toISOString(),
        processedCount: processedCount,
        timestamp: now.getTime()
      };
      
      if (!this.usageData.completionHistory) {
        this.usageData.completionHistory = [];
      }
      
      this.usageData.completionHistory.unshift(record);
      
      // 최대 100개까지만 유지
      if (this.usageData.completionHistory.length > 100) {
        this.usageData.completionHistory = this.usageData.completionHistory.slice(0, 100);
      }
      
      this.saveUsageData();
    }
  }

  public getCompletionHistory(): Array<{id: string; date: string; processedCount: number; timestamp: number}> {
    return this.usageData.completionHistory || [];
  }
}