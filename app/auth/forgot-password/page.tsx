'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { AlertCircle, Eye, EyeOff, Loader2 } from 'lucide-react'
import AuthPageShell from '@/app/components/auth/AuthPageShell'

export default function ForgotPasswordPage() {
  const router = useRouter()
  const [step, setStep] = useState<'email' | 'reset'>('email')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    if (!email.trim()) {
      setError('이메일을 입력해주세요.')
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('올바른 이메일 형식을 입력해주세요.')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/auth/send-password-reset-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || '인증 코드 발송에 실패했습니다.')
        return
      }
      setSuccess(data.message || '인증 코드를 발송했습니다. 이메일을 확인해주세요.')
      setStep('reset')
    } catch {
      setError('요청 처리 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    if (!code.trim() || !newPassword.trim()) {
      setError('인증 코드와 새 비밀번호를 모두 입력해주세요.')
      return
    }
    if (newPassword.length < 8 || newPassword.length > 50) {
      setError('비밀번호는 8자 이상 50자 이하여야 합니다.')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          code: code.trim(),
          newPassword,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || '비밀번호 재설정에 실패했습니다.')
        return
      }
      setSuccess(data.message || '비밀번호가 재설정되었습니다.')
      setTimeout(() => router.push('/auth/login'), 2000)
    } catch {
      setError('요청 처리 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const subtitle =
    step === 'email' ? '비밀번호를 찾을 이메일을 입력하세요' : '인증 코드와 새 비밀번호를 입력하세요'

  return (
    <AuthPageShell subtitle={subtitle}>
      {step === 'email' ? (
        <form onSubmit={handleSendCode} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-zinc-800 mb-2">
              이메일
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@example.com"
              className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
              disabled={loading}
            />
          </div>
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex gap-2">
              <AlertCircle size={20} className="text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}
          {success && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
              <p className="text-emerald-800 text-sm">{success}</p>
            </div>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full px-4 py-3 bg-gradient-to-r from-teal-600 to-emerald-600 text-white rounded-xl shadow-md shadow-teal-900/10 hover:shadow-lg font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading && <Loader2 size={20} className="animate-spin" />}
            인증 코드 발송
          </button>
        </form>
      ) : (
        <form onSubmit={handleResetPassword} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-800 mb-2">이메일</label>
            <p className="px-4 py-2 bg-zinc-100 rounded-lg text-zinc-700 text-sm border border-zinc-200">{email}</p>
          </div>
          <div>
            <label htmlFor="code" className="block text-sm font-medium text-zinc-800 mb-2">
              인증 코드
            </label>
            <input
              id="code"
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              placeholder="6자리 코드"
              className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
              disabled={loading}
            />
          </div>
          <div>
            <label htmlFor="newPassword" className="block text-sm font-medium text-zinc-800 mb-2">
              새 비밀번호
            </label>
            <div className="relative">
              <input
                id="newPassword"
                type={showPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="8자 이상"
                className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 pr-12"
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-3.5 text-zinc-400 hover:text-zinc-600 transition-colors"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex gap-2">
              <AlertCircle size={20} className="text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}
          {success && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
              <p className="text-emerald-800 text-sm">{success}</p>
            </div>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full px-4 py-3 bg-gradient-to-r from-teal-600 to-emerald-600 text-white rounded-xl shadow-md shadow-teal-900/10 hover:shadow-lg font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading && <Loader2 size={20} className="animate-spin" />}
            비밀번호 재설정
          </button>
          <button
            type="button"
            onClick={() => {
              setStep('email')
              setCode('')
              setNewPassword('')
              setError('')
              setSuccess('')
            }}
            className="w-full text-sm text-zinc-500 hover:text-zinc-700"
          >
            다른 이메일로 다시 시도
          </button>
        </form>
      )}

      <div className="mt-6 text-center border-t border-zinc-100 pt-6">
        <Link href="/auth/login" className="text-teal-600 hover:text-teal-700 font-semibold text-sm">
          ← 로그인으로 돌아가기
        </Link>
      </div>
    </AuthPageShell>
  )
}
