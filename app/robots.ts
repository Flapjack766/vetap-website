import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.SITE_URL || 'https://vetaps.com';

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/_next/',
          '/admin/',
          '/dashboard/',
          '/login/',
          '/signup/',
          '/forgot-password/',
          '/reset-password/',
          '/*/dashboard/',
          '/*/admin/',
          '/*/login/',
          '/*/signup/',
          '/*/forgot-password/',
          '/*/reset-password/',
        ],
      },
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: [
          '/api/',
          '/_next/',
          '/admin/',
          '/dashboard/',
          '/login/',
          '/signup/',
          '/forgot-password/',
          '/reset-password/',
        ],
      },
      {
        userAgent: 'Bingbot',
        allow: '/',
        disallow: [
          '/api/',
          '/_next/',
          '/admin/',
          '/dashboard/',
          '/login/',
          '/signup/',
          '/forgot-password/',
          '/reset-password/',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}

