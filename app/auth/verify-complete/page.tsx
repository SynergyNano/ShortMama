'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { CheckCircle, Loader2 } from 'lucide-react'

function VerifyCompleteContent() {
  const searchParams = useSearchParams()
  const token = searchParams?.get('token') ?? null

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    if (!token) {
      setStatus('error')
      setErrorMsg('유효하지 않은 링크입니다.')
      return
    }

    const doLogin = async () => {
      const res = await signIn('email-verify', {
        token,
        redirect: false,
        callbackUrl: '/dashboard',
      })

      if (res?.ok && res?.url) {
        setStatus('success')
        window.location.href = res.url
        return
      }
      setStatus('error')
      setErrorMsg(res?.error || '로그인에 실패했습니다. 로그인 페이지에서 다시 시도해주세요.')
    }

    doLogin()
  }, [token])

  if (status === 'error') {
    return (
      <div className="min-h-screen relative overflow-hidden bg-gradient-to-b from-violet-100/50 via-purple-50/30 to-white flex items-center justify-center p-4">
        <div className="w-full max-w-md text-center bg-white/95 rounded-3xl border border-zinc-200/90 shadow-xl shadow-zinc-900/[0.06] p-10">
          <p className="text-red-600 mb-6">{errorMsg}</p>
          <a
            href="/auth/login"
            className="inline-block px-6 py-3 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white rounded-xl font-semibold shadow-md shadow-violet-900/10 hover:shadow-lg transition-shadow"
          >
            로그인 페이지로 이동
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-b from-violet-100/50 via-purple-50/30 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-md text-center bg-white/95 rounded-3xl border border-zinc-200/90 shadow-xl shadow-zinc-900/[0.06] p-10">
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div className="absolute inset-0 bg-fuchsia-400 rounded-full blur-xl opacity-35 animate-pulse" />
            <CheckCircle size={80} className="text-violet-600 relative" />
          </div>
        </div>
        <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-violet-700 to-fuchsia-600 mb-3">
          인증되었습니다
        </h1>
        <p className="text-zinc-600 mb-8 flex items-center justify-center gap-2">
          <Loader2 size={20} className="animate-spin text-violet-600" />
          로그인 중입니다...
        </p>
      </div>
    </div>
  )
}

export default function VerifyCompletePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen relative overflow-hidden bg-gradient-to-b from-violet-100/50 via-purple-50/30 to-white flex items-center justify-center p-4">
          <div className="w-full max-w-md text-center bg-white/95 rounded-3xl border border-zinc-200/90 shadow-xl p-10">
            <p className="text-zinc-600 mb-4">인증 링크를 확인하는 중입니다...</p>
            <Loader2 size={24} className="animate-spin text-violet-600 mx-auto" />
          </div>
        </div>
      }
    >
      <VerifyCompleteContent />
    </Suspense>
  )
}
