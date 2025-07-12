'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { s2bAccounts, S2BAccount } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function AccountsPage() {
  const { user, profile, loading } = useAuth();
  const [accounts, setAccounts] = useState<S2BAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingAccount, setEditingAccount] = useState<S2BAccount | null>(null);
  const router = useRouter();

  const [formData, setFormData] = useState({
    account_name: '',
    s2b_login_id: '',
    s2b_password: '',
    price_increase_rate: 5,
    is_default: false
  });

  // 플랜별 접근 제한 체크
  const canAccessAccountManagement = profile && ['basic', 'premium'].includes(profile.plan);

  // 계정 추가 전 제한 확인
  const checkAccountLimits = () => {
    if (!profile) return false;
    
    const currentCount = accounts.length;
    let maxAccounts = 0;
    
    switch (profile.plan) {
      case 'free':
      case 'standard':
        setError('계정 관리는 베이직 플랜 이상부터 사용 가능합니다.');
        return false;
      case 'basic':
        maxAccounts = 3;
        break;
      case 'premium':
        maxAccounts = 999;
        break;
    }
    
    if (currentCount >= maxAccounts) {
      setError(`베이직 플랜은 최대 3개 계정까지 등록 가능합니다.`);
      return false;
    }
    
    return true;
  };

  // 새 계정 추가 버튼 클릭 핸들러
  const handleAddAccount = () => {
    setError(null); // 기존 오류 메시지 초기화
    
    if (checkAccountLimits()) {
      setShowForm(true);
    }
  };

  useEffect(() => {
    if (!loading) {
      if (!user || !profile) {
        router.push('/login');
        return;
      }
      loadAccounts();
    }
  }, [loading, user, profile, router]);

  const loadAccounts = async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      const { data, error } = await s2bAccounts.getAll(user.id);
      if (error) throw error;
      setAccounts(data || []);
    } catch (err) {
      console.error('계정 목록 로드 오류:', err);
      setError('계정 목록을 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile) return;

    // 유효성 검사
    if (!formData.account_name.trim() || !formData.s2b_login_id.trim() || !formData.s2b_password.trim()) {
      setError('모든 필수 항목을 입력해주세요.');
      return;
    }
    if (formData.price_increase_rate < 1 || formData.price_increase_rate > 8) {
      setError('가격 인상률은 1%~8% 사이여야 합니다.');
      return;
    }

    try {
      setError(null);
      
      console.log('계정 저장 시작:', { user_id: user.id, formData });
      
      if (editingAccount) {
        const updateResult = await s2bAccounts.update(editingAccount.id, formData);
        console.log('계정 업데이트 결과:', updateResult);
      } else {
        const createData = {
          user_id: user.id,
          ...formData,
          is_active: true
        };
        console.log('계정 생성 데이터:', createData);
        const createResult = await s2bAccounts.create(createData);
        console.log('계정 생성 결과:', createResult);
      }

      setFormData({
        account_name: '',
        s2b_login_id: '',
        s2b_password: '',
        price_increase_rate: 5,
        is_default: false
      });
      setShowForm(false);
      setEditingAccount(null);
      loadAccounts();
    } catch (err) {
      console.error('계정 저장 오류:', err);
      setError('계정 저장에 실패했습니다.');
    }
  };

  if (loading || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* 사이드바 */}
      <div className="w-64 bg-white shadow-lg border-r border-gray-200 fixed h-full overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z"/>
              </svg>
            </div>
            <h1 className="text-lg font-semibold text-gray-900">S2B Pro</h1>
          </div>
          
          <nav className="space-y-2">
            <a href="/dashboard" className="flex items-center gap-3 px-3 py-2 text-gray-600 hover:text-blue-600 hover:bg-gray-50 rounded-lg transition-colors">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z"/>
              </svg>
              대시보드
            </a>
            
            
            <a href="/accounts" className="flex items-center gap-3 px-3 py-2 text-blue-600 bg-blue-50 rounded-lg font-medium">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd"/>
              </svg>
              계정 관리
            </a>

            {profile?.role === 'admin' && (
              <a href="/admin" className="flex items-center gap-3 px-3 py-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                </svg>
                관리자
              </a>
            )}
          </nav>
        </div>
      </div>

      {/* 메인 컨텐츠 */}
      <div className="flex-1 ml-64">
        <header className="bg-white shadow-sm border-b">
          <div className="px-6 py-4">
            <h2 className="text-xl font-semibold text-gray-900">S2B 계정 관리</h2>
          </div>
        </header>

        <div className="p-6">
          {!canAccessAccountManagement ? (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-8 text-center">
              <h3 className="text-lg font-medium text-yellow-800 mb-2">계정 관리 기능 제한</h3>
              <p className="text-yellow-700 mb-4">
                계정 관리는 베이직 플랜 이상부터 사용 가능합니다.
              </p>
              <a 
                href="/dashboard" 
                className="bg-yellow-600 hover:bg-yellow-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
              >
                플랜 업그레이드하기
              </a>
            </div>
          ) : (
            <>
              <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900">S2B 계정 관리</h1>
                <p className="mt-2 text-gray-600">
                  베이직: 3개, 프리미엄: 무제한 | 현재: {accounts.length}개
                  <span className="text-red-600 font-medium"> (가격 인상률 1%~8%)</span>
                </p>
              </div>

              {error && (
                <div className="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
                  {error}
                </div>
              )}

              <div className="mb-6">
                <button
                  onClick={handleAddAccount}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                >
                  + 새 계정 추가
                </button>
              </div>

              {/* 계정 목록 */}
              <div className="bg-white rounded-lg shadow overflow-hidden">
                {accounts.length === 0 ? (
                  <div className="text-center py-12">
                    <h3 className="text-lg font-medium text-gray-900">등록된 계정이 없습니다</h3>
                    <p className="text-gray-500">S2B 계정을 추가해보세요.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">계정 정보</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">인상률</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">상태</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">작업</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {accounts.map((account) => (
                          <tr key={account.id}>
                            <td className="px-6 py-4">
                              <div className="font-medium text-gray-900">
                                {account.account_name}
                                {account.is_default && <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">기본</span>}
                              </div>
                              <div className="text-sm text-gray-500">{account.s2b_login_id}</div>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-900">{account.price_increase_rate}%</td>
                            <td className="px-6 py-4">
                              <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">활성</span>
                            </td>
                            <td className="px-6 py-4 text-sm space-x-2">
                              <button
                                onClick={() => s2bAccounts.update(account.id, { is_default: !account.is_default }).then(loadAccounts)}
                                className="text-blue-600 hover:text-blue-900"
                              >
                                {account.is_default ? '기본 해제' : '기본 설정'}
                              </button>
                              <button
                                onClick={() => s2bAccounts.delete(account.id).then(loadAccounts)}
                                className="text-red-600 hover:text-red-900"
                              >
                                삭제
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}

          {/* 계정 추가 폼 */}
          {showForm && (
            <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
              <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
                <h3 className="text-lg font-medium text-gray-900 mb-4">S2B 계정 추가</h3>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">계정 별칭 *</label>
                    <input
                      type="text"
                      value={formData.account_name}
                      onChange={(e) => setFormData(prev => ({ ...prev, account_name: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="예: 메인 계정"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">S2B 로그인 ID *</label>
                    <input
                      type="text"
                      value={formData.s2b_login_id}
                      onChange={(e) => setFormData(prev => ({ ...prev, s2b_login_id: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">S2B 비밀번호 *</label>
                    <input
                      type="password"
                      value={formData.s2b_password}
                      onChange={(e) => setFormData(prev => ({ ...prev, s2b_password: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">가격 인상률 (1%~8%) *</label>
                    <input
                      type="number"
                      min="1"
                      max="8"
                      step="0.1"
                      value={formData.price_increase_rate}
                      onChange={(e) => setFormData(prev => ({ ...prev, price_increase_rate: parseFloat(e.target.value) }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.is_default}
                      onChange={(e) => setFormData(prev => ({ ...prev, is_default: e.target.checked }))}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label className="ml-2 block text-sm text-gray-700">기본 계정으로 설정</label>
                  </div>

                  <div className="flex space-x-3 pt-4">
                    <button
                      type="submit"
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md transition-colors"
                    >
                      추가
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowForm(false)}
                      className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 py-2 px-4 rounded-md transition-colors"
                    >
                      취소
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}