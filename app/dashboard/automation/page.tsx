'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { s2bAccounts, S2BAccount } from '@/lib/supabase';
import { 
  PlayIcon, 
  StopIcon, 
  ArrowPathIcon,
  CogIcon,
  CheckCircleIcon,
  ExclamationCircleIcon
} from '@heroicons/react/24/outline';

interface AutomationStatus {
  isRunning: boolean;
  currentTask: string;
  progress: number;
  itemsProcessed: number;
  totalItems: number;
  sessionId: string | null;
  logs: string[];
}

export default function AutomationPage() {
  const { user, profile, session } = useAuth();
  const [accounts, setAccounts] = useState<S2BAccount[]>([]);
  const [selectedAccount, setSelectedAccount] = useState('');
  const [priceIncreaseRate, setPriceIncreaseRate] = useState(3);
  const [status, setStatus] = useState<AutomationStatus>({
    isRunning: false,
    currentTask: '대기 중',
    progress: 0,
    itemsProcessed: 0,
    totalItems: 0,
    sessionId: null,
    logs: []
  });
  const [eventSource, setEventSource] = useState<EventSource | null>(null);
  const [monthlyStats, setMonthlyStats] = useState({
    total: 0,
    limit: 0,
    percentage: 0
  });

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
    if (user?.id) {
      loadAccounts();
      loadStats();
    }
    
    return () => {
      if (eventSource) {
        eventSource.close();
      }
    };
  }, [user?.id]);

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

  const loadAccounts = async () => {
    if (!user?.id) return;
    const { data } = await s2bAccounts.getAll(user.id);
    if (data) {
      // Type casting for Supabase data
      const accountsData = data as unknown as S2BAccount[];
      setAccounts(accountsData);
      if (accountsData.length > 0 && !selectedAccount) {
        setSelectedAccount(accountsData[0].id);
        setPriceIncreaseRate(accountsData[0].price_increase_rate);
      }
    }
  };

  const handleAccountChange = (accountId: string) => {
    setSelectedAccount(accountId);
    const account = accounts.find(a => a.id === accountId);
    if (account) {
      setPriceIncreaseRate(account.price_increase_rate);
    }
  };

  const startAutomation = async () => {
    if (!selectedAccount) {
      alert('실행할 계정을 선택해주세요.');
      return;
    }

    const account = accounts.find(a => a.id === selectedAccount);
    if (!account) return;

    setStatus(prev => ({ ...prev, isRunning: true, logs: [] }));

    try {
      // 세션 확인 및 토큰 가져오기
      console.log('AuthContext session:', session);
      
      // localStorage에서 직접 토큰 가져오기 (임시 해결책)
      const authData = JSON.parse(localStorage.getItem('sb-pixpjdiytwicrrsmbcyi-auth-token') || '{}');
      const accessToken = session?.access_token || authData.access_token;
      
      if (!accessToken) {
        alert('로그인이 필요합니다.');
        setStatus(prev => ({ ...prev, isRunning: false }));
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
          priceIncreaseRate,
          userPlan: profile?.plan || 'free'
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setStatus(prev => ({ ...prev, sessionId: data.sessionId }));
        
        // SSE 연결 설정 (인증 토큰 포함)
        const sse = new EventSource(`/api/automation/stream/${data.sessionId}`);
        setEventSource(sse);

        sse.onmessage = (event) => {
          const update = JSON.parse(event.data);
          
          setStatus(prev => ({
            ...prev,
            currentTask: update.status === 'completed' && update.itemsProcessed === 0 
              ? '0개 모두 처리 되었습니다' 
              : update.currentTask || prev.currentTask,
            progress: update.progress || prev.progress,
            itemsProcessed: update.itemsProcessed || prev.itemsProcessed,
            totalItems: update.totalItems || prev.totalItems,
            logs: [...prev.logs, `[${new Date().toLocaleTimeString('ko-KR', { timeZone: 'Asia/Seoul' })}] ${update.message}`]
          }));

          if (update.status === 'completed' || update.status === 'error') {
            sse.close();
            setEventSource(null);
            setStatus(prev => ({ ...prev, isRunning: false }));
            
            if (update.status === 'completed') {
              const processedCount = update.itemsProcessed || 0;
              if (processedCount === 0) {
                alert('자동화가 완료되었습니다. 처리할 항목이 없습니다.');
              } else {
                alert(`자동화가 완료되었습니다. 처리된 물품: ${processedCount}개`);
              }
            } else {
              alert(`오류가 발생했습니다: ${update.message}`);
            }
          }
        };

        sse.onerror = () => {
          sse.close();
          setEventSource(null);
          setStatus(prev => ({ ...prev, isRunning: false }));
        };
      } else {
        alert(data.message || '자동화 시작에 실패했습니다.');
        setStatus(prev => ({ ...prev, isRunning: false }));
      }
    } catch (error) {
      alert('자동화 시작 중 오류가 발생했습니다.');
      setStatus(prev => ({ ...prev, isRunning: false }));
    }
  };

  const stopAutomation = () => {
    if (eventSource) {
      eventSource.close();
      setEventSource(null);
    }
    setStatus(prev => ({ ...prev, isRunning: false }));
    alert('자동화를 중지했습니다.');
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
          <CogIcon className="h-8 w-8 mr-3 text-indigo-600" />
          일반 자동화
        </h1>

        {/* 계정 선택 및 설정 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              실행할 계정
            </label>
            <select
              value={selectedAccount}
              onChange={(e) => handleAccountChange(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              disabled={status.isRunning || accounts.length === 0}
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              가격 인상률 (%)
            </label>
            <input
              type="number"
              value={priceIncreaseRate}
              onChange={(e) => setPriceIncreaseRate(Number(e.target.value))}
              min="0"
              max="100"
              step="0.1"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              disabled={status.isRunning}
            />
          </div>
        </div>

        {/* 실행 버튼 */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={status.isRunning ? stopAutomation : startAutomation}
            disabled={!selectedAccount && !status.isRunning}
            className={`flex items-center px-6 py-3 rounded-lg font-medium transition-colors ${
              status.isRunning
                ? 'bg-red-600 text-white hover:bg-red-700'
                : !selectedAccount
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-indigo-600 text-white hover:bg-indigo-700'
            }`}
          >
            {status.isRunning ? (
              <>
                <StopIcon className="h-5 w-5 mr-2" />
                중지
              </>
            ) : (
              <>
                <PlayIcon className="h-5 w-5 mr-2" />
                자동화 시작
              </>
            )}
          </button>

          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-500">
              플랜: <span className="font-medium">{profile?.plan?.toUpperCase()}</span>
            </div>
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
          </div>
        </div>
      </div>

      {/* 진행 상태 */}
      {(status.isRunning || status.logs.length > 0) && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">진행 상태</h2>
          
          {/* 진행률 바 */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">{status.currentTask}</span>
              <span className="text-sm font-medium text-gray-900">
                {status.itemsProcessed} / {status.totalItems === 0 ? status.itemsProcessed : (status.totalItems || '?')} 완료
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-indigo-600 rounded-full h-2 transition-all duration-300"
                style={{ width: `${status.progress}%` }}
              />
            </div>
          </div>

          {/* 실시간 로그 */}
          <div className="bg-gray-50 rounded-lg p-4 h-64 overflow-y-auto">
            <h3 className="text-sm font-medium text-gray-700 mb-2">실행 로그</h3>
            <div className="space-y-1 text-xs font-mono">
              {status.logs.length === 0 ? (
                <p className="text-gray-500">로그가 없습니다.</p>
              ) : (
                status.logs.map((log, index) => (
                  <div key={index} className={`${
                    log.includes('오류') || log.includes('실패') 
                      ? 'text-red-600' 
                      : log.includes('완료') || log.includes('성공')
                      ? 'text-green-600'
                      : 'text-gray-700'
                  }`}>
                    {log}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* 도움말 */}
      <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">사용 방법</h3>
        <ul className="space-y-2 text-sm text-gray-700">
          <li className="flex items-start">
            <span className="text-blue-600 mr-2">•</span>
            실행할 계정을 선택하고 가격 인상률을 설정하세요.
          </li>
          <li className="flex items-start">
            <span className="text-blue-600 mr-2">•</span>
            자동화 시작 버튼을 클릭하면 물품 관리일 연장과 가격 조정이 자동으로 진행됩니다.
          </li>
          <li className="flex items-start">
            <span className="text-blue-600 mr-2">•</span>
            진행 중에는 실시간으로 상태를 확인할 수 있습니다.
          </li>
          <li className="flex items-start">
            <span className="text-blue-600 mr-2">•</span>
            필요시 언제든 중지 버튼으로 작업을 중단할 수 있습니다.
          </li>
        </ul>
      </div>
    </div>
  );
}