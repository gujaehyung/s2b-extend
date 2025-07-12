'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { userProfiles, UserProfile } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function AdminPage() {
  const { user, profile, loading, session, refreshProfile } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  // 클라이언트 마운트 확인
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    console.log('AdminPage - 상태 체크:', { 
      mounted, 
      loading, 
      hasUser: !!user, 
      hasProfile: !!profile,
      profileRole: profile?.role,
      userId: user?.id
    });
    
    if (!mounted) return; // 클라이언트 마운트 전에는 실행하지 않음
    
    if (!loading) {
      if (!user || !profile) {
        console.log('사용자 또는 프로필이 없음, 로그인 페이지로 이동');
        router.push('/login');
        return;
      }
      
      console.log('사용자 역할:', profile.role);
      
      if (profile.role !== 'admin') {
        console.log('관리자가 아님, 대시보드로 이동');
        alert('관리자 권한이 필요합니다.');
        router.push('/dashboard');
        return;
      }
      
      console.log('관리자 확인됨, 사용자 목록 로드 시작');
      loadAllUsers();
    }
  }, [mounted, user, profile, loading, router]);

  const loadAllUsers = async () => {
    try {
      console.log('사용자 목록 로드 시작');
      setIsLoading(true);
      setError(null);
      
      const { data, error } = await userProfiles.getAllUsers();
      console.log('사용자 목록 로드 결과:', { data, error });
      
      if (error) {
        console.error('API 에러:', error);
        throw error;
      }
      
      console.log('로드된 사용자 수:', data?.length || 0);
      setUsers(data || []);
    } catch (err) {
      console.error('사용자 목록 로드 오류:', err);
      setError(`사용자 목록을 불러오는데 실패했습니다: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePlanChange = async (userId: string, newPlan: string) => {
    try {
      // 본인의 플랜 변경인 경우만 새로운 API 사용
      if (userId === user?.id) {
        // AuthContext의 세션 사용
        if (!session) {
          throw new Error('세션이 없습니다.');
        }
        
        const response = await fetch('/api/user/update-plan', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`
          },
          body: JSON.stringify({
            newPlan,
            accessToken: session.access_token,
            refreshToken: session.refresh_token
          })
        });
        
        const result = await response.json();
        if (!response.ok) throw new Error(result.error);
        
        alert('플랜이 성공적으로 변경되었습니다.');
        
        // 프로필 새로고침 (requiresRefresh가 false여도 일관성을 위해 새로고침)
        console.log('플랜 변경 후 프로필 새로고침');
        await refreshProfile();
        
        // 사용자 목록도 새로고침
        await loadAllUsers();
      } else {
        // 다른 사용자의 플랜 변경은 기존 방식 (DB만 업데이트)
        const { error } = await userProfiles.updatePlan(userId, newPlan);
        if (error) throw error;
        alert('플랜이 성공적으로 변경되었습니다.');
        
        // 사용자 목록 새로고침
        await loadAllUsers();
      }
      
    } catch (err) {
      console.error('플랜 변경 오류:', err);
      alert('플랜 변경에 실패했습니다.');
    }
  };

  const handleRoleChange = async (userId: string, newRole: 'user' | 'admin') => {
    try {
      if (!session) {
        throw new Error('세션이 없습니다.');
      }

      // 새로운 API 사용 (메타데이터도 함께 업데이트)
      const response = await fetch('/api/user/update-role', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          userId,
          newRole,
          adminAccessToken: session.access_token
        })
      });
      
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      
      alert('권한이 성공적으로 변경되었습니다.');
      
      // 사용자 목록 새로고침
      await loadAllUsers();
      
    } catch (err) {
      console.error('권한 변경 오류:', err);
      alert('권한 변경에 실패했습니다.');
    }
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (!confirm(`정말로 "${userName}" 사용자를 삭제하시겠습니까?`)) {
      return;
    }
    
    try {
      const { error } = await userProfiles.deleteUser(userId);
      if (error) throw error;
      
      setUsers(users.filter(user => user.id !== userId));
      alert('사용자가 성공적으로 삭제되었습니다.');
    } catch (err) {
      console.error('사용자 삭제 오류:', err);
      alert('사용자 삭제에 실패했습니다.');
    }
  };

  // 클라이언트 마운트 전에는 로딩 화면 표시
  if (!mounted || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">로딩 중... (인증 확인)</p>
        </div>
      </div>
    );
  }

  // 관리자가 아닌 경우
  if (profile?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 text-xl">관리자 권한이 필요합니다.</p>
          <button 
            onClick={() => router.push('/dashboard')}
            className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            대시보드로 이동
          </button>
        </div>
      </div>
    );
  }

  // 사용자 데이터 로딩 중
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">사용자 목록을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 text-xl">{error}</p>
          <button 
            onClick={loadAllUsers}
            className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  const planNames = {
    free: '무료',
    standard: '스탠다드',
    basic: '베이직',
    premium: '프리미엄'
  };

  const planColors = {
    free: 'bg-gray-100 text-gray-800',
    standard: 'bg-blue-100 text-blue-800',
    basic: 'bg-green-100 text-green-800',
    premium: 'bg-purple-100 text-purple-800'
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-gray-900">관리자 대시보드</h1>
            <a 
              href="/dashboard"
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              ← 대시보드로 돌아가기
            </a>
          </div>
          <p className="mt-2 text-gray-600">
            전체 사용자: {users.length}명 | 
            관리자: {users.filter(u => u.role === 'admin').length}명 | 
            일반 사용자: {users.filter(u => u.role === 'user').length}명
          </p>
        </div>

        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    사용자 정보
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    플랜
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    권한
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    가입일
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    작업
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{user.name}</div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                        {user.company && (
                          <div className="text-sm text-gray-500">{user.company}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        value={user.plan}
                        onChange={(e) => handlePlanChange(user.id, e.target.value)}
                        className={`text-sm rounded-full px-3 py-1 font-medium ${planColors[user.plan]} border-0 focus:ring-2 focus:ring-blue-500`}
                      >
                        <option value="free">무료</option>
                        <option value="standard">스탠다드</option>
                        <option value="basic">베이직</option>
                        <option value="premium">프리미엄</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        value={user.role}
                        onChange={(e) => handleRoleChange(user.id, e.target.value as 'user' | 'admin')}
                        className={`text-sm rounded-full px-3 py-1 font-medium ${
                          user.role === 'admin' 
                            ? 'bg-red-100 text-red-800' 
                            : 'bg-gray-100 text-gray-800'
                        } border-0 focus:ring-2 focus:ring-blue-500`}
                      >
                        <option value="user">일반 사용자</option>
                        <option value="admin">관리자</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(user.created_at).toLocaleDateString('ko-KR')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleDeleteUser(user.id, user.name)}
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
        </div>

        <div className="mt-8 bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">플랜별 통계</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(planNames).map(([planKey, planName]) => {
              const count = users.filter(u => u.plan === planKey).length;
              return (
                <div key={planKey} className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-gray-900">{count}</div>
                  <div className="text-sm text-gray-600">{planName}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}