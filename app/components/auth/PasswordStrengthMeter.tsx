'use client'

import { getPasswordStrength } from '@/lib/validations/auth'
import { useMemo } from 'react'

interface PasswordStrengthMeterProps {
  password: string
}

const strengthBarClass: Record<'weak' | 'fair' | 'good' | 'strong', string> = {
  weak: 'bg-red-500',
  fair: 'bg-amber-500',
  good: 'bg-teal-500',
  strong: 'bg-emerald-600',
}

const strengthTextClass: Record<'weak' | 'fair' | 'good' | 'strong', string> = {
  weak: 'text-red-600',
  fair: 'text-amber-600',
  good: 'text-teal-700',
  strong: 'text-emerald-700',
}

export default function PasswordStrengthMeter({ password }: PasswordStrengthMeterProps) {
  const strength = useMemo(() => {
    return getPasswordStrength(password)
  }, [password])

  const strengthLabels = {
    weak: '약함',
    fair: '중간',
    good: '보통',
    strong: '강함',
  }

  return (
    <div className="space-y-2">
      {/* 강도 바 */}
      <div className="w-full bg-zinc-200 rounded-full h-2 overflow-hidden">
        <div
          className={`h-full transition-all duration-300 ${strengthBarClass[strength.level]}`}
          style={{ width: `${(strength.score / 5) * 100}%` }}
        />
      </div>

      {/* 강도 레이블 */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-zinc-600">비밀번호 강도</span>
        <span className={`font-semibold ${strengthTextClass[strength.level]}`}>
          {strengthLabels[strength.level]}
        </span>
      </div>

      {/* 피드백 */}
      {strength.feedback.length > 0 && (
        <div className="bg-teal-50 border border-teal-200 rounded-lg p-3 text-sm text-teal-900">
          <p className="font-semibold mb-1">다음을 추가하세요:</p>
          <ul className="list-disc list-inside space-y-1 text-teal-800">
            {strength.feedback.map((item, idx) => (
              <li key={idx}>{item}</li>
            ))}
          </ul>
        </div>
      )}

      {/* 충족 조건 */}
      <div className="text-xs text-zinc-600 space-y-1">
        <div className={`flex items-center gap-2 ${password.length >= 8 ? 'text-emerald-600 font-medium' : ''}`}>
          <span>{password.length >= 8 ? '✓' : '○'}</span>
          <span>8자 이상</span>
        </div>
        <div className={`flex items-center gap-2 ${/[a-z]/.test(password) ? 'text-emerald-600 font-medium' : ''}`}>
          <span>{/[a-z]/.test(password) ? '✓' : '○'}</span>
          <span>소문자 포함</span>
        </div>
        <div className={`flex items-center gap-2 ${/[0-9]/.test(password) ? 'text-emerald-600 font-medium' : ''}`}>
          <span>{/[0-9]/.test(password) ? '✓' : '○'}</span>
          <span>숫자 포함</span>
        </div>
      </div>
    </div>
  )
}
