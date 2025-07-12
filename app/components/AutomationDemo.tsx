'use client';

import { useState } from 'react';

export default function AutomationDemo() {
  const [currentStep, setCurrentStep] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [formData, setFormData] = useState({
    loginId: '',
    loginPassword: '',
    priceIncreaseRate: 8
  });

  const steps = [
    {
      number: 1,
      title: "로그인 정보 입력",
      description: "S2B 아이디와 비밀번호를 안전하게 입력하세요"
    },
    {
      number: 2,
      title: "설정 조정",
      description: "가격 인상률과 처리 옵션을 설정하세요"
    },
    {
      number: 3,
      title: "자동화 실행",
      description: "시작 버튼을 누르고 완료될 때까지 기다리세요"
    }
  ];

  const handleDemo = () => {
    if (!formData.loginId || !formData.loginPassword) {
      alert('로그인 정보를 입력해주세요.');
      return;
    }

    setIsProcessing(true);
    
    // 데모 시뮬레이션
    setTimeout(() => {
      alert('데모 자동화가 완료되었습니다! 실제 서비스에서는 S2B 시스템에 연결됩니다.');
      setIsProcessing(false);
    }, 3000);
  };

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left Side - Steps */}
          <div>
            <h2 className="text-4xl font-bold text-gray-900 mb-8">
              간단한 3단계로 완성
            </h2>

            <div className="space-y-8">
              {steps.map((step, index) => (
                <div
                  key={index}
                  className={`flex items-start gap-6 p-6 rounded-2xl transition-all duration-300 ${
                    currentStep === index
                      ? 'bg-blue-50 border-2 border-blue-200'
                      : 'hover:bg-gray-50'
                  }`}
                  onMouseEnter={() => setCurrentStep(index)}
                >
                  {/* Step Number */}
                  <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg transition-colors ${
                    currentStep === index
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}>
                    {step.number}
                  </div>

                  {/* Step Content */}
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      {step.title}
                    </h3>
                    <p className="text-gray-600 leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Benefits */}
            <div className="mt-12 p-6 bg-gradient-to-r from-green-50 to-blue-50 rounded-2xl border border-green-200">
              <h4 className="font-semibold text-gray-900 mb-3">💡 자동화의 장점</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                  </svg>
                  시간 절약: 수작업 대비 98% 시간 단축
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                  </svg>
                  정확성: 휴먼 에러 방지 및 일관된 처리
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                  </svg>
                  편의성: 24시간 언제든지 자동 처리
                </li>
              </ul>
            </div>
          </div>

          {/* Right Side - Demo Interface */}
          <div className="lg:sticky lg:top-8">
            <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
                <h3 className="text-xl font-semibold mb-2">S2B 자동화 데모</h3>
                <p className="text-blue-100 text-sm">실제 인터페이스를 체험해보세요</p>
              </div>

              {/* Form */}
              <div className="p-6 space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    S2B 아이디
                  </label>
                  <input
                    type="text"
                    value={formData.loginId}
                    onChange={(e) => setFormData({...formData, loginId: e.target.value})}
                    placeholder="S2B 아이디를 입력하세요"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    비밀번호
                  </label>
                  <input
                    type="password"
                    value={formData.loginPassword}
                    onChange={(e) => setFormData({...formData, loginPassword: e.target.value})}
                    placeholder="비밀번호를 입력하세요"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    가격 인상률 (%)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      max="10"
                      value={formData.priceIncreaseRate}
                      onChange={(e) => setFormData({...formData, priceIncreaseRate: Number(e.target.value)})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                    <div className="absolute right-4 top-3 text-gray-400 text-sm">
                      최대 8%
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    8%까지가 안정적입니다
                  </p>
                </div>

                {/* Demo Button */}
                <button
                  onClick={handleDemo}
                  disabled={isProcessing}
                  className={`w-full py-4 rounded-xl font-semibold text-lg transition-all duration-300 ${
                    isProcessing
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transform hover:scale-[1.02] shadow-lg hover:shadow-xl'
                  } text-white`}
                >
                  {isProcessing ? (
                    <div className="flex items-center justify-center gap-2">
                      <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      처리 중...
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd"/>
                      </svg>
                      데모 시작하기
                    </div>
                  )}
                </button>

                {/* Security Notice */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                  <div className="flex gap-3">
                    <svg className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
                    </svg>
                    <div>
                      <p className="text-sm font-medium text-yellow-800">보안 안내</p>
                      <p className="text-xs text-yellow-700 mt-1">
                        데모에서는 실제 S2B 시스템에 접속하지 않습니다. 입력된 정보는 저장되지 않습니다.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}