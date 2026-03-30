'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { AlertCircle, Eye, EyeOff, Loader2, CheckCircle } from 'lucide-react'
import SubscriptionCard from '@/app/components/SubscriptionCard'

export default function ProfilePage() {
  const router = useRouter()
  const { data: session, status, update } = useSession()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>('')
  const [success, setSuccess] = useState<string>('')
  const [showPassword, setShowPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  // 일반 정보 수정
  const [formData, setFormData] = useState({
    name: session?.user?.name || '',
    phone: session?.user?.phone || '',
  })

  // 패스워드 변경
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })

  // 마케팅 동의
  const [marketingConsent, setMarketingConsent] = useState(false)

  // 로그아웃 핸들러
  const handleLogout = async () => {
    await signOut({ callbackUrl: '/' })
  }

  // 로딩 상태 체크
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-violet-300/35 via-purple-100/45 to-white flex items-center justify-center">
        <Loader2 size={40} className="animate-spin text-violet-600" />
      </div>
    )
  }

  // 미인증 상태
  if (status === 'unauthenticated') {
    router.push('/auth/login')
    return null
  }

  // 일반 정보 저장
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const response = await fetch('/api/user/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          phone: formData.phone,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || '정보 수정 실패')
      }

      setSuccess('프로필이 성공적으로 수정되었습니다.')
      await update({ name: formData.name })
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : '요청 처리 중 오류가 발생했습니다')
    } finally {
      setLoading(false)
    }
  }

  // 패스워드 변경
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    // 비밀번호 확인
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('새 비밀번호가 일치하지 않습니다')
      setLoading(false)
      return
    }

    if (passwordData.newPassword.length < 8) {
      setError('새 비밀번호는 8자 이상이어야 합니다')
      setLoading(false)
      return
    }

    try {
      const response = await fetch('/api/user/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || '패스워드 변경 실패')
      }

      setSuccess('비밀번호가 성공적으로 변경되었습니다.')
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' })
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : '요청 처리 중 오류가 발생했습니다')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-b from-violet-300/35 via-purple-100/45 to-white">
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
        <div className="absolute w-[480px] h-[480px] bg-violet-500/20 rounded-full blur-[120px] -top-48 -right-24" />
        <div className="absolute w-[420px] h-[420px] bg-fuchsia-400/15 rounded-full blur-[110px] -bottom-40 -left-20" />
      </div>

      <div className="relative z-10 max-w-2xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold gradient-text-profile mb-2">프로필 설정</h1>
          <p className="text-violet-950/70">개인정보 및 비밀번호를 관리하세요</p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex gap-3">
            <AlertCircle size={20} className="text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-6 bg-violet-50 border border-violet-200 rounded-lg p-4 flex gap-3">
            <CheckCircle size={20} className="text-violet-600 flex-shrink-0 mt-0.5" />
            <p className="text-violet-900">{success}</p>
          </div>
        )}

        <div className="space-y-6">
          {/* 사용자 정보 */}
          <div className="bg-white/90 border border-violet-200/60 rounded-2xl p-8 shadow-sm shadow-violet-900/5">
            <h2 className="text-2xl font-bold text-violet-900 mb-6">기본 정보</h2>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-800 mb-2">
                  이메일
                </label>
                <input
                  type="email"
                  value={session?.user?.email || ''}
                  disabled
                  className="w-full px-4 py-3 bg-zinc-100 border border-zinc-200 rounded-lg text-zinc-500 cursor-not-allowed"
                />
                <p className="text-xs text-zinc-400 mt-1">이메일은 변경할 수 없습니다</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-800 mb-2">
                  이름
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="이름"
                  className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-800 mb-2">
                  핸드폰 번호
                </label>
                <input
                  type="tel"
                  value={formData.phone}
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
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full px-4 py-3 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white rounded-full shadow-md shadow-violet-900/15 hover:shadow-lg transition-all font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading && <Loader2 size={20} className="animate-spin" />}
                저장
              </button>
            </form>
          </div>

          {/* 패스워드 변경 */}
          <div className="bg-white/90 border border-violet-200/60 rounded-2xl p-8 shadow-sm shadow-violet-900/5">
            <h2 className="text-2xl font-bold text-violet-900 mb-6">패스워드 변경</h2>

            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-800 mb-2">
                  현재 비밀번호
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={passwordData.currentPassword}
                    onChange={(e) =>
                      setPasswordData({ ...passwordData, currentPassword: e.target.value })
                    }
                    placeholder="현재 비밀번호"
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
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-800 mb-2">
                  새 비밀번호
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={passwordData.newPassword}
                    onChange={(e) =>
                      setPasswordData({ ...passwordData, newPassword: e.target.value })
                    }
                    placeholder="새 비밀번호 (8자 이상)"
                    className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-4 top-3.5 text-zinc-400 hover:text-zinc-600 transition-colors"
                  >
                    {showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-800 mb-2">
                  비밀번호 확인
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={passwordData.confirmPassword}
                    onChange={(e) =>
                      setPasswordData({ ...passwordData, confirmPassword: e.target.value })
                    }
                    placeholder="비밀번호 확인"
                    className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-3.5 text-zinc-400 hover:text-zinc-600 transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full px-4 py-3 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white rounded-full shadow-md shadow-violet-900/15 hover:shadow-lg transition-all font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading && <Loader2 size={20} className="animate-spin" />}
                패스워드 변경
              </button>
            </form>
          </div>

          {/* 개인정보 열람 */}
          <div className="bg-white/90 border border-violet-200/60 rounded-2xl p-8 shadow-sm shadow-violet-900/5">
            <h2 className="text-2xl font-bold text-violet-900 mb-4">개인정보 관리</h2>
            <p className="text-violet-950/70 mb-6">GDPR 준수: 언제든지 자신의 정보를 조회하고 다운로드할 수 있습니다.</p>
            <div className="flex gap-3">
              <a
                href="/profile/data"
                className="flex-1 px-4 py-3 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white rounded-full shadow-md shadow-violet-900/15 hover:shadow-lg transition-all font-semibold text-center"
              >
                개인정보 조회
              </a>
              <button
                type="button"
                onClick={handleLogout}
                className="flex-1 px-4 py-3 bg-zinc-100 text-zinc-800 border border-zinc-200 rounded-xl hover:bg-zinc-200 transition-all font-semibold"
              >
                로그아웃
              </button>
            </div>
          </div>

          <div id="subscription" className="bg-white/90 border border-violet-200/60 rounded-2xl p-8 shadow-sm shadow-violet-900/5">
            <h2 className="text-2xl font-bold text-violet-900 mb-6">구독 관리</h2>
            <SubscriptionCard
              userEmail={session?.user?.email}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
