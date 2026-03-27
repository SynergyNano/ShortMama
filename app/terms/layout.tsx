import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '서비스 이용약관 | 숏마마',
  description: '숏마마의 서비스 이용약관을 확인하세요',
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: 'https://www.shortmama.com/terms',
  },
}

export default function TermsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
