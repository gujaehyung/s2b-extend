import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth-verify';
import { promises as fs } from 'fs';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    // 인증 확인
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const authResult = await verifyAuth(token);
    
    if (!authResult.valid || !authResult.user) {
      return NextResponse.json(
        { error: '유효하지 않은 토큰입니다.' },
        { status: 401 }
      );
    }

    // 사용자의 사용량 파일 경로
    const filePath = path.join(process.cwd(), 'temp', `usage_${authResult.user.id}.json`);
    
    try {
      // 파일이 존재하면 읽어서 최근 활동만 초기화
      if (require('fs').existsSync(filePath)) {
        const data = JSON.parse(require('fs').readFileSync(filePath, 'utf8'));
        data.recentActivities = [];
        require('fs').writeFileSync(filePath, JSON.stringify(data, null, 2));
      }
    } catch (error) {
      console.error('파일 처리 오류:', error);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('로그 지우기 오류:', error);
    return NextResponse.json(
      { error: '로그 지우기 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}