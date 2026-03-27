import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '비밀번호 찾기 | 숏마마',
  description: '비밀번호 재설정',
  robots: { index: false, follow: false },
}

export default function ForgotPasswordLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
