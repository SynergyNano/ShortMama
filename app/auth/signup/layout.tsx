import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '회원가입 | 숏마마',
  description: '새 계정을 만들고 숏마마 서비스를 시작하세요',
  robots: {
    index: false,
    follow: false,
  },
  alternates: {
    canonical: 'https://www.shortmama.com/auth/signup',
  },
}

export default function SignupLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
