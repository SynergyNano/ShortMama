import type { Metadata } from 'next'
import { SITE_ORIGIN } from '@/lib/site-url'

export const metadata: Metadata = {
  title: '로그인 | 숏마마',
  description: '숏마마 계정으로 로그인하세요',
  robots: {
    index: false,
    follow: false,
  },
  alternates: {
    canonical: `${SITE_ORIGIN}/auth/login`,
  },
}

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
