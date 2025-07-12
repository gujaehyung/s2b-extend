import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'No auth header' }, { status: 401 });
    }

    const accessToken = authHeader.substring(7);
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://pixpjdiytwicrrsmbcyi.supabase.co';
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBpeHBqZGl5dHdpY3Jyc21iY3lpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0Mjc1MzMsImV4cCI6MjA2NzAwMzUzM30.I12ihzcXEhGl2xvQUeJEoCeS-PAzAgfm2HJsTs9Bg7E';
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    const { data: { user }, error: userError } = await supabase.auth.getUser(accessToken);
    
    if (userError || !user) {
      return NextResponse.json({ error: 'User not found', userError }, { status: 401 });
    }

    const body = await request.json();
    
    // 프로필 생성
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .insert({
        id: user.id,
        email: user.email,
        name: body.name || '사용자',
        company: body.company || '',
        phone: body.phone || '',
        plan: body.plan || 'free',
        role: body.role || 'user',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (profileError) {
      return NextResponse.json({ error: profileError }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      profile
    });

  } catch (error) {
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}