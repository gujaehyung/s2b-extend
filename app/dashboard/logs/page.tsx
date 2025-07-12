'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
// UsageTracker import 제거
import { 
  DocumentTextIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  InformationCircleIcon,
  ArrowPathIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';

interface LogEntry {
  id: number;
  action: string;
  items: number;
  time: string;
  status: 'success' | 'error' | 'info';
  type: 'manual' | 'scheduled';
  details?: string;
}

export default function LogsPage() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  
  // 필터 상태
  const [filters, setFilters] = useState({
    type: 'all', // all, manual, scheduled
    status: 'all', // all, success, error, info
    search: '',
    dateRange: 'all' // all, today, week, month
  });

  const [currentPage, setCurrentPage] = useState(1);
  const logsPerPage = 20;

  useEffect(() => {
    if (user?.id) {
      loadLogs();
    }
  }, [user?.id]);

  useEffect(() => {
    applyFilters();
  }, [logs, filters]);

  const loadLogs = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      // API에서 활동 내역 가져오기
      const response = await fetch(`/api/dashboard/activities?userId=${user.id}`);
      const data = await response.json();
      
      if (data.success) {
        // API 응답을 로그 형식으로 변환
        const formattedLogs: LogEntry[] = data.activities.map((activity: any) => ({
          id: activity.id,
          action: activity.action,
          items: activity.items || 0,
          time: activity.time,
          status: activity.status || 'info',
          type: activity.type || (activity.action.includes('자동') || activity.action.includes('스케줄') ? 'scheduled' : 'manual'),
          details: activity.details
        }));

        // 최신순으로 정렬
        formattedLogs.sort((a, b) => b.id - a.id);
        setLogs(formattedLogs);
      } else {
        console.error('로그 로드 실패:', data.error);
      }
    } catch (error) {
      console.error('로그 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...logs];

    // 타입 필터
    if (filters.type !== 'all') {
      filtered = filtered.filter(log => log.type === filters.type);
    }

    // 상태 필터
    if (filters.status !== 'all') {
      filtered = filtered.filter(log => log.status === filters.status);
    }

    // 검색 필터
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(log => 
        log.action.toLowerCase().includes(searchLower) ||
        (log.details && log.details.toLowerCase().includes(searchLower))
      );
    }

    // 날짜 필터
    if (filters.dateRange !== 'all') {
      const now = new Date();
      const cutoffDate = new Date();
      
      switch (filters.dateRange) {
        case 'today':
          cutoffDate.setDate(now.getDate() - 1);
          break;
        case 'week':
          cutoffDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          cutoffDate.setMonth(now.getMonth() - 1);
          break;
      }
      
      filtered = filtered.filter(log => {
        const logDate = new Date(log.id);
        return logDate >= cutoffDate;
      });
    }

    setFilteredLogs(filtered);
    setCurrentPage(1); // 필터 변경 시 첫 페이지로
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'error':
        return <ExclamationCircleIcon className="h-5 w-5 text-red-500" />;
      default:
        return <InformationCircleIcon className="h-5 w-5 text-blue-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      success: 'bg-green-100 text-green-800',
      error: 'bg-red-100 text-red-800',
      info: 'bg-blue-100 text-blue-800'
    };
    
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${styles[status as keyof typeof styles] || styles.info}`}>
        {status === 'success' ? '성공' : status === 'error' ? '실패' : '정보'}
      </span>
    );
  };

  const getTypeBadge = (type: string) => {
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
        type === 'scheduled' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'
      }`}>
        {type === 'scheduled' ? '자동' : '수동'}
      </span>
    );
  };

  // 페이지네이션 계산
  const indexOfLastLog = currentPage * logsPerPage;
  const indexOfFirstLog = indexOfLastLog - logsPerPage;
  const currentLogs = filteredLogs.slice(indexOfFirstLog, indexOfLastLog);
  const totalPages = Math.ceil(filteredLogs.length / logsPerPage);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <DocumentTextIcon className="h-8 w-8 mr-3 text-indigo-600" />
            실행 로그
          </h1>
          
          <button
            onClick={loadLogs}
            className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <ArrowPathIcon className="h-4 w-4 mr-2" />
            새로고침
          </button>
        </div>

        {/* 필터 섹션 */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* 검색 */}
            <div className="relative">
              <input
                type="text"
                placeholder="로그 검색..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
              <MagnifyingGlassIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            </div>

            {/* 타입 필터 */}
            <select
              value={filters.type}
              onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">모든 타입</option>
              <option value="manual">수동 실행</option>
              <option value="scheduled">자동 실행</option>
            </select>

            {/* 상태 필터 */}
            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">모든 상태</option>
              <option value="success">성공</option>
              <option value="error">실패</option>
              <option value="info">정보</option>
            </select>

            {/* 날짜 필터 */}
            <select
              value={filters.dateRange}
              onChange={(e) => setFilters(prev => ({ ...prev, dateRange: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">전체 기간</option>
              <option value="today">오늘</option>
              <option value="week">최근 7일</option>
              <option value="month">최근 30일</option>
            </select>
          </div>
          
          <div className="mt-3 text-sm text-gray-600">
            총 {filteredLogs.length}개의 로그가 있습니다.
          </div>
        </div>

        {/* 로그 테이블 */}
        <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
          <table className="min-w-full divide-y divide-gray-300">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  시간
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  작업
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  타입
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  상태
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  처리 개수
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {currentLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-sm text-gray-500">
                    로그가 없습니다.
                  </td>
                </tr>
              ) : (
                currentLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex items-center">
                        <CalendarIcon className="h-4 w-4 text-gray-400 mr-2" />
                        {log.time}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <div className="flex items-center">
                        {getStatusIcon(log.status)}
                        <span className="ml-2">{log.action}</span>
                      </div>
                      {log.details && (
                        <p className="text-xs text-gray-500 mt-1">{log.details}</p>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getTypeBadge(log.type)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(log.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {log.items > 0 ? `${log.items}개` : '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* 페이지네이션 */}
        {totalPages > 1 && (
          <div className="mt-6 flex items-center justify-between">
            <div className="text-sm text-gray-700">
              전체 {filteredLogs.length}개 중 {indexOfFirstLog + 1}-{Math.min(indexOfLastLog, filteredLogs.length)}개 표시
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className={`px-3 py-1 text-sm font-medium rounded-lg ${
                  currentPage === 1
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                이전
              </button>
              
              <span className="text-sm text-gray-700">
                {currentPage} / {totalPages}
              </span>
              
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className={`px-3 py-1 text-sm font-medium rounded-lg ${
                  currentPage === totalPages
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                다음
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}