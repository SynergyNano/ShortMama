import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '요금제 | 숏마마',
  description: '숏마마의 요금제를 확인하세요. 라이트, 프로, 프로+, 울트라 플랜을 제공합니다.',
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: 'https://www.shortmama.com/pricing',
  },
}

export default function PricingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
