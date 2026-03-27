'use client';

import { Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

function PaymentFailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const code = searchParams?.get('code') || '';
  const message = searchParams?.get('message') || '결제가 취소되었거나 실패했습니다.';

  const isTestPhaseUnsupported =
    code === 'UNSUPPORTED_TEST_PHASE_PAYMENT_METHOD' ||
    (typeof message === 'string' && message.includes('테스트용'));

  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-50/40 via-white to-emerald-50/35 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center bg-white/95 rounded-3xl border border-zinc-200 shadow-xl p-10">
        <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-6">
          <span className="text-4xl text-red-500">✕</span>
        </div>
        <h1 className="text-2xl font-bold text-zinc-900 mb-2">결제 실패</h1>
        <p className="text-zinc-600 mb-2">{message}</p>
        {isTestPhaseUnsupported && (
          <p className="text-teal-800 text-sm mb-4 p-3 bg-teal-50 rounded-xl border border-teal-200 text-left">
            💡 테스트 환경에서는 <strong>신용/체크카드</strong>로 결제해 주세요. 페이코·카카오페이 등 일부 간편결제는 테스트 모드에서 지원되지 않습니다.
          </p>
        )}
        {code && <p className="text-zinc-400 text-sm mb-8">오류 코드: {code}</p>}
        <div className="flex gap-4 justify-center flex-wrap">
          <button
            type="button"
            onClick={() => router.push('/pricing')}
            className="px-6 py-3 bg-gradient-to-r from-teal-600 to-emerald-600 text-white rounded-xl font-semibold shadow-md"
          >
            요금제 다시 보기
          </button>
          <button
            type="button"
            onClick={() => router.push('/dashboard')}
            className="px-6 py-3 bg-white text-zinc-800 border border-zinc-200 rounded-xl font-medium hover:bg-zinc-50"
          >
            대시보드
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PaymentFailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-b from-teal-50/40 via-white to-emerald-50/35 flex items-center justify-center p-4">
          <div className="max-w-md w-full text-center bg-white/95 rounded-3xl border border-zinc-200 p-10">
            <p className="text-zinc-700 mb-4">결제 실패 정보를 불러오는 중입니다...</p>
            <div className="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        </div>
      }
    >
      <PaymentFailContent />
    </Suspense>
  );
}
