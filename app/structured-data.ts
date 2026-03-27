export const structuredData = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'ShortMama',
  alternateName: '숏마마',
  url: 'https://www.shortmama.com',
  applicationCategory: 'SearchApplication',
  description:
    '숏마마(ShortMama)는 TikTok, Douyin 영상을 한눈에 검색하고 분석하는 도구입니다. 숏마마로 인기 콘텐츠를 발견하세요.',
  softwareVersion: '1.0.0',
  author: {
    '@type': 'Organization',
    name: 'ShortMama Team',
    url: 'https://www.shortmama.com',
  },
  offers: {
    '@type': 'Offer',
    priceCurrency: 'USD',
    price: '0',
    description: 'Free video search and analytics service',
  },
  aggregateRating: {
    '@type': 'AggregateRating',
    ratingValue: '4.8',
    ratingCount: '150',
  },
  potentialAction: {
    '@type': 'SearchAction',
    target: {
      '@type': 'EntryPoint',
      urlTemplate: 'https://www.shortmama.com/search?q={search_term_string}',
    },
    query_input: 'required name=search_term_string',
  },
}

export const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'ShortMama',
  alternateName: '숏마마',
  url: 'https://www.shortmama.com',
  logo: 'https://www.shortmama.com/logo.png',
  description:
    '숏마마(ShortMama)는 TikTok, Douyin 영상을 한눈에 검색하고 분석합니다. 숏마마로 인기 콘텐츠와 크리에이터를 발견하세요.',
  sameAs: [],
  contactPoint: {
    '@type': 'ContactPoint',
    contactType: 'Customer Support',
    url: 'https://www.shortmama.com',
  },
}

export const websiteSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'ShortMama',
  alternateName: '숏마마',
  url: 'https://www.shortmama.com',
  description: '숏마마(ShortMama)는 TikTok, Douyin 영상을 한눈에 검색하고 분석합니다.',
  potentialAction: {
    '@type': 'SearchAction',
    target: {
      '@type': 'EntryPoint',
      urlTemplate: 'https://www.shortmama.com/search?q={search_term_string}',
    },
    queryInput: 'required name=search_term_string',
  },
}
