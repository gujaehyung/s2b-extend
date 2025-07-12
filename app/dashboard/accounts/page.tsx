'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { s2bAccounts, S2BAccount } from '@/lib/supabase';
import { 
  UserGroupIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  CheckCircleIcon,
  XCircleIcon,
  EyeIcon,
  EyeSlashIcon
} from '@heroicons/react/24/outline';

interface AccountForm {
  accountName: string;
  s2bLoginId: string;
  s2bPassword: string;
  priceIncreaseRate: number;
}

export default function AccountsPage() {
  const { user, profile } = useAuth();
  const [accounts, setAccounts] = useState<S2BAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingAccount, setEditingAccount] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState<{ [key: string]: boolean }>({});
  
  const [form, setForm] = useState<AccountForm>({
    accountName: '',
    s2bLoginId: '',
    s2bPassword: '',
    priceIncreaseRate: 3
  });

  const getMaxAccountsByPlan = (plan: string) => {
    const limits: Record<string, number> = {
      free: 1,
      standard: 3,
      basic: 5,
      premium: 10
    };
    return limits[plan] || 1;
  };

  useEffect(() => {
    if (user?.id) {
      loadAccounts();
    }
  }, [user?.id]);

  const loadAccounts = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      const { data, error } = await s2bAccounts.getAll(user.id);
      if (error) {
        console.error('계정 로드 오류:', error);
      } else if (data) {
        setAccounts(data);
      }
    } catch (error) {
      console.error('계정 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user?.id) return;

    const maxAccounts = getMaxAccountsByPlan(profile?.plan || 'free');
    if (!editingAccount && accounts.length >= maxAccounts) {
      alert(`${profile?.plan || 'free'} 플랜에서는 최대 ${maxAccounts}개의 계정만 등록할 수 있습니다.`);
      return;
    }

    setLoading(true);
    try {
      if (editingAccount) {
        // 계정 수정
        const { error } = await s2bAccounts.update(editingAccount, {
          account_name: form.accountName,
          s2b_login_id: form.s2bLoginId,
          s2b_password: form.s2bPassword,
          price_increase_rate: form.priceIncreaseRate
        });

        if (error) {
          alert('계정 수정에 실패했습니다.');
        } else {
          alert('계정이 수정되었습니다.');
          setEditingAccount(null);
        }
      } else {
        // 계정 추가
        const { error } = await s2bAccounts.create({
          user_id: user.id,
          account_name: form.accountName,
          s2b_login_id: form.s2bLoginId,
          s2b_password: form.s2bPassword,
          price_increase_rate: form.priceIncreaseRate,
          is_active: true,
          is_default: false
        });

        if (error) {
          alert('계정 추가에 실패했습니다.');
        } else {
          alert('계정이 추가되었습니다.');
          setShowAddForm(false);
        }
      }

      // 폼 초기화 및 목록 새로고침
      setForm({
        accountName: '',
        s2bLoginId: '',
        s2bPassword: '',
        priceIncreaseRate: 3
      });
      await loadAccounts();
    } catch (error) {
      alert('작업 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (account: S2BAccount) => {
    setEditingAccount(account.id);
    setForm({
      accountName: account.account_name,
      s2bLoginId: account.s2b_login_id,
      s2bPassword: account.s2b_password,
      priceIncreaseRate: account.price_increase_rate
    });
    setShowAddForm(true);
  };

  const handleDelete = async (accountId: string) => {
    if (!confirm('이 계정을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
      return;
    }

    setLoading(true);
    try {
      const { error } = await s2bAccounts.delete(accountId);
      
      if (error) {
        alert('계정 삭제에 실패했습니다.');
      } else {
        alert('계정이 삭제되었습니다.');
        await loadAccounts();
      }
    } catch (error) {
      alert('계정 삭제 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const toggleAccountStatus = async (account: S2BAccount) => {
    setLoading(true);
    try {
      const { error } = await s2bAccounts.update(account.id, {
        is_active: !account.is_active
      });

      if (error) {
        alert('상태 변경에 실패했습니다.');
      } else {
        await loadAccounts();
      }
    } catch (error) {
      alert('상태 변경 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const cancelEdit = () => {
    setEditingAccount(null);
    setShowAddForm(false);
    setForm({
      accountName: '',
      s2bLoginId: '',
      s2bPassword: '',
      priceIncreaseRate: 3
    });
  };

  if (loading && accounts.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const maxAccounts = getMaxAccountsByPlan(profile?.plan || 'free');
  const canAddMore = accounts.length < maxAccounts;

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <UserGroupIcon className="h-8 w-8 mr-3 text-indigo-600" />
            계정 관리
          </h1>
          
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-500">
              {accounts.length} / {maxAccounts} 계정
            </span>
            {canAddMore && (
              <button
                onClick={() => setShowAddForm(true)}
                className="flex items-center px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                계정 추가
              </button>
            )}
          </div>
        </div>

        {/* 계정 한도 알림 */}
        {!canAddMore && (
          <div className="mb-6 bg-amber-50 border border-amber-200 rounded-lg p-4">
            <p className="text-sm text-amber-800">
              현재 플랜({profile?.plan || 'free'})의 최대 계정 수({maxAccounts}개)에 도달했습니다.
              더 많은 계정을 추가하려면 플랜을 업그레이드하세요.
            </p>
          </div>
        )}

        {/* 계정 추가/수정 폼 */}
        {showAddForm && (
          <div className="mb-6 bg-gray-50 rounded-lg p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {editingAccount ? '계정 수정' : '새 계정 추가'}
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    계정 이름
                  </label>
                  <input
                    type="text"
                    value={form.accountName}
                    onChange={(e) => setForm(prev => ({ ...prev, accountName: e.target.value }))}
                    placeholder="예: 메인 계정"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    S2B 아이디
                  </label>
                  <input
                    type="text"
                    value={form.s2bLoginId}
                    onChange={(e) => setForm(prev => ({ ...prev, s2bLoginId: e.target.value }))}
                    placeholder="S2B 로그인 아이디"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    S2B 비밀번호
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword['form'] ? 'text' : 'password'}
                      value={form.s2bPassword}
                      onChange={(e) => setForm(prev => ({ ...prev, s2bPassword: e.target.value }))}
                      placeholder="S2B 로그인 비밀번호"
                      className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(prev => ({ ...prev, form: !prev.form }))}
                      className="absolute right-2 top-2.5 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword['form'] ? (
                        <EyeSlashIcon className="h-5 w-5" />
                      ) : (
                        <EyeIcon className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    가격 인상률 (%)
                  </label>
                  <input
                    type="number"
                    value={form.priceIncreaseRate}
                    onChange={(e) => setForm(prev => ({ ...prev, priceIncreaseRate: Number(e.target.value) }))}
                    min="0"
                    max="100"
                    step="0.1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
              </div>
              
              <div className="flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:bg-gray-400"
                >
                  {loading ? '처리 중...' : editingAccount ? '수정' : '추가'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* 계정 목록 */}
        <div className="space-y-3">
          {accounts.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <UserGroupIcon className="mx-auto h-12 w-12 text-gray-400 mb-3" />
              <p className="text-gray-500 mb-4">등록된 계정이 없습니다.</p>
              {canAddMore && (
                <button
                  onClick={() => setShowAddForm(true)}
                  className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700"
                >
                  <PlusIcon className="h-4 w-4 mr-2" />
                  첫 계정 추가하기
                </button>
              )}
            </div>
          ) : (
            accounts.map((account) => (
              <div
                key={account.id}
                className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <div className={`w-2 h-2 rounded-full ${
                        account.is_active ? 'bg-green-500' : 'bg-gray-300'
                      }`} />
                      <h3 className="text-lg font-medium text-gray-900">
                        {account.account_name}
                      </h3>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        account.is_active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {account.is_active ? '활성' : '비활성'}
                      </span>
                    </div>
                    
                    <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-gray-600">
                      <div>
                        <span className="font-medium">아이디:</span> {account.s2b_login_id}
                      </div>
                      <div className="flex items-center">
                        <span className="font-medium mr-2">비밀번호:</span>
                        {showPassword[account.id] ? (
                          <span className="font-mono">{account.s2b_password}</span>
                        ) : (
                          <span>••••••••</span>
                        )}
                        <button
                          onClick={() => setShowPassword(prev => ({ 
                            ...prev, 
                            [account.id]: !prev[account.id] 
                          }))}
                          className="ml-2 text-gray-400 hover:text-gray-600"
                        >
                          {showPassword[account.id] ? (
                            <EyeSlashIcon className="h-4 w-4" />
                          ) : (
                            <EyeIcon className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                      <div>
                        <span className="font-medium">가격 인상률:</span> {account.price_increase_rate}%
                      </div>
                    </div>
                    
                    {account.last_run_at && (
                      <div className="mt-2 text-xs text-gray-500">
                        마지막 실행: {new Date(account.last_run_at).toLocaleString('ko-KR')}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={() => toggleAccountStatus(account)}
                      className={`p-2 rounded-lg transition-colors ${
                        account.is_active
                          ? 'text-green-600 hover:bg-green-50'
                          : 'text-gray-400 hover:bg-gray-50'
                      }`}
                      title={account.is_active ? '비활성화' : '활성화'}
                    >
                      {account.is_active ? (
                        <CheckCircleIcon className="h-5 w-5" />
                      ) : (
                        <XCircleIcon className="h-5 w-5" />
                      )}
                    </button>
                    
                    <button
                      onClick={() => handleEdit(account)}
                      className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                      title="수정"
                    >
                      <PencilIcon className="h-5 w-5" />
                    </button>
                    
                    <button
                      onClick={() => handleDelete(account.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="삭제"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 안내 사항 */}
      <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">계정 관리 안내</h3>
        <ul className="space-y-2 text-sm text-gray-700">
          <li className="flex items-start">
            <span className="text-blue-600 mr-2">•</span>
            S2B 계정 정보는 안전하게 암호화되어 저장됩니다.
          </li>
          <li className="flex items-start">
            <span className="text-blue-600 mr-2">•</span>
            비활성화된 계정은 자동화 실행 시 제외됩니다.
          </li>
          <li className="flex items-start">
            <span className="text-blue-600 mr-2">•</span>
            가격 인상률은 물품별로 개별 적용되며, 소수점 첫째 자리까지 설정 가능합니다.
          </li>
          <li className="flex items-start">
            <span className="text-blue-600 mr-2">•</span>
            플랜별 계정 제한: Free(1개), Standard(3개), Basic(5개), Premium(10개)
          </li>
        </ul>
      </div>
    </div>
  );
}