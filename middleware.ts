import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  // 미들웨어를 간소화하여 클라이언트 사이드에서 처리하도록 함
  return NextResponse.next();
}

// 미들웨어가 실행될 경로 설정
export const config = {
  matcher: []
};