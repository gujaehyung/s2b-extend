'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { s2bAccounts, S2BAccount } from '@/lib/supabase';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { 
  ChartBarIcon, 
  CalendarIcon, 
  CheckCircleIcon, 
  ExclamationCircleIcon,
  ClockIcon,
  CurrencyDollarIcon,
  UserGroupIcon,
  SparklesIcon,
  ArrowTrendingUpIcon,
  BoltIcon,
  DocumentDuplicateIcon,
  PlayIcon
} from '@heroicons/react/24/outline';

interface Activity {
  id: number;
  action: string;
  items: number;
  time: string;
  status: 'success' | 'error' | 'info';
  type: 'manual' | 'scheduled';
}

interface DailyStats {
  date: string;
  count: number;
}

const ClientDate = dynamic(() => import('@/components/ClientDate'), { ssr: false });

export default function DashboardPage() {
  const { user, profile, loading, session } = useAuth();
  const [accounts, setAccounts] = useState<S2BAccount[]>([]);
  const [todayStats, setTodayStats] = useState({
    processed: 0,
    success: 0,
    failed: 0,
    nextScheduled: null as Date | null
  });
  const [monthlyStats, setMonthlyStats] = useState({
    total: 0,
    limit: 0,
    percentage: 0
  });
  const [recentActivities, setRecentActivities] = useState<Activity[]>([]);
  const [dailyChart, setDailyChart] = useState<DailyStats[]>([]);
  const [quickRunAccount, setQuickRunAccount] = useState('');
  const [isRunning, setIsRunning] = useState(false);

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

  // 계정 목록 로드
  useEffect(() => {
    if (user?.id) {
      loadAccounts();
      loadStats();
      loadRecentActivities();
    }
  }, [user?.id]);

  // profile이 변경될 때 통계 다시 로드
  useEffect(() => {
    if (user?.id && profile) {
      loadStats();
    }
  }, [profile?.plan]);

  const loadAccounts = async () => {
    if (!user?.id) return;
    const { data } = await s2bAccounts.getAll(user.id);
    if (data) {
      const accountsData = data as unknown as S2BAccount[];
      setAccounts(accountsData);
      if (accountsData.length > 0 && !quickRunAccount) {
        setQuickRunAccount(accountsData[0].id);
      }
    }
  };

  const loadStats = async () => {
    if (!user?.id) return;
    try {
      const response = await fetch(`/api/dashboard/stats?userId=${user.id}`);
      const data = await response.json();
      
      if (data.success) {
        setTodayStats(data.todayStats);
        setMonthlyStats({
          total: data.monthlyUsage,
          limit: getUsageLimitByPlan(profile?.plan || 'free'),
          percentage: (data.monthlyUsage / getUsageLimitByPlan(profile?.plan || 'free')) * 100
        });
        setDailyChart(data.dailyStats);
      }
    } catch (error) {
      console.error('통계 로드 실패:', error);
    }
  };

  const loadRecentActivities = async () => {
    if (!user?.id) return;
    try {
      const response = await fetch(`/api/dashboard/activities?userId=${user.id}`);
      const data = await response.json();
      
      if (data.success) {
        setRecentActivities(data.activities);
      }
    } catch (error) {
      console.error('활동 내역 로드 실패:', error);
    }
  };

  const handleQuickRun = async () => {
    if (!quickRunAccount) {
      alert('실행할 계정을 선택해주세요.');
      return;
    }

    setIsRunning(true);
    try {
      const account = accounts.find(a => a.id === quickRunAccount);
      if (!account) return;

      // localStorage에서 직접 토큰 가져오기 (임시 해결책)
      const authData = JSON.parse(localStorage.getItem('sb-pixpjdiytwicrrsmbcyi-auth-token') || '{}');
      const accessToken = session?.access_token || authData.access_token;
      
      if (!accessToken) {
        alert('로그인이 필요합니다.');
        setIsRunning(false);
        return;
      }
      
      const response = await fetch('/api/automation/start', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          userId: user?.id,
          accountId: account.id,
          loginId: account.s2b_login_id,
          loginPassword: account.s2b_password,
          priceIncreaseRate: account.price_increase_rate,
          userPlan: profile?.plan || 'free'
        })
      });

      const data = await response.json();
      if (data.success) {
        alert('자동화가 시작되었습니다.');
        loadStats();
        loadRecentActivities();
      } else {
        alert(data.message || '자동화 시작에 실패했습니다.');
      }
    } catch (error) {
      alert('자동화 시작 중 오류가 발생했습니다.');
    } finally {
      setIsRunning(false);
    }
  };

  const formatNextScheduledTime = (date: Date | string | null) => {
    if (!date) return '예정 없음';
    
    // 문자열인 경우 Date 객체로 변환
    const dateObj = date instanceof Date ? date : new Date(date);
    
    // 유효한 날짜인지 확인
    if (isNaN(dateObj.getTime())) return '예정 없음';
    
    const now = new Date();
    const diff = dateObj.getTime() - now.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days}일 후`;
    } else if (hours > 0) {
      return `${hours}시간 ${minutes}분 후`;
    } else if (minutes > 0) {
      return `${minutes}분 후`;
    } else {
      return '곧 실행';
    }
  };

  const getMaxDailyCount = () => {
    return Math.max(...dailyChart.map(d => d.count), 1);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-900">대시보드</h1>
          <div className="flex items-center space-x-4">
            <ClientDate className="text-sm text-gray-500" />
          </div>
        </div>

        {/* 플랜 정보 및 사용량 */}
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90">현재 플랜</p>
              <p className="text-2xl font-bold">{profile?.plan?.toUpperCase() || 'FREE'}</p>
            </div>
            <div className="text-right">
              <p className="text-sm opacity-90">이번달 사용량</p>
              <p className="text-2xl font-bold">
                {monthlyStats.total}
                {monthlyStats.limit !== Infinity && ` / ${monthlyStats.limit}`}
              </p>
              {monthlyStats.limit !== Infinity && (
                <div className="mt-2 w-32 bg-white/20 rounded-full h-2">
                  <div 
                    className="bg-white rounded-full h-2 transition-all duration-300"
                    style={{ width: `${Math.min(monthlyStats.percentage, 100)}%` }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 오늘의 요약 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">오늘 처리</p>
              <p className="text-2xl font-bold text-gray-900">{todayStats.processed}</p>
            </div>
            <DocumentDuplicateIcon className="h-8 w-8 text-indigo-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">성공률</p>
              <p className="text-2xl font-bold text-green-600">
                {todayStats.processed > 0 
                  ? Math.round((todayStats.success / todayStats.processed) * 100)
                  : 0}%
              </p>
            </div>
            <CheckCircleIcon className="h-8 w-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">활성 계정</p>
              <p className="text-2xl font-bold text-gray-900">
                {accounts.filter(a => a.is_active).length} / {accounts.length}
              </p>
            </div>
            <UserGroupIcon className="h-8 w-8 text-purple-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">다음 실행</p>
              <p className="text-lg font-bold text-gray-900">
                {formatNextScheduledTime(todayStats.nextScheduled)}
              </p>
            </div>
            <ClockIcon className="h-8 w-8 text-orange-600" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 빠른 실행 */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <BoltIcon className="h-5 w-5 mr-2 text-yellow-500" />
            빠른 실행
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                계정 선택
              </label>
              <select
                value={quickRunAccount}
                onChange={(e) => setQuickRunAccount(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                disabled={accounts.length === 0 || isRunning}
              >
                {accounts.length === 0 ? (
                  <option value="">계정이 없습니다</option>
                ) : (
                  accounts.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.account_name} ({account.s2b_login_id})
                    </option>
                  ))
                )}
              </select>
            </div>

            <button
              onClick={handleQuickRun}
              disabled={!quickRunAccount || isRunning}
              className={`w-full flex items-center justify-center px-4 py-3 rounded-lg font-medium transition-colors ${
                !quickRunAccount || isRunning
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-indigo-600 text-white hover:bg-indigo-700'
              }`}
            >
              {isRunning ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  실행 중...
                </>
              ) : (
                <>
                  <PlayIcon className="h-5 w-5 mr-2" />
                  즉시 실행
                </>
              )}
            </button>

            <div className="text-sm text-gray-500 space-y-1">
              <p>• 선택한 계정으로 자동화를 즉시 시작합니다</p>
              <p>• 자세한 설정은 <Link href="/dashboard/automation" className="text-indigo-600 hover:underline">일반 자동화</Link>에서 가능합니다</p>
            </div>
          </div>
        </div>

        {/* 일별 처리량 차트 */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <ChartBarIcon className="h-5 w-5 mr-2 text-blue-500" />
            최근 7일 처리량
          </h2>
          
          <div className="h-48 flex items-end justify-between space-x-2">
            {dailyChart.slice(-7).map((day, index) => {
              const height = (day.count / getMaxDailyCount()) * 100;
              return (
                <div key={index} className="flex-1 flex flex-col items-center">
                  <div className="w-full bg-gray-200 rounded-t relative" style={{ height: '160px' }}>
                    <div 
                      className="absolute bottom-0 w-full bg-gradient-to-t from-indigo-600 to-indigo-400 rounded-t transition-all duration-300"
                      style={{ height: `${height}%` }}
                    >
                      {day.count > 0 && (
                        <span className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs font-medium text-gray-700">
                          {day.count}
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="text-xs text-gray-500 mt-2">
                    {new Date(day.date).getDate()}일
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 최근 활동 및 계정 현황 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 최근 활동 */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <SparklesIcon className="h-5 w-5 mr-2 text-purple-500" />
              최근 활동
            </h2>
            <Link 
              href="/dashboard/logs" 
              className="text-sm text-indigo-600 hover:underline"
            >
              전체 보기
            </Link>
          </div>
          
          <div className="space-y-3">
            {recentActivities.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-8">
                아직 활동 내역이 없습니다.
              </p>
            ) : (
              recentActivities.slice(0, 5).map((activity) => (
                <div key={activity.id} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div className="flex items-center space-x-3">
                    {activity.status === 'success' ? (
                      <CheckCircleIcon className="h-5 w-5 text-green-500" />
                    ) : activity.status === 'error' ? (
                      <ExclamationCircleIcon className="h-5 w-5 text-red-500" />
                    ) : (
                      <ClockIcon className="h-5 w-5 text-gray-400" />
                    )}
                    <div>
                      <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                      <p className="text-xs text-gray-500">
                        {activity.items > 0 && `${activity.items}개 처리 • `}
                        {activity.type === 'scheduled' && '자동 • '}
                        {activity.time}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* 계정 현황 */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <UserGroupIcon className="h-5 w-5 mr-2 text-indigo-500" />
              계정 현황
            </h2>
            <Link 
              href="/dashboard/accounts" 
              className="text-sm text-indigo-600 hover:underline"
            >
              관리
            </Link>
          </div>
          
          <div className="space-y-3">
            {accounts.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500 text-sm mb-4">
                  등록된 계정이 없습니다.
                </p>
                <Link 
                  href="/dashboard/accounts" 
                  className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700"
                >
                  계정 추가하기
                </Link>
              </div>
            ) : (
              accounts.map((account) => (
                <div key={account.id} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div className="flex items-center space-x-3">
                    <div className={`w-2 h-2 rounded-full ${
                      account.is_active ? 'bg-green-500' : 'bg-gray-300'
                    }`} />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{account.account_name}</p>
                      <p className="text-xs text-gray-500">
                        {account.s2b_login_id} • 
                        인상률 {account.price_increase_rate}%
                      </p>
                    </div>
                  </div>
                  <span className="text-xs text-gray-500">
                    {account.last_run_at 
                      ? (() => {
                          try {
                            return new Date(account.last_run_at).toLocaleDateString('ko-KR');
                          } catch {
                            return '날짜 오류';
                          }
                        })()
                      : '미실행'
                    }
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* 도움말 카드 */}
      <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg p-6 border border-purple-200">
        <div className="flex items-start space-x-4">
          <div className="flex-shrink-0">
            <SparklesIcon className="h-8 w-8 text-purple-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              S2B Manager 활용 팁
            </h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• 자동 스케줄링을 활성화하면 3일마다 자동으로 관리일이 연장됩니다</li>
              <li>• 여러 계정을 등록하여 효율적으로 관리할 수 있습니다</li>
              <li>• 가격 인상률을 설정하여 물품 가격을 자동으로 조정할 수 있습니다</li>
            </ul>
            {profile?.plan === 'free' && (
              <div className="mt-4">
                <Link 
                  href="/pricing" 
                  className="inline-flex items-center text-sm font-medium text-purple-600 hover:text-purple-700"
                >
                  플랜 업그레이드하기
                  <ArrowTrendingUpIcon className="h-4 w-4 ml-1" />
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}