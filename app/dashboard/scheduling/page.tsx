'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { s2bAccounts, S2BAccount } from '@/lib/supabase';
import { 
  ClockIcon, 
  CalendarIcon,
  CheckCircleIcon,
  XCircleIcon,
  LockClosedIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';
import Link from 'next/link';

interface Schedule {
  userId: string;
  accountId: string;
  accountName: string;
  isActive: boolean;
  lastRunTime: string | null;
  nextRunTime: string;
}

interface SchedulingStatus {
  isEnabled: boolean;
  maxAccounts: number;
  activeSchedules: Schedule[];
}

export default function SchedulingPage() {
  const { user, profile, session } = useAuth();
  const [accounts, setAccounts] = useState<S2BAccount[]>([]);
  const [schedulingStatus, setSchedulingStatus] = useState<SchedulingStatus>({
    isEnabled: false,
    maxAccounts: 0,
    activeSchedules: []
  });
  const [loading, setLoading] = useState(false);
  const [selectedAccounts, setSelectedAccounts] = useState<Set<string>>(new Set());
  const [monthlyStats, setMonthlyStats] = useState({
    total: 0,
    limit: 0,
    percentage: 0
  });

  const isPlanAllowed = profile?.plan === 'basic' || profile?.plan === 'premium';

  // 플랜별 한도 설정
  const getUsageLimitByPlan = (plan: string) => {
    const limits: Record<string, number> = {
      free: 10,
      standard: 100,
      basic: 500,
      premium: Infinity
    };
    return limits[plan] || 0;
  };

  useEffect(() => {
    if (user?.id && isPlanAllowed) {
      loadData();
      loadStats();
    }
  }, [user?.id, profile?.plan]);

  // profile이 변경될 때 통계 다시 로드
  useEffect(() => {
    if (user?.id && profile) {
      loadStats();
    }
  }, [profile?.plan]);

  const loadStats = async () => {
    if (!user?.id) return;
    try {
      const response = await fetch(`/api/dashboard/stats?userId=${user.id}`);
      const data = await response.json();
      
      if (data.success) {
        setMonthlyStats({
          total: data.monthlyUsage,
          limit: getUsageLimitByPlan(profile?.plan || 'free'),
          percentage: (data.monthlyUsage / getUsageLimitByPlan(profile?.plan || 'free')) * 100
        });
      }
    } catch (error) {
      console.error('통계 로드 실패:', error);
    }
  };

  const loadData = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      // 계정 목록 로드 (활성 계정만)
      const { data: accountsData } = await s2bAccounts.getAll(user.id);
      if (accountsData) {
        setAccounts(accountsData);
        // 활성화된 계정 모두 선택
        const activeAccountIds = new Set(accountsData.map(acc => acc.id));
        setSelectedAccounts(activeAccountIds);
      }

      // 스케줄링 상태 로드
      const authData = JSON.parse(localStorage.getItem('sb-pixpjdiytwicrrsmbcyi-auth-token') || '{}');
      const accessToken = session?.access_token || authData.access_token;
      
      if (!accessToken) {
        console.error('세션 토큰이 없습니다.');
        return;
      }
      
      const response = await fetch(`/api/automation/schedule?userId=${user.id}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });
      const data = await response.json();
      
      if (data.success) {
        setSchedulingStatus({
          isEnabled: data.isSchedulingEnabled,
          maxAccounts: data.maxAccounts,
          activeSchedules: data.schedules
        });

        // 스케줄링이 활성화되어 있고 스케줄이 있는 경우에만 업데이트
        if (data.isSchedulingEnabled && data.schedules.length > 0) {
          const scheduledAccountIds = new Set(
            data.schedules.filter((s: Schedule) => s.isActive).map((s: Schedule) => s.accountId)
          );
          setSelectedAccounts(scheduledAccountIds);
        }
      }
    } catch (error) {
      console.error('데이터 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleScheduling = async () => {
    if (!user?.id) return;

    setLoading(true);
    try {
      const authData = JSON.parse(localStorage.getItem('sb-pixpjdiytwicrrsmbcyi-auth-token') || '{}');
      const accessToken = session?.access_token || authData.access_token;
      
      if (!accessToken) {
        alert('로그인이 필요합니다.');
        setLoading(false);
        return;
      }
      
      const response = await fetch('/api/automation/schedule', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          userId: user.id,
          action: schedulingStatus.isEnabled ? 'disable' : 'enable',
          accountIds: Array.from(selectedAccounts)
        })
      });

      const data = await response.json();
      
      if (data.success) {
        await loadData();
        alert(schedulingStatus.isEnabled ? '자동 스케줄링이 비활성화되었습니다.' : '자동 스케줄링이 활성화되었습니다.');
      } else {
        alert(data.message || '스케줄링 설정에 실패했습니다.');
      }
    } catch (error) {
      alert('스케줄링 설정 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const toggleAccountSelection = (accountId: string) => {
    // 스케줄링이 활성화된 상태에서는 변경 불가
    if (schedulingStatus.isEnabled) {
      return;
    }
    
    const newSelected = new Set(selectedAccounts);
    if (newSelected.has(accountId)) {
      newSelected.delete(accountId);
    } else {
      if (schedulingStatus.maxAccounts === 0) {
        alert('현재 플랜에서는 자동 스케줄링을 사용할 수 없습니다.');
        return;
      }
      if (newSelected.size < schedulingStatus.maxAccounts) {
        newSelected.add(accountId);
      } else {
        alert(`최대 ${schedulingStatus.maxAccounts}개 계정까지 선택 가능합니다.`);
        return;
      }
    }
    setSelectedAccounts(newSelected);
  };

  const formatNextRunTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = date.getTime() - now.getTime();
    
    if (diff < 0) return '곧 실행';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;
    
    if (days > 0) {
      return `${days}일 ${remainingHours}시간 후`;
    } else {
      return `${hours}시간 후`;
    }
  };

  const formatKoreanTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString('ko-KR', { 
      timeZone: 'Asia/Seoul',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // 플랜이 허용되지 않는 경우
  if (!isPlanAllowed) {
    return (
      <div className="min-h-[600px] flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="mb-6">
            <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center">
              <LockClosedIcon className="h-12 w-12 text-gray-400" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            자동 스케줄링은 Basic 플랜 이상에서 사용 가능합니다
          </h2>
          <p className="text-gray-600 mb-6">
            3일마다 자동으로 물품 관리일을 연장하고 가격을 조정하는 편리한 기능을 사용해보세요.
          </p>
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-6 mb-6">
            <h3 className="font-semibold text-gray-900 mb-3">자동 스케줄링 기능</h3>
            <ul className="text-sm text-gray-700 space-y-2 text-left">
              <li className="flex items-start">
                <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                <span>72시간마다 자동 실행</span>
              </li>
              <li className="flex items-start">
                <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                <span>여러 계정 동시 관리</span>
              </li>
              <li className="flex items-start">
                <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                <span>시간 절약 및 자동화</span>
              </li>
            </ul>
          </div>
          <Link
            href="/pricing"
            className="inline-flex items-center px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <SparklesIcon className="h-5 w-5 mr-2" />
            플랜 업그레이드하기
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <ClockIcon className="h-8 w-8 mr-3 text-indigo-600" />
            자동 스케줄링
          </h1>
          
          <div className="flex items-center space-x-6">
            {/* 사용량 정보 */}
            <div className="text-sm">
              <span className="text-gray-500">이번달 사용량:</span>
              <span className="font-medium text-gray-900 ml-1">
                {monthlyStats.total}
                {monthlyStats.limit !== Infinity && ` / ${monthlyStats.limit}`}
              </span>
              {monthlyStats.limit !== Infinity && (
                <span className="text-gray-500 ml-1">
                  ({Math.round(monthlyStats.percentage)}%)
                </span>
              )}
            </div>
            
            {/* 스케줄링 토글 */}
            <button
              onClick={toggleScheduling}
              disabled={loading || accounts.length === 0}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                schedulingStatus.isEnabled ? 'bg-indigo-600' : 'bg-gray-200'
              } ${loading || accounts.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  schedulingStatus.isEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>

        {/* 상태 정보 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-500">스케줄링 상태</p>
            <p className={`text-lg font-semibold ${
              schedulingStatus.isEnabled ? 'text-green-600' : 'text-gray-900'
            }`}>
              {schedulingStatus.isEnabled ? '활성화' : '비활성화'}
            </p>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-500">활성 계정</p>
            <p className="text-lg font-semibold text-gray-900">
              {selectedAccounts.size} / {schedulingStatus.maxAccounts}
            </p>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-500">실행 주기</p>
            <p className="text-lg font-semibold text-gray-900">72시간</p>
          </div>
        </div>
      </div>

      {/* 계정 선택 */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">계정 관리</h2>
        
        {accounts.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500 mb-4">등록된 계정이 없습니다.</p>
            <Link
              href="/dashboard/accounts"
              className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700"
            >
              계정 추가하기
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {accounts.map((account) => {
              const schedule = schedulingStatus.activeSchedules.find(
                s => s.accountId === account.id
              );
              const isSelected = selectedAccounts.has(account.id);
              
              return (
                <div
                  key={account.id}
                  className={`border rounded-lg p-4 transition-colors ${
                    isSelected ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200'
                  } ${!account.is_active ? 'opacity-50' : ''}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-2 h-2 rounded-full ${
                        isSelected && account.is_active ? 'bg-green-500' : 'bg-gray-300'
                      }`} />
                      <div>
                        <p className="font-medium text-gray-900">{account.account_name}</p>
                        <p className="text-sm text-gray-500">{account.s2b_login_id}</p>
                      </div>
                    </div>
                    
                    {schedule && (
                      <div className="text-right text-sm">
                        {schedule.lastRunTime && (
                          <p className="text-gray-500">
                            마지막 실행: {formatKoreanTime(schedule.lastRunTime)}
                          </p>
                        )}
                        {schedule.isActive && (
                          <p className="text-indigo-600 font-medium">
                            다음 실행: {formatNextRunTime(schedule.nextRunTime)}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 스케줄 캘린더 뷰 (간단한 버전) */}
      {schedulingStatus.isEnabled && schedulingStatus.activeSchedules.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <CalendarIcon className="h-5 w-5 mr-2 text-indigo-600" />
            실행 일정
          </h2>
          
          <div className="space-y-2">
            {schedulingStatus.activeSchedules
              .filter(s => s.isActive)
              .sort((a, b) => new Date(a.nextRunTime).getTime() - new Date(b.nextRunTime).getTime())
              .map((schedule) => (
                <div key={schedule.accountId} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div>
                    <p className="font-medium text-gray-900">{schedule.accountName}</p>
                    <p className="text-sm text-gray-500">
                      {formatKoreanTime(schedule.nextRunTime)}
                    </p>
                  </div>
                  <span className="text-sm text-indigo-600 font-medium">
                    {formatNextRunTime(schedule.nextRunTime)}
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* 도움말 */}
      <div className="bg-purple-50 rounded-lg p-6 border border-purple-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">자동 스케줄링 안내</h3>
        <ul className="space-y-2 text-sm text-gray-700">
          <li className="flex items-start">
            <span className="text-purple-600 mr-2">•</span>
            자동 스케줄링을 활성화하면 선택한 계정들이 72시간마다 자동으로 실행됩니다.
          </li>
          <li className="flex items-start">
            <span className="text-purple-600 mr-2">•</span>
            각 계정은 30분 간격으로 순차적으로 실행되어 서버 부하를 분산시킵니다.
          </li>
          <li className="flex items-start">
            <span className="text-purple-600 mr-2">•</span>
            {profile?.plan === 'basic' ? 'Basic 플랜은 최대 3개' : 'Premium 플랜은 최대 5개'}의 계정을 동시에 관리할 수 있습니다.
          </li>
          <li className="flex items-start">
            <span className="text-purple-600 mr-2">•</span>
            스케줄링이 활성화된 상태에서는 계정 선택을 변경할 수 없습니다. 변경하려면 먼저 비활성화하세요.
          </li>
        </ul>
      </div>
    </div>
  );
}