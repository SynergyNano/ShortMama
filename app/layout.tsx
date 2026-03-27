import type { Metadata } from 'next'
import './globals.css'
import { Providers } from './providers'
import { websiteSchema, organizationSchema } from './structured-data'

export const metadata: Metadata = {
  title: 'ShortMama | 숏마마 - 틱톡 영상 검색 및 분석 도구',
  description: 'TikTok, Douyin 영상을 한눈에 검색하고 분석하세요. 가장 인기 있는 콘텐츠를 발견하세요.',
  keywords: ['ShortMama', '숏마마', 'TikTok', '검색', '분석', 'Douyin', '영상', '숏폼'],
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
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/site.webmanifest',
  openGraph: {
    type: 'website',
    locale: 'ko_KR',
    url: 'https://www.shortmama.com',
    siteName: 'ShortMama',
    title: 'ShortMama | 숏마마 - 틱톡 영상 검색 및 분석 도구',
    description: 'TikTok, Douyin 영상을 한눈에 검색하고 분석하세요.',
    images: [
      {
        url: 'https://www.shortmama.com/og-image.png',
        width: 1200,
        height: 630,
        alt: 'ShortMama',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ShortMama | 숏마마 - 틱톡 영상 검색 및 분석 도구',
    description: 'TikTok, Douyin 영상을 한눈에 검색하고 분석하세요.',
    images: ['https://www.shortmama.com/twitter-image.png'],
  },
  alternates: {
    canonical: 'https://www.shortmama.com',
  },
  verification: {
    google: 'e6xNUqN6c5DznLILdEpjiY4w7N5QHsy_4DavSWBk2Pc',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <head>
        {/* Preload fonts */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />

        {/* JSON-LD Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />

        {/* Google Site Verification */}
        <meta name="google-site-verification" content="e6xNUqN6c5DznLILdEpjiY4w7N5QHsy_4DavSWBk2Pc" />

        {/* Naver Site Verification */}
        <meta name="naver-site-verification" content="your-naver-verification-code" />

        {/* Theme Color */}
        <meta name="theme-color" content="#fafafa" />
      </head>
      <body className="bg-zinc-50 text-zinc-900 antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
