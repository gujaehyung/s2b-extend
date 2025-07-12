'use client';

import { useState } from 'react';

export default function Pricing() {
  const [selectedPlan, setSelectedPlan] = useState('basic');

  const plans = [
    {
      id: 'free',
      name: '무료',
      price: '0',
      period: '',
      description: '개인 사용자에게 적합',
      features: [
        '총 10개 물품 처리',
        '기본 자동화 기능',
        '이메일 지원',
        '처리 이력 7일 보관'
      ],
      limitations: [
        '고급 분석 리포트',
        '우선 지원',
        '맞춤형 설정'
      ],
      buttonText: '무료 시작',
      popular: false
    },
    {
      id: 'standard',
      name: '스탠다드',
      price: '17,900',
      period: '/월',
      description: '소규모 비즈니스에 적합',
      features: [
        '월 100개 물품 처리',
        '기본 자동화 기능',
        '이메일 지원',
        '처리 이력 30일 보관'
      ],
      limitations: [
        '고급 분석 리포트',
        '우선 지원',
        '자동 스케줄링'
      ],
      buttonText: '시작하기',
      popular: false
    },
    {
      id: 'basic',
      name: '베이직',
      price: '25,900',
      period: '/월',
      description: '중소기업에게 최적화',
      features: [
        '월 500개 물품 처리',
        '최대 3개 계정 관리',
        '72시간마다 자동 실행',
        '고급 자동화 기능',
        '이메일 지원',
        '처리 이력 90일 보관',
        '상세 분석 리포트'
      ],
      limitations: [
        '우선 지원'
      ],
      buttonText: '시작하기',
      popular: true
    },
    {
      id: 'premium',
      name: '프리미엄',
      price: '39,900',
      period: '/월',
      description: '대기업을 위한 솔루션',
      features: [
        '무제한 물품 처리',
        '최대 5개 계정 관리',
        '72시간마다 자동 실행',
        '순차적 자동 처리',
        '고급 자동화 기능',
        '우선 지원 (24시간 내)',
        '상세 분석 리포트',
        '처리 이력 무제한 보관',
        'API 접근 권한'
      ],
      limitations: [],
      buttonText: '시작하기',
      popular: false
    }
  ];

  return (
    <section id="pricing" className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            합리적인 요금제
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            비즈니스 규모에 맞는 최적의 플랜을 선택하세요
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`relative bg-white rounded-2xl shadow-lg border transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 ${
                plan.popular
                  ? 'border-blue-500 scale-105 lg:scale-110'
                  : 'border-gray-200'
              }`}
            >
              {/* Popular Badge */}
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-full text-sm font-semibold">
                    가장 인기
                  </div>
                </div>
              )}

              <div className="p-8">
                {/* Plan Header */}
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    {plan.name}
                  </h3>
                  <p className="text-gray-600 text-sm mb-4">
                    {plan.description}
                  </p>
                  
                  {/* Price */}
                  <div className="flex items-baseline justify-center gap-1">
                    {plan.price !== '맞춤형' ? (
                      <>
                        <span className="text-sm text-gray-500">₩</span>
                        <span className="text-5xl font-bold text-gray-900">
                          {plan.price.replace(',', ',')}
                        </span>
                        <span className="text-gray-500">{plan.period}</span>
                      </>
                    ) : (
                      <span className="text-3xl font-bold text-gray-900">
                        {plan.price}
                      </span>
                    )}
                  </div>
                </div>

                {/* Features */}
                <div className="space-y-4 mb-8">
                  {plan.features.map((feature, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                      </svg>
                      <span className="text-gray-700 text-sm">{feature}</span>
                    </div>
                  ))}
                  
                  {/* Limitations */}
                  {plan.limitations.map((limitation, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"/>
                      </svg>
                      <span className="text-gray-400 text-sm line-through">{limitation}</span>
                    </div>
                  ))}
                </div>

                {/* CTA Button */}
                <a
                  href={`/signup?plan=${plan.id}`}
                  className={`w-full py-4 rounded-xl font-semibold text-lg transition-all duration-300 block text-center ${
                    plan.popular
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-900 border-2 border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {plan.buttonText}
                </a>
              </div>
            </div>
          ))}
        </div>

        {/* FAQ Section */}
        <div className="mt-20">
          <h3 className="text-2xl font-bold text-gray-900 text-center mb-12">
            자주 묻는 질문
          </h3>
          
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h4 className="font-semibold text-gray-900 mb-3">
                Q. 무료 플랜으로 어떤 기능을 사용할 수 있나요?
              </h4>
              <p className="text-gray-600 text-sm">
                무료 플랜으로 총 10개 물품까지 자동화 처리가 가능합니다. 별도의 체험기간은 없으며, 신용카드 등록 없이 바로 시작할 수 있습니다.
              </p>
            </div>
            
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h4 className="font-semibold text-gray-900 mb-3">
                Q. 언제든지 플랜을 변경할 수 있나요?
              </h4>
              <p className="text-gray-600 text-sm">
                네, 언제든지 플랜을 업그레이드하거나 다운그레이드할 수 있습니다. 변경사항은 다음 청구 주기부터 적용됩니다.
              </p>
            </div>
            
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h4 className="font-semibold text-gray-900 mb-3">
                Q. 개인정보와 데이터 보안은 어떻게 보장되나요?
              </h4>
              <p className="text-gray-600 text-sm">
                S2B 로그인 정보는 SSL 암호화되어 전송되며, 자동화 완료 후 즉시 삭제됩니다. 고객의 물품정보나 개인정보는 서버에 저장되지 않고 오직 자동화 처리 중에만 임시 사용됩니다.
              </p>
            </div>
            
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h4 className="font-semibold text-gray-900 mb-3">
                Q. 기술 지원은 어떻게 받을 수 있나요?
              </h4>
              <p className="text-gray-600 text-sm">
                이메일, 채팅, 전화를 통해 지원받으실 수 있습니다. 프로 플랜 이상에서는 24시간 내 우선 응답을 제공합니다.
              </p>
            </div>
          </div>
        </div>

        {/* Money Back Guarantee */}
        <div className="mt-16 text-center">
          <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-2xl p-8 border border-green-200 max-w-4xl mx-auto">
            <div className="flex items-center justify-center gap-3 mb-4">
              <svg className="w-8 h-8 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
              </svg>
              <h4 className="text-xl font-bold text-gray-900">
                2일 무조건 환불 보장
              </h4>
            </div>
            <p className="text-gray-600 max-w-2xl mx-auto">
              서비스에 만족하지 않으시면 2일 이내 100% 환불해드립니다. 
              별도의 수수료나 위약금은 없습니다.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}