import type { Metadata } from 'next'
import HomeContent from './home-content'
import { SITE_ORIGIN } from '@/lib/site-url'

export const metadata: Metadata = {
  title: '숏마마 | ShortMama - 틱톡 영상 검색 및 분석 도구',
  description: '숏마마는 TikTok, Douyin 영상을 한눈에 검색하고 분석하는 도구입니다. 숏마마로 인기 콘텐츠를 발견하고 크리에이터를 분석하세요.',
  keywords: ['숏마마', 'ShortMama', 'TikTok 검색', '틱톡 검색', '틱톡 분석', 'Douyin', '숏폼', '영상 검색', '크리에이터 검색'],
  authors: [{ name: 'ShortMama Team' }],
  creator: 'ShortMama',
  publisher: 'ShortMama',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-snippet': -1,
      'max-image-preview': 'large',
      'max-video-preview': -1,
    },
  },
  manifest: '/site.webmanifest',
  openGraph: {
    type: 'website',
    locale: 'ko_KR',
    url: SITE_ORIGIN,
    siteName: '숏마마 | ShortMama',
    title: '숏마마 - 틱톡 영상 검색 및 분석 도구',
    description: '숏마마는 TikTok, Douyin 영상을 한눈에 검색하고 분석합니다. 숏마마로 인기 콘텐츠를 발견하세요.',
    images: [
      {
        url: `${SITE_ORIGIN}/og-image.png`,
        width: 1200,
        height: 630,
        alt: 'ShortMama',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: '숏마마 - 틱톡 영상 검색 및 분석 도구',
    description: '숏마마는 TikTok, Douyin 영상을 한눈에 검색하고 분석합니다. 숏마마로 인기 콘텐츠를 발견하세요.',
    images: [`${SITE_ORIGIN}/twitter-image.png`],
  },
  alternates: {
    canonical: SITE_ORIGIN,
  },
  verification: {
    google: 'google-site-verification-code-here',
  },
}

export default function Home() {
  return <HomeContent />
}
