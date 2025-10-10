const siteUrl = process.env.SITE_URL || 'https://vetaps.com';

export const organizationLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'VETAP',
  url: siteUrl,
  logo: `${siteUrl}/icons/logo.png`,
  description:
    'Elite website design and engineering company specializing in ultra-fast, secure, SEO-optimized websites.',
  sameAs: ['https://x.com/vetap', 'https://www.linkedin.com/company/vetap'],
  contactPoint: {
    '@type': 'ContactPoint',
    contactType: 'Customer Service',
    email: 'support@vetaps.com',
    availableLanguage: ['English', 'Arabic'],
  },
};

export const websiteLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'VETAP',
  url: siteUrl,
  description:
    'Professional web development company building ultra-fast, secure websites with Next.js and TypeScript.',
  potentialAction: {
    '@type': 'SearchAction',
    target: `${siteUrl}/search?q={search_term_string}`,
    'query-input': 'required name=search_term_string',
  },
};

export function getBreadcrumbLd(items: { name: string; item: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.item,
    })),
  };
}

export const serviceLd = {
  '@context': 'https://schema.org',
  '@type': 'Service',
  serviceType: 'Web Development',
  provider: {
    '@type': 'Organization',
    name: 'VETAP',
    url: siteUrl,
  },
  areaServed: 'Worldwide',
  hasOfferCatalog: {
    '@type': 'OfferCatalog',
    name: 'Web Development Services',
    itemListElement: [
      {
        '@type': 'Offer',
        itemOffered: {
          '@type': 'Service',
          name: 'Custom Web Development',
          description:
            'Full-stack web applications built with modern technologies',
        },
      },
      {
        '@type': 'Offer',
        itemOffered: {
          '@type': 'Service',
          name: 'Frontend Development',
          description: 'Beautiful, responsive interfaces with React and Next.js',
        },
      },
      {
        '@type': 'Offer',
        itemOffered: {
          '@type': 'Service',
          name: 'Website Migration & Optimization',
          description: 'Improve existing websites for better performance and SEO',
        },
      },
    ],
  },
};

