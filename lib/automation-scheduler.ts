import { promises as fs } from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import { runAutomationSmart } from './s2b-runner';
import { AutomationConfig } from './s2b-automation';

interface ScheduleEntry {
  userId: string;
  accountId: string;
  accountName?: string;
  lastRunTime: string;
  nextRunTime: string;
  isActive: boolean;
}

interface UserSchedule {
  userId: string;
  userPlan: string;
  schedules: ScheduleEntry[];
  isSchedulingEnabled: boolean;
  lastUpdated: string;
}

export class AutomationScheduler {
  private schedulesPath: string;
  private schedules: Map<string, UserSchedule> = new Map();

  constructor() {
    this.schedulesPath = path.join(process.cwd(), 'temp', 'automation-schedules.json');
    this.loadSchedules();
  }

  // 스케줄 데이터 로드
  private async loadSchedules(): Promise<void> {
    try {
      const dir = path.dirname(this.schedulesPath);
      if (!require('fs').existsSync(dir)) {
        require('fs').mkdirSync(dir, { recursive: true });
      }

      if (require('fs').existsSync(this.schedulesPath)) {
        const data = require('fs').readFileSync(this.schedulesPath, 'utf8');
        if (data.trim()) {
          const schedulesData = JSON.parse(data);
          this.schedules = new Map(Object.entries(schedulesData));
        }
      }
    } catch (error) {
      console.error('스케줄 로드 오류:', error);
    }
  }

  // 스케줄 데이터 저장
  private async saveSchedules(): Promise<void> {
    try {
      const schedulesObj = Object.fromEntries(this.schedules);
      require('fs').writeFileSync(this.schedulesPath, JSON.stringify(schedulesObj, null, 2));
    } catch (error) {
      console.error('스케줄 저장 오류:', error);
    }
  }

  // 플랜별 최대 계정 수 반환
  private getMaxAccountsByPlan(plan: string): number {
    switch (plan) {
      case 'basic': return 3;
      case 'premium': return 5;
      default: return 0; // free, standard는 자동 스케줄링 없음
    }
  }

  // 사용자 스케줄링 설정 활성화/비활성화
  async setSchedulingEnabled(userId: string, userPlan: string, enabled: boolean, selectedAccountIds?: string[]): Promise<boolean> {
    try {
      console.log('스케줄러 - 사용자 플랜:', userPlan);
      console.log('스케줄러 - 활성화 요청:', enabled);
      
      const maxAccounts = this.getMaxAccountsByPlan(userPlan);
      console.log('스케줄러 - 최대 계정 수:', maxAccounts);
      
      if (maxAccounts === 0 && enabled) {
        console.log('스케줄러 - 오류: 플랜에서 자동 스케줄링 불가');
        throw new Error('현재 플랜에서는 자동 스케줄링을 사용할 수 없습니다.');
      }

      let userSchedule = this.schedules.get(userId);
      if (!userSchedule) {
        userSchedule = {
          userId,
          userPlan,
          schedules: [],
          isSchedulingEnabled: false,
          lastUpdated: new Date().toISOString()
        };
      }

      userSchedule.isSchedulingEnabled = enabled;
      userSchedule.userPlan = userPlan;
      userSchedule.lastUpdated = new Date().toISOString();

      // 활성화하는 경우 사용자 계정들을 자동으로 스케줄에 추가
      if (enabled) {
        await this.updateUserScheduleAccounts(userId, userPlan, selectedAccountIds);
      }

      this.schedules.set(userId, userSchedule);
      await this.saveSchedules();
      
      return true;
    } catch (error) {
      console.error('스케줄링 설정 오류:', error);
      return false;
    }
  }

