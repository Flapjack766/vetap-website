const siteUrl = process.env.SITE_URL || 'https://vetaps.com';

// Base Organization Schema - Enhanced with all required fields
export function getOrganizationLd(locale: 'ar' | 'en' = 'en') {
  const isArabic = locale === 'ar';
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${siteUrl}/#organization`,
    name: 'VETAP',
    alternateName: 'Verified Tap',
    url: siteUrl,
    logo: {
      '@type': 'ImageObject',
      url: `${siteUrl}/icons/logo.png`,
      width: 512,
      height: 512,
    },
    image: `${siteUrl}/icons/logo.png`,
    description: isArabic
      ? 'حلول رقمية متكاملة تشمل تطوير المواقع الإلكترونية، بطاقات NFC الذكية، وتقنيات الويب الحديثة. شركة سعودية متخصصة في التطوير الاحترافي منذ 2002.'
      : 'Integrated Digital Solutions including website development, NFC smart cards, and modern web technologies. Saudi company specializing in professional development since 2002.',
    foundingDate: '2002',
    foundingLocation: {
      '@type': 'Place',
      address: {
        '@type': 'PostalAddress',
        addressLocality: 'Jeddah',
        addressCountry: 'SA',
      },
    },
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'SA',
      addressLocality: 'Jeddah',
    },
    contactPoint: [
      {
        '@type': 'ContactPoint',
        contactType: 'Customer Service',
        email: 'support@vetaps.com',
        availableLanguage: ['English', 'Arabic', 'العربية'],
        areaServed: 'Worldwide',
      },
      {
        '@type': 'ContactPoint',
        contactType: 'Sales',
        email: 'info@vetaps.com',
        availableLanguage: ['English', 'Arabic', 'العربية'],
        areaServed: 'Worldwide',
      },
    ],
    sameAs: [
      'https://x.com/vetap',
      'https://www.linkedin.com/company/vetap',
      'https://www.instagram.com/vetap',
    ],
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.9',
      reviewCount: '100+',
      bestRating: '5',
      worstRating: '1',
    },
    areaServed: {
      '@type': 'Country',
      name: 'Worldwide',
    },
  };
}

// WebSite Schema - Enhanced
export function getWebsiteLd(locale: 'ar' | 'en' = 'en') {
  const isArabic = locale === 'ar';
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${siteUrl}/#website`,
    name: 'VETAP',
    url: siteUrl,
    description: isArabic
      ? 'حلول رقمية متكاملة - تطوير مواقع احترافية، بطاقات NFC ذكية، وتقنيات ويب حديثة'
      : 'Integrated Digital Solutions - Professional website development, NFC smart cards, and modern web technologies',
    inLanguage: [locale, locale === 'ar' ? 'en' : 'ar'],
    publisher: {
      '@id': `${siteUrl}/#organization`,
    },
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${siteUrl}/search?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };
}

// BreadcrumbList Schema
export function getBreadcrumbLd(items: { name: string; item: string }[], locale: 'ar' | 'en' = 'en') {
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

// Service Schema - Comprehensive
export function getServiceLd(locale: 'ar' | 'en' = 'en') {
  const isArabic = locale === 'ar';
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    serviceType: isArabic ? 'تطوير المواقع الإلكترونية' : 'Web Development',
    provider: {
      '@id': `${siteUrl}/#organization`,
    },
    areaServed: {
      '@type': 'Country',
      name: 'Worldwide',
    },
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: isArabic ? 'خدمات تطوير المواقع' : 'Web Development Services',
      itemListElement: [
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: isArabic ? 'تطوير مواقع مخصص' : 'Custom Web Development',
            description: isArabic
              ? 'تطبيقات ويب كاملة المكدس مبنية بتقنيات حديثة'
              : 'Full-stack web applications built with modern technologies',
            category: 'Web Development',
          },
        },
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: isArabic ? 'تطوير الواجهة الأمامية' : 'Frontend Development',
            description: isArabic
              ? 'واجهات جميلة ومتجاوبة مع React و Next.js'
              : 'Beautiful, responsive interfaces with React and Next.js',
            category: 'Web Development',
          },
        },
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: isArabic ? 'ترحيل وتحسين المواقع' : 'Website Migration & Optimization',
            description: isArabic
              ? 'تحسين المواقع الموجودة للأداء والـ SEO الأفضل'
              : 'Improve existing websites for better performance and SEO',
            category: 'Web Development',
          },
        },
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: isArabic ? 'بطاقات NFC ذكية' : 'NFC Smart Cards',
            description: isArabic
              ? 'بطاقات أعمال ذكية وتقييم Google Maps'
              : 'Smart business cards and Google Maps review cards',
            category: 'NFC Technology',
          },
        },
      ],
    },
  };
}

