import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { updateSession } from '@/utils/supabase/middleware';

export async function middleware(request: NextRequest) {
  // 보호된 경로 정의
  const protectedPaths = ['/dashboard', '/admin', '/accounts'];
  const authPaths = ['/login', '/signup'];
  const pathname = request.nextUrl.pathname;
  
  const isProtectedPath = protectedPaths.some(path => pathname.startsWith(path));
  const isAuthPath = authPaths.includes(pathname);

  // 세션 업데이트
  const { supabaseResponse, user, error } = await updateSession(request);

  if (error) {
    console.error('미들웨어 세션 확인 오류:', error);
  }

  // 보호된 경로에 로그인하지 않은 사용자가 접근할 경우
  if (isProtectedPath && !user) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  // 로그인한 사용자가 로그인/회원가입 페이지 접근 시
  if (isAuthPath && user) {
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

// 미들웨어가 실행될 경로 설정
export const config = {
  matcher: [
    '/dashboard/:path*',
    '/admin/:path*',
    '/accounts/:path*',
    '/login',
    '/signup'
  ]
};