import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '개인정보 처리방침 | 숏마마',
  description: '숏마마의 개인정보 처리방침을 확인하세요',
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: 'https://www.shortmama.com/privacy',
  },
}

export default function PrivacyLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
