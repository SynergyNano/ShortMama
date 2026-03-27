import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '로그인 | 숏마마',
  description: '숏마마 계정으로 로그인하세요',
  robots: {
    index: false,
    follow: false,
  },
  alternates: {
    canonical: 'https://www.shortmama.com/auth/login',
  },
}

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