  // 사용자 계정들을 스케줄에 업데이트
  private async updateUserScheduleAccounts(userId: string, userPlan: string, selectedAccountIds?: string[]): Promise<void> {
    try {
      console.log('스케줄러 - 계정 업데이트 시작:', { userId, userPlan });
      
      // 실제 계정 데이터 가져오기
      let accounts = [];
      
      try {
        console.log('스케줄러 - DB 조회 시작, userId:', userId);
        console.log('스케줄러 - Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
        console.log('스케줄러 - Supabase Key 존재:', !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
        console.log('스케줄러 - Service Key 존재:', !!process.env.SUPABASE_SERVICE_ROLE_KEY);
        
        // 서버 환경에서 Supabase 클라이언트 생성 (서비스 키 사용)
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          supabaseKey,
          {
            auth: {
              autoRefreshToken: false,
              persistSession: false
            }
          }
        );
        
        // 쿼리 로그 추가
        console.log('스케줄러 - 쿼리 실행 중...');
        console.log('스케줄러 - 선택된 계정 IDs:', selectedAccountIds);
        
        // 먼저 모든 활성 계정 조회
        const { data: dbAccounts, error } = await supabase
          .from('s2b_accounts')
          .select('*')
          .eq('user_id', userId)
          .eq('is_active', true)
          .order('is_default', { ascending: false })
          .order('created_at', { ascending: false });
        
        console.log('스케줄러 - DB 조회 결과:', { data: dbAccounts, error });
        
        if (error) {
          console.error('스케줄러 - Supabase 에러 상세:', error.message, error.details, error.hint);
        }
        
        accounts = dbAccounts || [];
        console.log('스케줄러 - 실제 계정들:', accounts.length, '개');
        console.log('스케줄러 - 계정 세부정보:', accounts);
        
        if (error) {
          console.log('스케줄러 - DB 조회 에러:', error);
        }
      } catch (dbError) {
        console.log('스케줄러 - DB 조회 실패 (catch):', dbError);
        // 실패해도 빈 배열로 계속 진행
        accounts = [];
      }
      
      if (!accounts || accounts.length === 0) {
        console.log('스케줄러 - 계정이 없음');
        // 스케줄은 유지하되 비활성화
        const userSchedule = this.schedules.get(userId);
        if (userSchedule) {
          userSchedule.schedules = [];
          this.schedules.set(userId, userSchedule);
          await this.saveSchedules();
        }
        return;
      }

      const maxAccounts = this.getMaxAccountsByPlan(userPlan);
      
      // 선택된 계정들만 필터링 (selectedAccountIds가 제공된 경우)
      let filteredAccounts = accounts;
      if (selectedAccountIds && selectedAccountIds.length > 0) {
        filteredAccounts = accounts.filter(account => selectedAccountIds.includes(account.id));
        console.log('스케줄러 - 선택된 계정들로 필터링:', filteredAccounts.length, '개');
      }
      
      const activeAccounts = filteredAccounts
        .slice(0, maxAccounts); // 플랜별 최대 계정 수만큼만 (이미 활성 계정만 조회했으므로 is_active 필터 불필요)
      
      console.log('스케줄러 - 활성 계정들:', activeAccounts.length, '개');
      
      if (activeAccounts.length === 0) {
        console.log('스케줄러 - 활성 계정이 없음');
        // 스케줄은 유지하되 비활성화
        const userSchedule = this.schedules.get(userId);
        if (userSchedule) {
          userSchedule.schedules = [];
          this.schedules.set(userId, userSchedule);
          await this.saveSchedules();
        }
        return;
      }

      const userSchedule = this.schedules.get(userId);
      if (!userSchedule) return;

      const now = new Date();
      const existingSchedules = new Map(
        userSchedule.schedules.map(s => [s.accountId, s])
      );

      // 새로운 스케줄 엔트리 생성
      const newSchedules: ScheduleEntry[] = activeAccounts.map((account, index) => {
        const existing = existingSchedules.get(account.id);
        
        // 기존 스케줄이 있으면 유지, 없으면 새로 생성
        if (existing) {
          return existing;
        }

        // 계정들을 시간차를 두고 실행하도록 설정 (30분 간격)
        // 현재 시간 기준으로 미래 시간 설정
        const nextRun = new Date(Date.now() + (index * 30 * 60 * 1000));
        
        return {
          userId,
          accountId: account.id,
          accountName: account.account_name,
          lastRunTime: '',
          nextRunTime: nextRun.toISOString(),
          isActive: true
        };
      });

      userSchedule.schedules = newSchedules;
      this.schedules.set(userId, userSchedule);
      await this.saveSchedules();
      
      console.log('스케줄러 - 업데이트 완료:', newSchedules.length, '개 스케줄 추가됨');
    } catch (error) {
      console.error('계정 스케줄 업데이트 오류:', error);
    }
  }

  // 실행 대기 중인 스케줄 확인 및 실행
  async checkAndRunSchedules(): Promise<void> {
    const now = new Date();
    
    for (const [userId, userSchedule] of this.schedules) {
      if (!userSchedule.isSchedulingEnabled) continue;

      for (const schedule of userSchedule.schedules) {
        if (!schedule.isActive) continue;

        const nextRunTime = new Date(schedule.nextRunTime);
        if (now >= nextRunTime) {
          await this.executeScheduledAutomation(schedule, userSchedule.userPlan);
        }
      }
    }
  }

  // 스케줄된 자동화 실행
  private async executeScheduledAutomation(schedule: ScheduleEntry, userPlan: string): Promise<void> {
    try {
      console.log(`자동 스케줄 실행: 사용자 ${schedule.userId}, 계정 ${schedule.accountId}`);

      // 계정 정보 가져오기 (서비스 키 사용)
      const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        supabaseKey,
        {
          auth: {
            autoRefreshToken: false,
            persistSession: false
          }
        }
      );
      
      const { data: accounts } = await supabase
        .from('s2b_accounts')
        .select('*')
        .eq('user_id', schedule.userId)
        .eq('is_active', true);
        
      const account = accounts?.find(acc => acc.id === schedule.accountId);
      
      if (!account) {
        console.error('계정을 찾을 수 없습니다:', schedule.accountId);
        // 존재하지 않는 계정의 스케줄은 비활성화
        schedule.isActive = false;
        const userSchedule = this.schedules.get(schedule.userId);
        if (userSchedule) {
          this.schedules.set(schedule.userId, userSchedule);
          await this.saveSchedules();
        }
        return;
      }

      // 자동화 설정 생성
      const config: AutomationConfig = {
        userId: schedule.userId,
        loginId: account.s2b_login_id,
        loginPassword: account.s2b_password,
        priceIncreaseRate: account.price_increase_rate,
        userPlan
      };

      // 세션 ID 생성
      const sessionId = `scheduled_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // 자동화 실행 (비동기) - runAutomationSmart 사용
      runAutomationSmart(sessionId, config).catch(error => {
        console.error('스케줄된 자동화 실행 오류:', error);
      });

      // 다음 실행 시간 설정 (72시간 후)
      const nextRunTime = new Date(Date.now() + (72 * 60 * 60 * 1000));
      schedule.lastRunTime = new Date().toISOString();
      schedule.nextRunTime = nextRunTime.toISOString();

      // 스케줄 업데이트
      const userSchedule = this.schedules.get(schedule.userId);
      if (userSchedule) {
        this.schedules.set(schedule.userId, userSchedule);
        await this.saveSchedules();
      }

    } catch (error) {
      console.error('스케줄된 자동화 실행 실패:', error);
    }
  }

  // 사용자 스케줄 상태 조회
  getUserScheduleStatus(userId: string): UserSchedule | null {
    return this.schedules.get(userId) || null;
  }

  // 사용자 스케줄 상태 조회 (getSchedulesForUser 메서드 추가)
  async getSchedulesForUser(userId: string): Promise<UserSchedule> {
    const userSchedule = this.schedules.get(userId) || {
      userId,
      userPlan: 'free',
      isSchedulingEnabled: false,
      schedules: [],
      lastUpdated: new Date().toISOString()
    };
    return userSchedule;
  }

  // 모든 활성 스케줄 조회 (관리자용)
  getAllActiveSchedules(): UserSchedule[] {
    return Array.from(this.schedules.values())
      .filter(schedule => schedule.isSchedulingEnabled);
  }

  // 특정 계정의 다음 실행 시간 조회
  getNextRunTime(userId: string, accountId: string): string | null {
    const userSchedule = this.schedules.get(userId);
    if (!userSchedule) return null;

    const schedule = userSchedule.schedules.find(s => s.accountId === accountId);
    return schedule?.nextRunTime || null;
  }

  // 수동으로 특정 계정 스케줄 실행
  async runScheduleManually(userId: string, accountId: string, userPlan: string): Promise<boolean> {
    try {
      const userSchedule = this.schedules.get(userId);
      if (!userSchedule) return false;

      const schedule = userSchedule.schedules.find(s => s.accountId === accountId);
      if (!schedule) return false;

      await this.executeScheduledAutomation(schedule, userPlan);
      return true;
    } catch (error) {
      console.error('수동 스케줄 실행 오류:', error);
      return false;
    }
  }
}

// 싱글톤 인스턴스
export const automationScheduler = new AutomationScheduler();

// 1분마다 스케줄 확인 (실제 환경에서는 cron job 사용 권장)
if (typeof window === 'undefined') { // 서버 사이드에서만 실행
  setInterval(() => {
    automationScheduler.checkAndRunSchedules().catch(error => {
      console.error('스케줄 확인 오류:', error);
    });
  }, 60 * 1000); // 1분마다 확인
}