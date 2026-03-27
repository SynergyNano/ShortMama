'use client'

import TossPaymentButton from '@/app/components/TossPaymentButton/TossPaymentButton'

interface SubscriptionModalProps {
  isOpen: boolean
  onClose: () => void
}

const isTestMode = typeof process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY === 'string' &&
  process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY.startsWith('test_')

const PLANS = [
  { id: 'light', name: '라이트', price: 19800, total: 20, description: '시작하기 좋은 기본 플랜' },
  { id: 'pro', name: '프로', price: 29800, total: 40, description: '가장 인기있는 플랜' },
  { id: 'pro-plus', name: '프로+', price: 39800, total: 50, description: '전문가용 플랜' },
  { id: 'ultra', name: '울트라', price: 49800, total: 100, description: '최고의 모든 기능' },
]

export default function SubscriptionModal({ isOpen, onClose }: SubscriptionModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-zinc-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white border border-zinc-200 rounded-2xl p-8 max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl shadow-zinc-900/10">
        <div className="flex justify-between items-center mb-8">
          <h3 className="text-2xl font-bold text-zinc-900">요금제 선택</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-700 text-2xl leading-none"
          >
            ✕
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {PLANS.map((plan) => (
            <div
              key={plan.id}
              className="rounded-xl p-4 border border-zinc-200 bg-zinc-50/80 hover:border-teal-300 hover:bg-teal-50/50 transition-all"
            >
              <h4 className="text-lg font-bold text-zinc-900 mb-2">{plan.name}</h4>
              <p className="text-sm text-zinc-600 mb-3">{plan.description}</p>
              <div className="mb-4">
                <p className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-teal-700 to-emerald-600">
                  ₩{plan.price.toLocaleString()}
                </p>
                <p className="text-xs text-zinc-500">/월</p>
              </div>
              <div className="bg-white border border-zinc-200 rounded-lg p-2.5 mb-4">
                <p className="text-sm text-teal-700">
                  📊 일일 사용: <span className="font-bold">{plan.total === -1 ? '무제한' : `${plan.total}회`}</span>
                </p>
                <p className="text-xs text-zinc-500 mt-1">(검색 + 다운로드 + 자막 합산)</p>
              </div>
              <TossPaymentButton
                plan={{ id: plan.id, name: plan.name, price: plan.price }}
                className="w-full py-2 rounded-lg text-sm font-semibold transition-all bg-gradient-to-r from-teal-600 to-emerald-600 text-white shadow-md shadow-teal-900/10 hover:shadow-lg"
              >
                결제하기
              </TossPaymentButton>
            </div>
          ))}
        </div>

        {isTestMode && (
          <p className="text-teal-700/90 text-sm text-center mt-4">
            💡 테스트 환경: 결제창에서 <strong>신용/체크카드</strong>를 선택해 주세요. (페이코·카카오페이 등은 테스트 미지원)
          </p>
        )}
      </div>
    </div>
  )
}
