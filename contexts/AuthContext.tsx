'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { auth, userProfiles, UserProfile } from '@/lib/supabase';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // 사용자 프로필 새로고침
  const refreshProfile = async () => {
    if (!user) return;
    
    try {
      console.log('프로필 새로고침 - 사용자 메타데이터:', user.user_metadata);
      
      const { data: profileData } = await userProfiles.get(user.id);
      
      if (profileData) {
        // DB 데이터를 기본으로 사용
        setProfile(profileData as unknown as UserProfile);
        console.log('프로필 로드 완료 (refreshProfile):', profileData);
      } else {
        // 프로필이 없으면 메타데이터 기반으로 임시 생성
        const tempProfile: UserProfile = {
          id: user.id,
          email: user.email || '',
          name: user.user_metadata?.name || user.email?.split('@')[0] || '사용자',
          plan: user.user_metadata?.plan || 'free',
          role: user.user_metadata?.role || 'user' as const,
          phone: '',
          created_at: user.created_at || new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        console.log('임시 프로필 생성 (refreshProfile):', tempProfile);
        setProfile(tempProfile);
      }
    } catch (error) {
      console.error('프로필 로드 오류:', error);
    }
  };

  // 로그아웃
  const signOut = async () => {
    try {
      await auth.signOut();
      setUser(null);
      setProfile(null);
      setSession(null);
      // 로그아웃 후 홈페이지로 리다이렉션
      window.location.href = '/';
    } catch (error) {
      console.error('로그아웃 오류:', error);
    }
  };

  useEffect(() => {
    // 초기 세션 확인은 하지 않고, onAuthStateChange에서만 처리
    console.log('AuthContext 초기화');

    // 인증 상태 변화 감지
    const { data: { subscription } } = auth.onAuthStateChange(async (event, session) => {
      console.log('인증 상태 변화:', event, session?.user?.email);
      console.log('세션 상세:', session);
      console.log('이벤트 타입:', event);
      
      // USER_UPDATED 이벤트 시 특별 처리
      if (event === 'USER_UPDATED' && session?.user) {
        console.log('사용자 정보 업데이트 감지 - 메타데이터:', session.user.user_metadata);
      }
      
      setSession(session);
      
      if (session?.user) {
        setUser(session.user);
        
        // 프로필 정보 가져오기
        try {
          console.log('프로필 로드 시도:', session.user.id);
          console.log('사용자 메타데이터:', session.user.user_metadata);
          
          const { data: profileData, error: profileError } = await userProfiles.get(session.user.id);
          console.log('프로필 로드 결과:', { profileData, profileError });
          
          if (profileData) {
            // DB 데이터를 기본으로 사용
            setProfile(profileData);
            console.log('프로필 로드 완료 (onAuthStateChange):', profileData);
          } else {
            // 프로필이 없으면 메타데이터 기반으로 임시 생성
            const tempProfile: UserProfile = {
              id: session.user.id,
              email: session.user.email || '',
              name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || '사용자',
              plan: session.user.user_metadata?.plan || 'free',
              role: session.user.user_metadata?.role || 'user' as const,
              phone: '',
              created_at: session.user.created_at || new Date().toISOString(),
              updated_at: new Date().toISOString()
            };
            console.log('임시 프로필 생성 (onAuthStateChange):', tempProfile);
            setProfile(tempProfile);
          }
        } catch (error) {
          console.error('프로필 로드 오류:', error);
        }
      } else {
        setUser(null);
        setProfile(null);
      }
      
      // loading을 false로 설정
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const value = {
    user,
    profile,
    session,
    loading,
    signOut,
    refreshProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}