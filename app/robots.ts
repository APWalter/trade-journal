import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/dashboard/',
        '/api/',
        '/authentication/',
      ],
    },
    sitemap: 'https://shikuf.app/sitemap.xml',
  }
} 