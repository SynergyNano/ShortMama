'use client'

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
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
  const [mounted, setMounted] = useState(false)
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!isOpen) return

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCloseRef.current()
    }

    document.addEventListener('keydown', onKeyDown)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = prevOverflow
    }
  }, [isOpen])

  if (!isOpen || !mounted) return null

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="subscription-modal-title"
      className="fixed inset-0 z-[10050] flex items-center justify-center bg-zinc-900/40 p-4 backdrop-blur-sm"
      onClick={() => onCloseRef.current()}
    >
      <div
        className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl border border-zinc-200 bg-white p-8 shadow-2xl shadow-zinc-900/10"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-8 flex items-center justify-between">
          <h3 id="subscription-modal-title" className="text-2xl font-bold text-zinc-900">
            요금제 선택
          </h3>
          <button
            type="button"
            onClick={() => onCloseRef.current()}
            className="text-2xl leading-none text-zinc-400 hover:text-zinc-700"
            aria-label="닫기"
          >
            ✕
          </button>
        </div>

        <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {PLANS.map((plan) => (
            <div
              key={plan.id}
              className="rounded-xl border border-zinc-200 bg-zinc-50/80 p-4 transition-all hover:border-violet-300/80 hover:bg-violet-50/40"
            >
              <h4 className="mb-2 text-lg font-bold text-zinc-900">{plan.name}</h4>
              <p className="mb-3 text-sm text-zinc-600">{plan.description}</p>
              <div className="mb-4">
                <p className="bg-gradient-to-r from-violet-600 to-violet-700 bg-clip-text text-2xl font-bold text-transparent">
                  ₩{plan.price.toLocaleString()}
                </p>
                <p className="text-xs text-zinc-500">/월</p>
              </div>
              <div className="mb-4 rounded-lg border border-zinc-200 bg-white p-2.5">
                <p className="text-sm text-violet-700/95">
                  📊 일일 사용: <span className="font-bold">{plan.total === -1 ? '무제한' : `${plan.total}회`}</span>
                </p>
                <p className="mt-1 text-xs text-zinc-500">(검색 + 다운로드 + 자막 합산)</p>
              </div>
              <TossPaymentButton
                plan={{ id: plan.id, name: plan.name, price: plan.price }}
                className="w-full rounded-lg bg-gradient-to-r from-violet-500 to-violet-600 py-2 text-sm font-semibold text-white shadow-md shadow-violet-900/10 transition-all hover:shadow-lg"
              >
                결제하기
              </TossPaymentButton>
            </div>
          ))}
        </div>

        {isTestMode && (
          <p className="mt-4 text-center text-sm text-violet-700/85">
            💡 테스트 환경: 결제창에서 <strong>신용/체크카드</strong>를 선택해 주세요. (페이코·카카오페이 등은 테스트 미지원)
          </p>
        )}
      </div>
    </div>,
    document.body,
  )
}
