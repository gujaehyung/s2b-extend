'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { 
  HomeIcon, 
  CogIcon, 
  ClockIcon, 
  DocumentTextIcon, 
  UserGroupIcon,
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  XMarkIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';

interface MenuItem {
  name: string;
  href: string;
  icon: React.ElementType;
  requiresPlan?: string[];
}

const menuItems: MenuItem[] = [
  { name: '대시보드', href: '/dashboard', icon: HomeIcon },
  { name: '일반 자동화', href: '/dashboard/automation', icon: CogIcon },
  { name: '자동 스케줄링', href: '/dashboard/scheduling', icon: ClockIcon, requiresPlan: ['basic', 'premium'] },
  { name: '실행 로그', href: '/dashboard/logs', icon: DocumentTextIcon },
  { name: '계정 관리', href: '/dashboard/accounts', icon: UserGroupIcon },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { profile, signOut } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // 관리자 체크
  const isAdmin = profile?.email === 'elwlwlwk@naver.com';

  const isMenuAccessible = (item: MenuItem) => {
    if (!item.requiresPlan) return true;
    if (!profile?.plan) return false;
    return item.requiresPlan.includes(profile.plan);
  };

  const getPlanDisplayName = (plan: string) => {
    const planNames: Record<string, string> = {
      free: 'Free',
      standard: 'Standard',
      basic: 'Basic',
      premium: 'Premium'
    };
    return planNames[plan] || plan;
  };

  const getPlanColor = (plan: string) => {
    const planColors: Record<string, string> = {
      free: 'bg-gray-100 text-gray-800',
      standard: 'bg-blue-100 text-blue-800',
      basic: 'bg-green-100 text-green-800',
      premium: 'bg-purple-100 text-purple-800'
    };
    return planColors[plan] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile sidebar toggle */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="p-2 rounded-md bg-white shadow-md hover:bg-gray-50"
        >
          {isSidebarOpen ? (
            <XMarkIcon className="h-6 w-6" />
          ) : (
            <Bars3Icon className="h-6 w-6" />
          )}
        </button>
      </div>

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-40 w-64 bg-white shadow-lg transform ${
        isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } transition-transform duration-300 ease-in-out lg:translate-x-0 lg:relative lg:transform-none`}>
        
        {/* Logo/Header */}
        <div className="p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-900">S2B Manager</h2>
          <div className="mt-2">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPlanColor(profile?.plan || 'free')}`}>
              {getPlanDisplayName(profile?.plan || 'free')} Plan
            </span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-1">
          {menuItems.map((item) => {
            const isAccessible = isMenuAccessible(item);
            const isActive = pathname === item.href;
            
            return (
              <div key={item.name} className="relative">
                {isAccessible ? (
                  <Link
                    href={item.href}
                    onClick={() => setIsSidebarOpen(false)}
                    className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                      isActive
                        ? 'bg-indigo-50 text-indigo-700'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <item.icon className={`mr-3 h-5 w-5 ${
                      isActive ? 'text-indigo-700' : 'text-gray-400'
                    }`} />
                    {item.name}
                  </Link>
                ) : (
                  <div className="flex items-center px-4 py-3 text-sm font-medium rounded-lg text-gray-400 cursor-not-allowed relative group">
                    <item.icon className="mr-3 h-5 w-5 text-gray-300" />
                    {item.name}
                    <span className="ml-auto text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded">
                      {item.requiresPlan?.[0]}+
                    </span>
                    
                    {/* Tooltip */}
                    <div className="absolute left-0 right-0 top-full mt-2 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                      <p className="font-semibold mb-1">
                        {item.requiresPlan?.[0] === 'basic' ? 'Basic' : 'Premium'} 플랜 이상에서 사용 가능
                      </p>
                      <p>업그레이드하여 더 많은 기능을 사용해보세요!</p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          
          {/* 관리자 메뉴 */}
          {isAdmin && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <p className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                관리자
              </p>
              <Link
                href="/admin"
                className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                  pathname === '/admin'
                    ? 'bg-red-50 text-red-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <ShieldCheckIcon className={`mr-3 h-5 w-5 ${
                  pathname === '/admin' ? 'text-red-700' : 'text-gray-400'
                }`} />
                관리자 페이지
              </Link>
            </div>
          )}
        </nav>

        {/* User section */}
        <div className="p-4 border-t">
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm">
              <p className="font-medium text-gray-900">{profile?.name || '사용자'}</p>
              <p className="text-gray-500">{profile?.email}</p>
            </div>
          </div>
          <button
            onClick={signOut}
            className="flex items-center justify-center w-full px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <ArrowRightOnRectangleIcon className="mr-2 h-4 w-4" />
            로그아웃
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-hidden">
        <main className="h-full">
          {children}
        </main>
      </div>

      {/* Mobile sidebar backdrop */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </div>
  );
}