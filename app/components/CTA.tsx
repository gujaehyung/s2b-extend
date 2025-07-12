'use client';

import { useState } from 'react';

export default function CTA() {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setIsSubmitted(true);
      setTimeout(() => {
        setIsSubmitted(false);
        setEmail('');
      }, 3000);
    }
  };

  return (
    <section id="contact" className="py-20 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-purple-700 to-indigo-800"></div>
      
      {/* Animated Background Elements */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-400 rounded-full mix-blend-multiply filter blur-xl animate-pulse"></div>
        <div className="absolute top-1/3 right-1/4 w-64 h-64 bg-purple-400 rounded-full mix-blend-multiply filter blur-xl animate-pulse delay-1000"></div>
        <div className="absolute bottom-1/4 left-1/3 w-64 h-64 bg-pink-400 rounded-full mix-blend-multiply filter blur-xl animate-pulse delay-2000"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          {/* Main Headline */}
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
            지금 바로 시작하여<br />
            <span className="bg-gradient-to-r from-pink-400 to-yellow-400 bg-clip-text text-transparent">
              시간을 절약
            </span>하세요
          </h2>
          
          <p className="text-xl text-blue-100 mb-12 max-w-3xl mx-auto leading-relaxed">
            복잡한 S2B 관리 업무를 자동화하고 더 중요한 일에 집중하세요.<br />
            수천 명의 사용자가 이미 경험하고 있는 혁신적인 솔루션입니다.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16">
            <button className="group relative bg-white text-gray-900 px-10 py-5 rounded-2xl font-bold text-xl hover:bg-gray-50 transition-all duration-300 transform hover:scale-105 shadow-2xl">
              <div className="flex items-center gap-3">
                <svg className="w-6 h-6 group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 2L3 7v11a1 1 0 001 1h12a1 1 0 001-1V7l-7-5z"/>
                </svg>
                무료 체험 시작
              </div>
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-400 to-purple-400 opacity-0 group-hover:opacity-20 transition-opacity"></div>
            </button>
            
            <button className="group relative bg-transparent border-3 border-white text-white px-10 py-5 rounded-2xl font-bold text-xl hover:bg-white hover:text-gray-900 transition-all duration-300 transform hover:scale-105">
              <div className="flex items-center gap-3">
                <svg className="w-6 h-6 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                상담 신청
              </div>
            </button>
          </div>

          {/* Email Subscription */}
          <div className="max-w-md mx-auto mb-12">
            <p className="text-blue-100 mb-4">최신 업데이트와 팁을 받아보세요</p>
            <form onSubmit={handleSubmit} className="flex gap-3">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="이메일 주소를 입력하세요"
                className="flex-1 px-4 py-3 rounded-xl border-0 focus:ring-2 focus:ring-white/50 text-gray-900"
                required
              />
              <button
                type="submit"
                disabled={isSubmitted}
                className={`px-6 py-3 rounded-xl font-semibold transition-all ${
                  isSubmitted 
                    ? 'bg-green-500 text-white' 
                    : 'bg-white text-gray-900 hover:bg-gray-100'
                }`}
              >
                {isSubmitted ? '완료!' : '구독'}
              </button>
            </form>
          </div>

          {/* Trust Indicators */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold text-white mb-2">50,000+</div>
              <div className="text-blue-200 text-sm">처리된 물품</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-white mb-2">1,200+</div>
              <div className="text-blue-200 text-sm">만족한 고객</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-white mb-2">98%</div>
              <div className="text-blue-200 text-sm">고객 만족도</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-white mb-2">24/7</div>
              <div className="text-blue-200 text-sm">고객 지원</div>
            </div>
          </div>
        </div>

        {/* Bottom Features */}
        <div className="mt-20 grid md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
              <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.293l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clipRule="evenodd"/>
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">빠른 설정</h3>
            <p className="text-blue-100 text-sm">5분 내로 모든 설정을 완료하고 바로 사용 시작</p>
          </div>
          
          <div className="text-center">
            <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
              <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">안전한 처리</h3>
            <p className="text-blue-100 text-sm">은행급 보안으로 데이터를 안전하게 보호</p>
          </div>
          
          <div className="text-center">
            <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
              <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"/>
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">24/7 지원</h3>
            <p className="text-blue-100 text-sm">언제든지 전문 지원팀의 도움을 받으세요</p>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
        <svg className="w-6 h-6 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </svg>
      </div>
    </section>
  );
}