import type { Metadata } from 'next'
import { SITE_ORIGIN } from '@/lib/site-url'

export const metadata: Metadata = {
  title: '회원가입 | 숏마마',
  description: '새 계정을 만들고 숏마마 서비스를 시작하세요',
  robots: {
    index: false,
    follow: false,
  },
  alternates: {
    canonical: `${SITE_ORIGIN}/auth/signup`,
  },
}

export default function SignupLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
