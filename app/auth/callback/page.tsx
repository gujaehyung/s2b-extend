'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseClient } from '@/lib/supabase';

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const handleCallback = async () => {
      const supabase = createSupabaseClient();
      
      // URL에서 코드 추출 및 세션 교환
      const { error } = await supabase.auth.exchangeCodeForSession(window.location.href);
      
      if (error) {
        console.error('OAuth 콜백 오류:', error);
        router.push('/login');
        return;
      }

      // 로그인 성공 - 대시보드로 이동
      router.push('/dashboard');
    };

    handleCallback();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">로그인 처리 중...</p>
      </div>
    </div>
  );
}