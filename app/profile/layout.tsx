import type { Metadata } from 'next'
import { SITE_ORIGIN } from '@/lib/site-url'

export const metadata: Metadata = {
  title: '프로필 | 숏마마',
  description: '사용자 프로필 정보를 관리하세요',
  robots: {
    index: false,
    follow: false,
  },
  alternates: {
    canonical: `${SITE_ORIGIN}/profile`,
  },
}

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
