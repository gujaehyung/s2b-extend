'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

interface CompletionRecord {
  id: string;
  date: string;
  processedCount: number;
  timestamp: number;
}

export default function HistoryPage() {
  const { user, session, loading, signOut } = useAuth();
  const router = useRouter();
  const [history, setHistory] = useState<CompletionRecord[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (session) {
      loadHistory();
    }
  }, [session]);

  const loadHistory = async () => {
    try {
      const response = await fetch('/api/history', {
        headers: {
          'Authorization': `Bearer ${session?.access_token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setHistory(data.history || []);
      }
    } catch (error) {
      console.error('기록 로드 오류:', error);
    } finally {
      setHistoryLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const month = date.getMonth() + 1;
    const day = date.getDate();
    return `${month}월 ${day}일`;
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* 사이드바 */}
      <div className="w-64 bg-white shadow-lg flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h1 className="text-lg font-semibold text-gray-900">S2B Pro</h1>
          </div>
        </div>
        
        <nav className="space-y-2 p-4">
          <a href="/dashboard" className="flex items-center gap-3 px-3 py-2 text-gray-600 hover:text-blue-600 hover:bg-gray-50 rounded-lg transition-colors">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z"/>
            </svg>
            대시보드
          </a>
          
          <a href="/accounts" className="flex items-center gap-3 px-3 py-2 text-gray-600 hover:text-blue-600 hover:bg-gray-50 rounded-lg transition-colors">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd"/>
            </svg>
            계정 관리
          </a>
          
          <a href="/history" className="flex items-center gap-3 px-3 py-2 text-blue-600 bg-blue-50 rounded-lg font-medium">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd"/>
            </svg>
            완료작업기록
          </a>
        </nav>
      </div>

      {/* 메인 컨텐츠 */}
      <div className="flex-1 p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">완료작업기록</h1>
          
          <div className="bg-white rounded-lg shadow-sm p-6">
            {historyLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : history.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                아직 완료된 작업이 없습니다.
              </div>
            ) : (
              <div className="space-y-3">
                {history.map((record) => (
                  <div key={record.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span className="font-medium text-gray-900">
                        {formatDate(record.date)}날 {record.processedCount}개 항목 처리 완료
                      </span>
                    </div>
                    <span className="text-sm text-gray-500">
                      {new Date(record.timestamp).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}