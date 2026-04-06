import { MetadataRoute } from 'next'
import { SITE_ORIGIN } from '@/lib/site-url'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/api/',
        '/*.json$',
        '/*?*sort=',
        '/*?*filter=',
      ],
    },
    sitemap: `${SITE_ORIGIN}/sitemap.xml`,
  }
}
