import type { Metadata } from 'next'
import { SITE_ORIGIN } from '@/lib/site-url'

export const metadata: Metadata = {
  title: '환불정책 | 숏마마',
  description: '숏마마의 환불정책을 확인하세요',
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: `${SITE_ORIGIN}/refund-policy`,
  },
}

export default function RefundPolicyLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
