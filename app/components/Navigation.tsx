'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export default function Navigation() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, profile, signOut } = useAuth();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 100);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      setIsMobileMenuOpen(false);
    }
  };

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      isScrolled 
        ? 'bg-white/95 backdrop-blur-lg border-b border-gray-200 shadow-sm' 
        : 'bg-transparent'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z"/>
              </svg>
            </div>
            <span className={`text-xl font-bold ${isScrolled ? 'text-gray-900' : 'text-white'}`}>
              S2B Pro
            </span>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-8">
            <button 
              onClick={() => scrollToSection('features')}
              className={`font-medium transition-colors ${
                isScrolled ? 'text-gray-600 hover:text-blue-600' : 'text-white/90 hover:text-white'
              }`}
            >
              기능
            </button>
            <button 
              onClick={() => scrollToSection('pricing')}
              className={`font-medium transition-colors ${
                isScrolled ? 'text-gray-600 hover:text-blue-600' : 'text-white/90 hover:text-white'
              }`}
            >
              요금제
            </button>
            <button 
              onClick={() => scrollToSection('contact')}
              className={`font-medium transition-colors ${
                isScrolled ? 'text-gray-600 hover:text-blue-600' : 'text-white/90 hover:text-white'
              }`}
            >
              문의
            </button>
            
            <div className="flex items-center gap-3">
              {user ? (
                <>
                  <a 
                    href="/dashboard"
                    className={`font-medium transition-colors ${
                      isScrolled ? 'text-gray-600 hover:text-blue-600' : 'text-white/90 hover:text-white'
                    }`}
                  >
                    대시보드
                  </a>
                  <a 
                    href="/accounts"
                    className={`font-medium transition-colors ${
                      isScrolled ? 'text-gray-600 hover:text-blue-600' : 'text-white/90 hover:text-white'
                    }`}
                  >
                    계정 관리
                  </a>
                  {profile?.role === 'admin' && (
                    <a 
                      href="/admin"
                      className={`font-medium transition-colors ${
                        isScrolled ? 'text-red-600 hover:text-red-700' : 'text-red-200 hover:text-white'
                      }`}
                    >
                      관리자
                    </a>
                  )}
                  <button
                    onClick={signOut}
                    className={`font-medium transition-colors ${
                      isScrolled ? 'text-gray-600 hover:text-blue-600' : 'text-white/90 hover:text-white'
                    }`}
                  >
                    로그아웃
                  </button>
                </>
              ) : (
                <>
                  <a 
                    href="/login"
                    className={`font-medium transition-colors ${
                      isScrolled ? 'text-gray-600 hover:text-blue-600' : 'text-white/90 hover:text-white'
                    }`}
                  >
                    로그인
                  </a>
                  <a 
                    href="/signup"
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors inline-block"
                  >
                    회원가입
                  </a>
                </>
              )}
            </div>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className={`md:hidden p-2 rounded-lg transition-colors ${
              isScrolled ? 'text-gray-600 hover:bg-gray-100' : 'text-white hover:bg-white/10'
            }`}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isMobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-200 shadow-lg">
            <div className="px-2 pt-2 pb-3 space-y-1">
              <button
                onClick={() => scrollToSection('features')}
                className="block w-full text-left px-3 py-2 text-gray-600 hover:text-blue-600 hover:bg-gray-50 rounded-md"
              >
                기능
              </button>
              <button
                onClick={() => scrollToSection('pricing')}
                className="block w-full text-left px-3 py-2 text-gray-600 hover:text-blue-600 hover:bg-gray-50 rounded-md"
              >
                요금제
              </button>
              <button
                onClick={() => scrollToSection('contact')}
                className="block w-full text-left px-3 py-2 text-gray-600 hover:text-blue-600 hover:bg-gray-50 rounded-md"
              >
                문의
              </button>
              {user ? (
                <>
                  <a 
                    href="/dashboard"
                    className="block w-full text-left px-3 py-2 text-gray-600 hover:text-blue-600 hover:bg-gray-50 rounded-md"
                  >
                    대시보드
                  </a>
                  <a 
                    href="/accounts"
                    className="block w-full text-left px-3 py-2 text-gray-600 hover:text-blue-600 hover:bg-gray-50 rounded-md"
                  >
                    계정 관리
                  </a>
                  {profile?.role === 'admin' && (
                    <a 
                      href="/admin"
                      className="block w-full text-left px-3 py-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md"
                    >
                      관리자
                    </a>
                  )}
                  <button
                    onClick={signOut}
                    className="block w-full text-left px-3 py-2 text-gray-600 hover:text-blue-600 hover:bg-gray-50 rounded-md"
                  >
                    로그아웃
                  </button>
                </>
              ) : (
                <>
                  <a 
                    href="/login"
                    className="block w-full text-left px-3 py-2 text-gray-600 hover:text-blue-600 hover:bg-gray-50 rounded-md"
                  >
                    로그인
                  </a>
                  <a 
                    href="/signup"
                    className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors inline-block text-center"
                  >
                    회원가입
                  </a>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}