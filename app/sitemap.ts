import { MetadataRoute } from 'next';
import { locales } from '@/lib/i18n/config';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.SITE_URL || 'https://vetaps.com';
  const currentDate = new Date();

  // Define all routes with their priorities and change frequencies
  const routes = [
    { path: '', priority: 1.0, changeFrequency: 'weekly' as const }, // Homepage
    { path: '/services', priority: 0.9, changeFrequency: 'monthly' as const },
    { path: '/web-dev', priority: 0.9, changeFrequency: 'monthly' as const },
    { path: '/about', priority: 0.8, changeFrequency: 'monthly' as const },
    { path: '/contact', priority: 0.8, changeFrequency: 'monthly' as const },
    { path: '/blog', priority: 0.9, changeFrequency: 'weekly' as const },
    { path: '/documentation', priority: 0.7, changeFrequency: 'monthly' as const },
    { path: '/support', priority: 0.7, changeFrequency: 'monthly' as const },
    { path: '/privacy', priority: 0.5, changeFrequency: 'yearly' as const },
    { path: '/terms', priority: 0.5, changeFrequency: 'yearly' as const },
    { path: '/business-card', priority: 0.8, changeFrequency: 'monthly' as const },
    { path: '/review-card', priority: 0.8, changeFrequency: 'monthly' as const },
    { path: '/Business-Profile', priority: 0.8, changeFrequency: 'monthly' as const },
    { path: '/ceo', priority: 0.7, changeFrequency: 'monthly' as const },
  ];

  const sitemap: MetadataRoute.Sitemap = [];

  locales.forEach((locale) => {
    routes.forEach((route) => {
      sitemap.push({
        url: `${baseUrl}/${locale}${route.path}`,
        lastModified: currentDate,
        changeFrequency: route.changeFrequency,
        priority: route.priority,
        alternates: {
          languages: Object.fromEntries(
            locales.map((l) => [l, `${baseUrl}/${l}${route.path}`])
          ),
        },
      });
    });
  });

  return sitemap;
}

