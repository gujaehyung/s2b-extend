import { createClient as createSupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://pixpjdiytwicrrsmbcyi.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBpeHBqZGl5dHdpY3Jyc21iY3lpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0Mjc1MzMsImV4cCI6MjA2NzAwMzUzM30.I12ihzcXEhGl2xvQUeJEoCeS-PAzAgfm2HJsTs9Bg7E'

// 싱글톤 인스턴스
let supabaseInstance: ReturnType<typeof createSupabaseClient> | null = null

// 브라우저 클라이언트 생성 함수
export function createSupabaseClient() {
  if (!supabaseInstance) {
    console.log('Supabase URL:', supabaseUrl);
    console.log('Supabase Key exists:', !!supabaseAnonKey);
    
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('Supabase 환경변수가 없습니다!');
    }
    
    supabaseInstance = createSupabaseClient(
      supabaseUrl,
      supabaseAnonKey
    )
  }
  return supabaseInstance
}

// 기본 export는 함수 호출 결과로 변경
export const supabase = createSupabaseClient()

// 타입 정의
export interface UserProfile {
  id: string
  email: string
  name: string
  company?: string
  phone: string
  plan: 'free' | 'standard' | 'basic' | 'premium'
  role: 'user' | 'admin'
  created_at: string
  updated_at: string
}

export interface S2BAccount {
  id: string
  user_id: string
  account_name: string
  s2b_login_id: string
  s2b_password: string
  price_increase_rate: number
  is_default: boolean
  is_active: boolean
  created_at: string
  updated_at: string
  last_run_at?: string | null
}

// 인증 관련 헬퍼 함수들
export const auth = {
  // 회원가입
  signUp: async (email: string, password: string, userData: {
    name: string
    company?: string
    phone: string
    plan: string
    role?: string
  }) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: userData
      }
    })
    return { data, error }
  },

  // 로그인
  signIn: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    return { data, error }
  },

  // 로그아웃
  signOut: async () => {
    const { error } = await supabase.auth.signOut()
    return { error }
  },

  // 현재 사용자 가져오기
  getUser: async () => {
    const { data: { user }, error } = await supabase.auth.getUser()
    return { user, error }
  },

  // 인증 상태 변화 감지
  onAuthStateChange: (callback: (event: string, session: any) => void) => {
    return supabase.auth.onAuthStateChange(callback)
  },

  // 구글 로그인
  signInWithGoogle: async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    })
    return { data, error }
  }
}

// 사용자 프로필 관련 함수들
export const userProfiles = {
  // 프로필 생성/업데이트
  upsert: async (profile: Partial<UserProfile>) => {
    const { data, error } = await supabase
      .from('user_profiles')
      .upsert(profile)
      .select()
    return { data, error }
  },

  // 프로필 가져오기
  get: async (userId: string) => {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle()  // single() 대신 maybeSingle() 사용
    return { data, error }
  },

  // 플랜 업데이트
  updatePlan: async (userId: string, plan: string) => {
    const { data, error } = await supabase
      .from('user_profiles')
      .update({ plan, updated_at: new Date().toISOString() })
      .eq('id', userId)
    return { data, error }
  },

  // 모든 사용자 목록 가져오기 (관리자용)
  getAllUsers: async () => {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .order('created_at', { ascending: false })
    return { data, error }
  },

  // 사용자 역할 업데이트 (관리자용)
  updateRole: async (userId: string, role: 'user' | 'admin') => {
    const { data, error } = await supabase
      .from('user_profiles')
      .update({ role, updated_at: new Date().toISOString() })
      .eq('id', userId)
    return { data, error }
  },

  // 사용자 삭제 (관리자용)
  deleteUser: async (userId: string) => {
    const { data, error } = await supabase
      .from('user_profiles')
      .delete()
      .eq('id', userId)
    return { data, error }
  }
}

// S2B 계정 관리 함수들
export const s2bAccounts = {
  // 사용자의 모든 S2B 계정 가져오기
  getAll: async (userId: string) => {
    const { data, error } = await supabase
      .from('s2b_accounts')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false })
    return { data, error }
  },

  // 사용자의 모든 S2B 계정 가져오기 (비활성 포함)
  getAllIncludingInactive: async (userId: string) => {
    const { data, error } = await supabase
      .from('s2b_accounts')
      .select('*')
      .eq('user_id', userId)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false })
    return { data, error }
  },

  // 기본 S2B 계정 가져오기
  getDefault: async (userId: string) => {
    const { data, error } = await supabase
      .from('s2b_accounts')
      .select('*')
      .eq('user_id', userId)
      .eq('is_default', true)
      .eq('is_active', true)
      .single()
    return { data, error }
  },

  // S2B 계정 생성
  create: async (account: Omit<S2BAccount, 'id' | 'created_at' | 'updated_at'>) => {
    // 기본 계정으로 설정하는 경우, 기존 기본 계정 해제
    if (account.is_default) {
      await supabase
        .from('s2b_accounts')
        .update({ is_default: false, updated_at: new Date().toISOString() })
        .eq('user_id', account.user_id)
        .eq('is_default', true)
    }

    const { data, error } = await supabase
      .from('s2b_accounts')
      .insert({
        ...account,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
    return { data, error }
  },

  // S2B 계정 업데이트
  update: async (accountId: string, updates: Partial<S2BAccount>) => {
    // 기본 계정으로 설정하는 경우, 기존 기본 계정 해제
    if (updates.is_default) {
      const { data: currentAccount } = await supabase
        .from('s2b_accounts')
        .select('user_id')
        .eq('id', accountId)
        .single()
      
      if (currentAccount) {
        await supabase
          .from('s2b_accounts')
          .update({ is_default: false, updated_at: new Date().toISOString() })
          .eq('user_id', currentAccount.user_id)
          .eq('is_default', true)
          .neq('id', accountId)
      }
    }

    const { data, error } = await supabase
      .from('s2b_accounts')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', accountId)
      .select()
    return { data, error }
  },

  // S2B 계정 삭제 (실제로는 비활성화)
  delete: async (accountId: string) => {
    const { data, error } = await supabase
      .from('s2b_accounts')
      .update({ 
        is_active: false, 
        is_default: false,
        updated_at: new Date().toISOString() 
      })
      .eq('id', accountId)
    return { data, error }
  }
}