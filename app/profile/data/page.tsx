'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { AlertCircle, Loader2, Download, CheckCircle } from 'lucide-react'
import { formatLastLogin } from '@/lib/dateUtils'

interface UserData {
  _id?: string
  email: string
  name?: string
  phone?: string
  address?: string
  marketingConsent?: boolean
  wantsTextbook?: boolean
  isActive: boolean
  isBanned: boolean
  isApproved: boolean
  createdAt: string
  updatedAt: string
  lastLogin?: string | null
}

export default function UserDataPage() {
  const router = useRouter()
  const { status } = useSession()
  const [loading, setLoading] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [error, setError] = useState<string>('')
  const [userData, setUserData] = useState<UserData | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login')
    }
  }, [status, router])

  useEffect(() => {
    if (status !== 'authenticated') return

    const fetchUserData = async () => {
      setLoading(true)
      setError('')

      try {
        const response = await fetch('/api/user/data')
        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || '데이터 조회 실패')
        }

        setUserData(data.data)
      } catch (err) {
        setError(err instanceof Error ? err.message : '요청 처리 중 오류가 발생했습니다')
      } finally {
        setLoading(false)
      }
    }

    fetchUserData()
  }, [status])

  const handleDownloadJSON = () => {
    if (!userData) return

    setDownloading(true)
    try {
      const dataStr = JSON.stringify(userData, null, 2)
      const dataBlob = new Blob([dataStr], { type: 'application/json' })
      const url = URL.createObjectURL(dataBlob)
      const link = document.createElement('a')
      link.href = url
      link.download = `user-data-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch {
      setError('다운로드 중 오류가 발생했습니다')
    } finally {
      setDownloading(false)
    }
  }

  const handleCopy = () => {
    if (!userData) return

    const dataStr = JSON.stringify(userData, null, 2)
    navigator.clipboard.writeText(dataStr)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-violet-300/35 via-purple-100/45 to-white flex items-center justify-center">
        <Loader2 size={40} className="animate-spin text-violet-600" />
      </div>
    )
  }

  if (status === 'unauthenticated') {
    return null
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-b from-violet-300/35 via-purple-100/45 to-white">
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
        <div className="absolute w-[480px] h-[480px] bg-violet-500/20 rounded-full blur-[120px] -top-48 -right-24" />
        <div className="absolute w-[420px] h-[420px] bg-fuchsia-400/15 rounded-full blur-[110px] -bottom-40 -left-20" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold gradient-text-profile mb-2">개인정보 조회</h1>
          <p className="text-violet-950/70">
            GDPR 준수: 귀하의 모든 개인정보를 조회하고 다운로드할 수 있습니다
          </p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex gap-3">
            <AlertCircle size={20} className="text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {loading && (
          <div className="flex flex-col items-center justify-center gap-4 py-12">
            <Loader2 size={40} className="animate-spin text-violet-600" />
            <p className="text-violet-950/70">개인정보 로딩 중...</p>
          </div>
        )}

        {userData && !loading && (
          <div className="space-y-6">
            <div className="bg-violet-50 border border-violet-200/80 rounded-xl p-4">
              <p className="text-violet-950 text-sm">
                아래는 저희 서비스에 등록되어 있는 모든 개인정보입니다. JSON 형식으로 다운로드하거나 복사할 수 있습니다.
                민감한 정보이므로 안전하게 보관하시기 바랍니다.
              </p>
            </div>

            <div className="bg-white/90 border border-violet-200/60 rounded-2xl p-8 overflow-hidden shadow-sm shadow-violet-900/5">
              <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
                <h2 className="text-2xl font-bold text-violet-900">저장된 정보</h2>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleCopy}
                    disabled={downloading}
                    className="px-4 py-2 border border-zinc-300 text-zinc-800 rounded-xl hover:bg-zinc-50 transition-colors font-medium disabled:opacity-50"
                  >
                    {copied ? '복사됨!' : '복사'}
                  </button>
                  <button
                    type="button"
                    onClick={handleDownloadJSON}
                    disabled={downloading}
                    className="px-4 py-2 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white rounded-xl shadow-md shadow-violet-900/15 hover:shadow-lg transition-all font-semibold disabled:opacity-50 flex items-center gap-2"
                  >
                    {downloading ? (
                      <>
                        <Loader2 size={18} className="animate-spin" />
                        다운로드 중
                      </>
                    ) : (
                      <>
                        <Download size={18} />
                        JSON 다운로드
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="bg-zinc-900 rounded-xl p-4 overflow-x-auto max-h-96 border border-zinc-700">
                <pre className="text-zinc-100 text-sm font-mono">
                  {JSON.stringify(userData, null, 2)}
                </pre>
              </div>
            </div>

            <div className="bg-white/90 border border-violet-200/60 rounded-2xl p-8 space-y-4 shadow-sm shadow-violet-900/5">
              <h2 className="text-2xl font-bold text-violet-900 mb-6">정보 설명</h2>

              <div className="space-y-3">
                <div>
                  <p className="font-semibold text-zinc-900">이메일</p>
                  <p className="text-zinc-600 text-sm">계정 로그인에 사용되는 이메일 주소</p>
                </div>

                <div>
                  <p className="font-semibold text-zinc-900">이름</p>
                  <p className="text-zinc-600 text-sm">프로필에 등록된 사용자의 이름</p>
                </div>

                <div>
                  <p className="font-semibold text-zinc-900">핸드폰</p>
                  <p className="text-zinc-600 text-sm">가입 시 등록한 핸드폰 번호</p>
                </div>

                <div>
                  <p className="font-semibold text-zinc-900">주소</p>
                  <p className="text-zinc-600 text-sm">교재 배송용으로 등록한 주소 (선택 사항)</p>
                </div>

                <div>
                  <p className="font-semibold text-zinc-900">교재 수령 희망</p>
                  <p className="text-zinc-600 text-sm">무료 교재 우편 배송 수령 희망 여부</p>
                </div>

                <div>
                  <p className="font-semibold text-zinc-900">계정 상태</p>
                  <p className="text-zinc-600 text-sm">활성, 차단, 승인 상태 등 계정 상태 정보</p>
                </div>

                <div>
                  <p className="font-semibold text-zinc-900">마지막 로그인</p>
                  <p className="text-zinc-600 text-sm">{formatLastLogin(userData.lastLogin)}</p>
                </div>

                <div>
                  <p className="font-semibold text-zinc-900">생성일</p>
                  <p className="text-zinc-600 text-sm">계정 생성 일시</p>
                </div>

                <div>
                  <p className="font-semibold text-zinc-900">수정일</p>
                  <p className="text-zinc-600 text-sm">마지막 정보 수정 일시</p>
                </div>
              </div>
            </div>

            <div className="bg-violet-50 border border-violet-200/80 rounded-xl p-4 space-y-2">
              <h3 className="font-semibold text-violet-900 flex items-center gap-2">
                <CheckCircle size={20} />
                귀하의 권리
              </h3>
              <ul className="text-violet-950/90 text-sm space-y-1 ml-6">
                <li>• 본인의 개인정보를 언제든지 조회할 권리</li>
                <li>• 부정확한 정보의 수정을 요청할 권리</li>
                <li>• 개인정보의 삭제를 요청할 권리 (계정 탈퇴)</li>
                <li>• 개인정보 처리의 정지를 요청할 권리</li>
                <li>• 마케팅 동의를 철회할 권리</li>
              </ul>
            </div>

            <div className="flex gap-3">
              <a
                href="/profile"
                className="flex-1 px-4 py-3 border border-violet-300 text-violet-950 rounded-xl hover:bg-violet-50 transition-colors font-medium text-center"
              >
                프로필로 돌아가기
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