// Web Development Service Schema
export function getWebDevelopmentServiceLd(locale: 'ar' | 'en' = 'en') {
  const isArabic = locale === 'ar';
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    serviceType: isArabic ? 'تطوير المواقع الاحترافي' : 'Professional Web Development',
    name: isArabic ? 'تطوير المواقع الاحترافي' : 'Professional Web Development',
    description: isArabic
      ? 'نقوم ببناء تطبيقات ويب فائقة السرعة وآمنة وقابلة للتوسع مصممة خصيصاً لاحتياجات عملك'
      : 'We build ultra-fast, secure, and scalable web applications tailored to your business needs',
    provider: {
      '@id': `${siteUrl}/#organization`,
    },
    areaServed: {
      '@type': 'Country',
      name: 'Worldwide',
    },
    offers: {
      '@type': 'Offer',
      availability: 'https://schema.org/InStock',
      priceCurrency: 'USD',
    },
  };
}

// AboutPage Schema
export function getAboutPageLd(locale: 'ar' | 'en' = 'en') {
  const isArabic = locale === 'ar';
  return {
    '@context': 'https://schema.org',
    '@type': 'AboutPage',
    name: isArabic ? 'من نحن' : 'About Us',
    description: isArabic
      ? 'تعرف على VETAP: شركة سعودية تجمع بين أكثر من 20 عاماً من الخبرة الميدانية مع نهج التحقق قبل البناء'
      : 'Meet VETAP: a Saudi company combining 20+ years of field experience with a verify-before-build approach',
    mainEntity: {
      '@id': `${siteUrl}/#organization`,
    },
    breadcrumb: {
      '@id': `${siteUrl}/#breadcrumb`,
    },
  };
}

// ContactPage Schema
export function getContactPageLd(locale: 'ar' | 'en' = 'en') {
  const isArabic = locale === 'ar';
  return {
    '@context': 'https://schema.org',
    '@type': 'ContactPage',
    name: isArabic ? 'اتصل بنا' : 'Contact Us',
    description: isArabic
      ? 'تواصل معنا لمعرفة المزيد عن خدماتنا'
      : 'Get in touch with us to learn more about our services',
    mainEntity: {
      '@id': `${siteUrl}/#organization`,
    },
    breadcrumb: {
      '@id': `${siteUrl}/#breadcrumb`,
    },
  };
}

// ServicesPage Schema
export function getServicesPageLd(locale: 'ar' | 'en' = 'en') {
  const isArabic = locale === 'ar';
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: isArabic ? 'خدماتنا' : 'Our Services',
    description: isArabic
      ? 'اكتشف خدماتنا الشاملة في تطوير المواقع، بطاقات NFC، والحلول الرقمية'
      : 'Discover our comprehensive services in web development, NFC cards, and digital solutions',
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: [
        {
          '@type': 'Service',
          name: isArabic ? 'تطوير مواقع مخصص' : 'Custom Web Development',
        },
        {
          '@type': 'Service',
          name: isArabic ? 'بطاقات NFC ذكية' : 'NFC Smart Cards',
        },
        {
          '@type': 'Service',
          name: isArabic ? 'تحسين SEO' : 'SEO Optimization',
        },
      ],
    },
    breadcrumb: {
      '@id': `${siteUrl}/#breadcrumb`,
    },
  };
}

// Person Schema for CEO
export function getPersonLd(locale: 'ar' | 'en' = 'en') {
  const isArabic = locale === 'ar';
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    '@id': `${siteUrl}/ceo#person`,
    name: isArabic ? 'أحمد الزباجي' : 'Ahmed Alzbaji',
    alternateName: 'Ahmed Alzbaji',
    jobTitle: isArabic ? 'مؤسس و الرئيس التنفيذي' : 'Founder & CEO',
    worksFor: {
      '@id': `${siteUrl}/#organization`,
    },
    email: 'Ahmed@vetaps.com',
    telephone: '+966553198577',
    image: `${siteUrl}/images/ceo.jpg`,
    sameAs: [
      'https://x.com/ahmedalzbaji',
      'https://instagram.com/ictfe',
      'https://www.snapchat.com/add/hmood-az',
    ],
    description: isArabic
      ? 'مؤسس و الرئيس التنفيذي لـ VETAP. يقود تسليم المواقع عالية الأداء وحلول العلامات التجارية المميزة.'
      : 'Founder & CEO of VETAP. Leads end-to-end delivery of high-performance websites and premium brand experiences.',
    alumniOf: {
      '@type': 'Organization',
      name: 'VETAP',
    },
  };
}

// FAQPage Schema (if you have FAQs)
export function getFAQPageLd(faqs: { question: string; answer: string }[], locale: 'ar' | 'en' = 'en') {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };
}

// Legacy exports for backward compatibility
export const organizationLd = getOrganizationLd('en');
export const websiteLd = getWebsiteLd('en');
export const serviceLd = getServiceLd('en');
