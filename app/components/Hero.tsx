'use client';

import { useState } from 'react';

export default function Hero() {
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-purple-700 to-indigo-800"></div>
      
      {/* Animated Background Elements */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-400 rounded-full mix-blend-multiply filter blur-xl animate-pulse"></div>
        <div className="absolute top-1/3 right-1/4 w-64 h-64 bg-purple-400 rounded-full mix-blend-multiply filter blur-xl animate-pulse delay-1000"></div>
        <div className="absolute bottom-1/4 left-1/3 w-64 h-64 bg-pink-400 rounded-full mix-blend-multiply filter blur-xl animate-pulse delay-2000"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Hero Text */}
          <div className="text-center lg:text-left">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight">
              S2B 관리일 연장을{' '}
              <span className="bg-gradient-to-r from-pink-400 to-yellow-400 bg-clip-text text-transparent">
                자동화
              </span>하세요
            </h1>
            
            <p className="mt-6 text-xl text-blue-100 max-w-2xl">
              복잡한 수작업 없이 클릭 한 번으로 모든 물품의 관리일을 연장하고 
              가격을 일괄 조정하세요. 시간과 비용을 절약하는 스마트한 솔루션입니다.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <a 
                href="/signup"
                className="group relative bg-white text-gray-900 px-8 py-4 rounded-xl font-semibold text-lg hover:bg-gray-50 transition-all duration-300 transform hover:scale-105 shadow-xl inline-block"
              >
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 2L3 7v11a1 1 0 001 1h12a1 1 0 001-1V7l-7-5z"/>
                  </svg>
                  무료로 시작하기
                </div>
              </a>
              
              <button 
                onClick={() => setIsVideoPlaying(true)}
                className="group relative bg-transparent border-2 border-white text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-white hover:text-gray-900 transition-all duration-300 transform hover:scale-105"
              >
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd"/>
                  </svg>
                  데모 보기
                </div>
              </button>
            </div>

            {/* Stats */}
            <div className="mt-12 grid grid-cols-3 gap-6 text-center lg:text-left">
              <div>
                <div className="text-3xl font-bold text-white">50,000+</div>
                <div className="text-blue-200 text-sm">처리된 물품</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-white">98%</div>
                <div className="text-blue-200 text-sm">시간 절약</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-white">24/7</div>
                <div className="text-blue-200 text-sm">자동 처리</div>
              </div>
            </div>
          </div>

          {/* Dashboard Preview */}
          <div className="relative">
            <div className="relative bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 overflow-hidden shadow-2xl">
              {/* Window Controls */}
              <div className="flex items-center gap-2 p-4 border-b border-white/20">
                <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                <div className="ml-4 text-white text-sm font-medium">S2B 자동화 대시보드</div>
              </div>

              {/* Dashboard Content */}
              <div className="p-6 space-y-6">
                <div className="bg-white/10 rounded-xl p-4 border border-white/10">
                  <h3 className="text-white font-semibold mb-3">관리일 연장 진행 중...</h3>
                  
                  {/* Progress Bar */}
                  <div className="relative bg-white/20 rounded-full h-3 mb-3 overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-blue-500 rounded-full transition-all duration-1000 ease-out"
                         style={{ width: '75%' }}>
                      <div className="absolute inset-0 bg-white/30 rounded-full animate-pulse"></div>
                    </div>
                  </div>
                  
                  <p className="text-blue-100 text-sm">750 / 1,000 물품 처리 완료</p>
                </div>

                {/* Recent Activity */}
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="text-white">물품번호 ABC123 처리 완료</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                    <span className="text-white">가격 인상률 8% 적용</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
                    <span className="text-white">관리일 2주 연장 완료</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Floating Elements */}
            <div className="absolute -top-4 -right-4 bg-gradient-to-r from-pink-500 to-rose-500 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-lg animate-bounce">
              실시간 처리 중
            </div>
          </div>
        </div>
      </div>

      {/* Video Modal */}
      {isVideoPlaying && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="relative bg-white rounded-2xl overflow-hidden max-w-4xl w-full max-h-[80vh]">
            <button
              onClick={() => setIsVideoPlaying(false)}
              className="absolute top-4 right-4 z-10 bg-black/50 text-white w-10 h-10 rounded-full flex items-center justify-center hover:bg-black/70 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <div className="aspect-video bg-gray-900 flex items-center justify-center">
              <div className="text-white text-center">
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd"/>
                  </svg>
                </div>
                <p className="text-lg font-medium">데모 비디오 준비 중</p>
                <p className="text-gray-400">곧 S2B 자동화 데모를 확인하실 수 있습니다</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}