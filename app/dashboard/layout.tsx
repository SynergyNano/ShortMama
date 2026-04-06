import type { Metadata } from 'next'
import { SITE_ORIGIN } from '@/lib/site-url'

export const metadata: Metadata = {
  title: '대시보드 | ShortMama',
  description: 'TikTok, Douyin 영상을 검색하고 분석하는 대시보드입니다.',
  alternates: {
    canonical: `${SITE_ORIGIN}/dashboard`,
  },
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
