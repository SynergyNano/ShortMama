'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { signupSchema, infoSchema, type SignupFormData } from '@/lib/validations/auth'
import PasswordStrengthMeter from './PasswordStrengthMeter'
import { AlertCircle, Eye, EyeOff, Loader2, ExternalLink } from 'lucide-react'

type FormStep = 'info' | 'consent' | 'loading'

interface SignupFormProps {
  onSuccess?: () => void
}

export default function SignupForm({ onSuccess }: SignupFormProps) {
  const router = useRouter()
  const [step, setStep] = useState<FormStep>('info')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>('')

  // 폼 데이터
  const [formData, setFormData] = useState<Partial<SignupFormData>>({
    name: '',
    email: '',
    phone: '',
    password: '',
    passwordConfirm: '',
    marketingConsent: false,
    termsConsent: false,
    privacyConsent: false,
    ageConsent: false,
  })

  const [showPassword, setShowPassword] = useState(false)
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({})

  // 이메일 인증
  const [emailVerified, setEmailVerified] = useState(false)
  const [emailVerificationToken, setEmailVerificationToken] = useState<string | null>(null)
  const [verificationCode, setVerificationCode] = useState('')
  const [sendCodeStatus, setSendCodeStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [verifyCodeStatus, setVerifyCodeStatus] = useState<'idle' | 'verifying' | 'success' | 'error'>('idle')

  // 인증 코드 발송
  const handleSendCode = async () => {
    const email = (formData.email || '').trim()
    if (!email) {
      setFieldErrors({ email: ['이메일을 입력해주세요'] })
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setFieldErrors({ email: ['올바른 이메일 형식이 아닙니다'] })
      return
    }
    setSendCodeStatus('sending')
    setFieldErrors({})
    try {
      const res = await fetch('/api/auth/send-verification-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || '발송 실패')
      setSendCodeStatus('sent')
    } catch (err) {
      setSendCodeStatus('error')
      setFieldErrors({ email: [err instanceof Error ? err.message : '발송 실패'] })
    }
  }

  // 인증 코드 검증
  const handleVerifyCode = async () => {
    const email = (formData.email || '').trim()
    if (!email || !verificationCode.trim()) {
      setFieldErrors({ verificationCode: ['인증 코드를 입력해주세요'] })
      return
    }
    setVerifyCodeStatus('verifying')
    setFieldErrors({})
    try {
      const res = await fetch('/api/auth/verify-email-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code: verificationCode.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || '인증 실패')
      setEmailVerified(true)
      setEmailVerificationToken(data.emailVerificationToken)
      setVerifyCodeStatus('success')
    } catch (err) {
      setVerifyCodeStatus('error')
      setFieldErrors({ verificationCode: [err instanceof Error ? err.message : '인증 실패'] })
    }
  }

  // 다음 단계로 이동
  const goToNextStep = async () => {
    setError('')
    setFieldErrors({})

    if (step === 'info') {
      if (!emailVerified || !emailVerificationToken) {
        setFieldErrors({ email: ['이메일 인증을 완료해주세요'] })
        return
      }
      const result = infoSchema.safeParse({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        passwordConfirm: formData.passwordConfirm,
      })
      if (!result.success) {
        setFieldErrors(result.error.flatten().fieldErrors as any)
        return
      }
      setStep('consent')
    }
  }

  // 이전 단계로 이동
  const goToPreviousStep = () => {
    if (step === 'consent') setStep('info')
  }

  // 회원가입 제출
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setFieldErrors({})

    // 전체 폼 검증
    const result = signupSchema.safeParse(formData)

    if (!result.success) {
      setFieldErrors(result.error.flatten().fieldErrors as any)
      return
    }

    setLoading(true)
    setStep('loading')

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...result.data,
          emailVerificationToken: emailVerificationToken,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || '회원가입 실패')
      }

      // 자동 로그인 후 대시보드로
      if (data.loginToken) {
        router.push(`/auth/verify-complete?token=${data.loginToken}`)
      } else {
        router.push('/auth/login')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '요청 처리 중 오류가 발생했습니다')
      setStep('consent')
    } finally {
      setLoading(false)
    }
  }

  // Step 1: 기본 정보 입력
  if (step === 'info') {
    return (
      <form onSubmit={(e) => { e.preventDefault(); }} className="space-y-4">
        {/* 이름 */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-zinc-800 mb-2">
            이름 <span className="text-red-500">*</span>
          </label>
          <p className="text-zinc-500 text-xs mb-1.5">2~50자, 한글 또는 영문 포함</p>
          <input
            id="name"
            type="text"
            value={formData.name || ''}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="예: 홍길동"
            maxLength={50}
            className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all"
          />
          {fieldErrors.name && (
            <p className="text-red-500 text-sm mt-1">{fieldErrors.name[0]}</p>
          )}
        </div>

        {/* 이메일 + 인증하기 */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-zinc-800 mb-2">
            이메일 <span className="text-red-500">*</span>
          </label>
          <div className="flex gap-2">
            <input
              id="email"
              type="email"
              value={formData.email || ''}
              onChange={(e) => {
                setFormData({
                  ...formData,
                  email: e.target.value,
                  phone: '',
                  password: '',
                  passwordConfirm: '',
                })
                setEmailVerified(false)
                setEmailVerificationToken(null)
                setVerificationCode('')
                setSendCodeStatus('idle')
                setVerifyCodeStatus('idle')
              }}
              placeholder="example@example.com"
              disabled={emailVerified}
              className="flex-1 px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
            />
            <button
              type="button"
              onClick={handleSendCode}
              disabled={emailVerified || sendCodeStatus === 'sending'}
              className="px-4 py-3 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white rounded-lg font-semibold shadow-md shadow-violet-900/10 hover:shadow-lg hover:shadow-violet-900/15 transition-all disabled:opacity-50 whitespace-nowrap"
            >
              {sendCodeStatus === 'sending' && <Loader2 size={18} className="animate-spin inline mr-1" />}
              {emailVerified ? '인증완료' : sendCodeStatus === 'sent' ? '재발송' : '인증하기'}
            </button>
          </div>
          {fieldErrors.email && (
            <p className="text-red-500 text-sm mt-1">{fieldErrors.email[0]}</p>
          )}
          {sendCodeStatus === 'sent' && !emailVerified && (
            <div className="mt-3 space-y-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="6자리 인증 코드"
                  maxLength={6}
                  className="flex-1 px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-violet-500 text-center tracking-widest"
                />
                <button
                  type="button"
                  onClick={handleVerifyCode}
                  disabled={verifyCodeStatus === 'verifying' || verificationCode.length !== 6}
                  className="px-4 py-2 bg-zinc-100 text-zinc-800 rounded-lg font-medium hover:bg-zinc-200 disabled:opacity-50"
                >
                  {verifyCodeStatus === 'verifying' && <Loader2 size={16} className="animate-spin inline" />}
                  {verifyCodeStatus === 'success' ? '✓' : '확인'}
                </button>
              </div>
              {fieldErrors.verificationCode && (
                <p className="text-red-500 text-sm">{fieldErrors.verificationCode[0]}</p>
              )}
              {verifyCodeStatus === 'success' && (
                <p className="text-violet-600 text-sm">이메일 인증이 완료되었습니다.</p>
              )}
            </div>
          )}
          {emailVerified && (
            <p className="text-violet-600 text-sm mt-1 flex items-center gap-1">
              <span>✓</span> 이메일 인증이 완료되었습니다.
            </p>
          )}
        </div>

        {/* 핸드폰·비밀번호: 이메일 인증 완료 후에만 입력 가능 */}
        {!emailVerified ? (
          <div className="rounded-xl border border-dashed border-zinc-200 bg-zinc-50/80 px-4 py-5 text-center">
            <p className="text-sm font-medium text-zinc-600">핸드폰 번호와 비밀번호는</p>
            <p className="text-sm text-zinc-500 mt-1">위에서 이메일 인증을 완료한 뒤 입력할 수 있습니다.</p>
          </div>
        ) : (
          <>
            {/* 핸드폰 */}
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-zinc-800 mb-2">
                핸드폰 번호 <span className="text-red-500">*</span>
              </label>
              <input
                id="phone"
                type="tel"
                value={formData.phone || ''}
                onChange={(e) => {
                  let value = e.target.value.replace(/[^0-9]/g, '')
                  if (value.length > 11) value = value.slice(0, 11)
                  if (value.length >= 4 && value.length <= 7) {
                    value = value.slice(0, 3) + '-' + value.slice(3)
                  } else if (value.length > 7) {
                    value = value.slice(0, 3) + '-' + value.slice(3, 7) + '-' + value.slice(7)
                  }
                  setFormData({ ...formData, phone: value })
                }}
                placeholder="01012345678"
                className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all"
              />
              {fieldErrors.phone && (
                <p className="text-red-500 text-sm mt-1">{fieldErrors.phone[0]}</p>
              )}
              <p className="text-zinc-400 text-xs mt-1">하이픈 없이 입력해도 자동으로 추가됩니다</p>
            </div>

            {/* 비밀번호 */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-zinc-800 mb-2">
                비밀번호 <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password || ''}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="최소 8자, 소문자, 숫자 포함"
                  className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-3.5 text-zinc-400 hover:text-zinc-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {fieldErrors.password && (
                <p className="text-red-500 text-sm mt-1">{fieldErrors.password[0]}</p>
              )}

              <div className="mt-3">
                <PasswordStrengthMeter password={formData.password || ''} />
              </div>
            </div>

            {/* 비밀번호 확인 */}
            <div>
              <label htmlFor="passwordConfirm" className="block text-sm font-medium text-zinc-800 mb-2">
                비밀번호 확인 <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  id="passwordConfirm"
                  type={showPasswordConfirm ? 'text' : 'password'}
                  value={formData.passwordConfirm || ''}
                  onChange={(e) => setFormData({ ...formData, passwordConfirm: e.target.value })}
                  placeholder="비밀번호 확인"
                  className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPasswordConfirm(!showPasswordConfirm)}
                  className="absolute right-4 top-3.5 text-zinc-400 hover:text-zinc-600 transition-colors"
                >
                  {showPasswordConfirm ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {fieldErrors.passwordConfirm && (
                <p className="text-red-500 text-sm mt-1">{fieldErrors.passwordConfirm[0]}</p>
              )}
            </div>
          </>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex gap-2">
            <AlertCircle size={20} className="text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        {/* 진행률 */}
        <div className="flex gap-2 justify-center text-sm text-zinc-500">
          <div className="text-violet-700 font-semibold">1단계</div>
          <div className="text-zinc-300">▸</div>
          <div className="text-zinc-400">2단계</div>
        </div>

        <button
          type="button"
          onClick={goToNextStep}
          disabled={!emailVerified}
          className="w-full px-4 py-3 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white rounded-xl shadow-md shadow-violet-900/10 hover:shadow-lg hover:shadow-violet-900/15 transition-all font-semibold mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          다음
        </button>
      </form>
    )
  }

  // Step 2: 동의사항
  if (step === 'consent') {
    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* 필수 동의사항 */}
        <div className="space-y-3 mb-4">
          <p className="text-sm font-semibold text-zinc-500 uppercase tracking-wider">필수 동의사항</p>

          {/* 서비스 약관 동의 */}
          <label className="flex items-start gap-3 p-4 border border-zinc-200 rounded-xl hover:bg-zinc-50 cursor-pointer transition-colors">
            <input
              type="checkbox"
              checked={formData.termsConsent || false}
              onChange={(e) => setFormData({ ...formData, termsConsent: e.target.checked })}
              className="w-5 h-5 rounded accent-violet-600 mt-0.5 cursor-pointer flex-shrink-0 border-zinc-300"
            />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <p className="font-medium text-zinc-900">서비스 이용약관 동의 <span className="text-red-500">*</span></p>
                <Link
                  href="/terms"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-violet-600 hover:text-violet-700 transition-colors"
                >
                  <ExternalLink size={14} />
                  <span className="text-sm">전문 보기</span>
                </Link>
              </div>
              <p className="text-sm text-zinc-600">숏마마 서비스 이용약관에 동의합니다</p>
            </div>
          </label>

          {/* 만 14세 미만 제한 동의 */}
          <label className="flex items-start gap-3 p-4 border border-zinc-200 rounded-xl hover:bg-zinc-50 cursor-pointer transition-colors">
            <input
              type="checkbox"
              checked={formData.ageConsent || false}
              onChange={(e) => setFormData({ ...formData, ageConsent: e.target.checked })}
              className="w-5 h-5 rounded accent-violet-600 mt-0.5 cursor-pointer flex-shrink-0 border-zinc-300"
            />
            <div>
              <p className="font-medium text-zinc-900">만 14세 미만 제한 <span className="text-red-500">*</span></p>
              <p className="text-sm text-zinc-600">만 14세 이상만 서비스를 이용할 수 있습니다</p>
            </div>
          </label>

          {/* 개인정보 처리방침 동의 */}
          <label className="flex items-start gap-3 p-4 border border-zinc-200 rounded-xl hover:bg-zinc-50 cursor-pointer transition-colors">
            <input
              type="checkbox"
              checked={formData.privacyConsent || false}
              onChange={(e) => setFormData({ ...formData, privacyConsent: e.target.checked })}
              className="w-5 h-5 rounded accent-violet-600 mt-0.5 cursor-pointer flex-shrink-0 border-zinc-300"
            />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <p className="font-medium text-zinc-900">개인정보 처리방침 동의 <span className="text-red-500">*</span></p>
                <Link
                  href="/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-violet-600 hover:text-violet-700 transition-colors"
                >
                  <ExternalLink size={14} />
                  <span className="text-sm">전문 보기</span>
                </Link>
              </div>
              <p className="text-sm text-zinc-600">개인정보 수집 및 이용에 동의합니다</p>
            </div>
          </label>
        </div>

        {/* 선택 동의사항 */}
        <div className="space-y-3 pt-4 border-t border-zinc-100">
          <p className="text-sm font-semibold text-zinc-500 uppercase tracking-wider">선택 동의사항</p>

          {/* 마케팅 동의 - 선택 */}
          <label className="flex items-start gap-3 p-4 border border-zinc-200 rounded-xl hover:bg-zinc-50 cursor-pointer transition-colors">
            <input
              type="checkbox"
              checked={formData.marketingConsent || false}
              onChange={(e) => setFormData({ ...formData, marketingConsent: e.target.checked })}
              className="w-5 h-5 rounded accent-fuchsia-600 mt-0.5 cursor-pointer flex-shrink-0 border-zinc-300"
            />
            <div>
              <p className="font-medium text-zinc-900">마케팅 정보 수신 동의 <span className="text-zinc-400 text-sm font-normal">(선택)</span></p>
              <p className="text-sm text-zinc-600">
                이벤트, 프로모션 등 마케팅 정보 수신에 동의합니다
              </p>
            </div>
          </label>
        </div>

        {/* 에러 메시지 */}
        {fieldErrors.termsConsent && (
          <div className="text-red-500 text-sm">{fieldErrors.termsConsent[0]}</div>
        )}
        {fieldErrors.privacyConsent && (
          <div className="text-red-500 text-sm">{fieldErrors.privacyConsent[0]}</div>
        )}
        {fieldErrors.ageConsent && (
          <div className="text-red-500 text-sm">{fieldErrors.ageConsent[0]}</div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex gap-2">
            <AlertCircle size={20} className="text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        {/* 진행률 */}
        <div className="flex gap-2 justify-center text-sm text-zinc-500">
          <div className="text-zinc-400 font-medium">1단계</div>
          <div className="text-zinc-300">▸</div>
          <div className="text-violet-700 font-semibold">2단계</div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            type="button"
            onClick={goToPreviousStep}
            disabled={loading}
            className="flex-1 px-4 py-3 border border-zinc-300 text-zinc-800 rounded-xl hover:bg-zinc-50 transition-colors font-medium disabled:opacity-50"
          >
            이전
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 px-4 py-3 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white rounded-xl shadow-md shadow-violet-900/10 hover:shadow-lg hover:shadow-violet-900/15 transition-all font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading && <Loader2 size={20} className="animate-spin" />}
            회원가입
          </button>
        </div>
      </form>
    )
  }

  // Loading state
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-8">
      <Loader2 size={40} className="animate-spin text-violet-600" />
      <p className="text-zinc-600">회원가입 처리 중...</p>
    </div>
  )
}
