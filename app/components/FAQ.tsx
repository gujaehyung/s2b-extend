'use client';

import { useState } from 'react';

const faqs = [
  {
    question: "무료 플랜으로 몇 개까지 처리할 수 있나요?",
    answer: "무료 플랜은 총 10개 물품까지 처리 가능합니다. 월별 초기화가 없으며, 10개 처리 후에는 유료 플랜으로 업그레이드하셔야 합니다. 무료체험 기간은 별도로 제공되지 않습니다."
  },
  {
    question: "자동화는 얼마나 시간이 걸리나요?",
    answer: "물품 1개당 약 6분 정도 소요됩니다. 100개 물품 기준으로 약 10시간이 걸리며, 수동 처리 대비 98% 시간을 절약할 수 있습니다."
  },
  {
    question: "어떤 작업을 자동화해주나요?",
    answer: "S2B(나라장터)에서 관리일 연장 대상 물품을 자동으로 검색하고, 설정한 인상률(최대 8%)로 가격을 수정한 후 관리일을 연장해드립니다."
  },
  {
    question: "안전한가요? 실패할 가능성은 없나요?",
    answer: "실제 S2B 시스템과 동일한 방식으로 처리하여 99.9% 성공률을 보장합니다. 각 물품별로 처리 결과를 실시간으로 확인할 수 있습니다."
  },
  {
    question: "플랜별 차이점이 무엇인가요?",
    answer: "무료(총 10개), 스탠다드(월 100개/₩19,900), 베이직(월 500개/₩29,900), 프리미엄(무제한 + 72시간 자동처리/₩39,900)로 구성되어 있습니다. 현재 프로플랜 기능에 일시적인 문제가 있어 수정 중입니다."
  },
  {
    question: "처리 중 중단해도 괜찮나요?",
    answer: "네, 언제든지 중단 가능합니다. 이미 처리된 물품은 중복 처리되지 않으며, 다음 실행 시 남은 물품부터 이어서 처리됩니다."
  },
  {
    question: "로그인 정보는 안전하게 보관되나요?",
    answer: "S2B 로그인 정보는 암호화되어 전송되며, 자동화 세션 종료 시 즉시 삭제됩니다. 고객의 S2B 개인정보나 물품 정보는 서버에 저장되지 않으며, 오직 자동화 처리 중에만 임시로 메모리에서 사용됩니다."
  },
  {
    question: "환불 정책은 어떻게 되나요?",
    answer: "모든 유료 플랜은 2일 내 100% 환불 보장입니다. 서비스에 만족하지 않으시면 언제든지 환불 요청하세요."
  }
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            자주 묻는 질문
          </h2>
          <p className="text-xl text-gray-600">
            S2B Pro 사용에 대한 궁금한 점들을 확인해보세요
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden transition-all duration-300 hover:shadow-xl"
            >
              <button
                onClick={() => toggleFAQ(index)}
                className="w-full px-6 py-6 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <h3 className="text-lg font-semibold text-gray-900 pr-4">
                  {faq.question}
                </h3>
                <div className={`flex-shrink-0 transition-transform duration-300 ${
                  openIndex === index ? 'rotate-180' : ''
                }`}>
                  <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </button>
              
              {openIndex === index && (
                <div className="px-6 pb-6">
                  <div className="border-t border-gray-200 pt-4">
                    <p className="text-gray-600 leading-relaxed">
                      {faq.answer}
                    </p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <div className="bg-blue-50 rounded-2xl p-8 border border-blue-200">
            <h3 className="text-xl font-semibold text-blue-900 mb-4">
              더 궁금한 점이 있으신가요?
            </h3>
            <p className="text-blue-700 mb-6">
              추가 문의사항이 있으시면 언제든지 연락주세요. 빠른 시간 내에 답변드리겠습니다.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="/signup"
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-semibold transition-colors"
              >
                무료로 시작하기
              </a>
              <a
                href="/signup"
                className="bg-white hover:bg-gray-50 text-blue-600 border-2 border-blue-600 px-8 py-3 rounded-xl font-semibold transition-colors"
              >
                회원가입하기
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}