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
        telephone: '+905346146038',
        availableLanguage: ['English', 'Arabic', 'العربية'],
        areaServed: 'Worldwide',
      },
      {
        '@type': 'ContactPoint',
        contactType: 'Sales',
        email: 'info@vetaps.com',
        telephone: '+905346146038',
        availableLanguage: ['English', 'Arabic', 'العربية'],
        areaServed: 'Worldwide',
      },
    ],
    sameAs: [
      'https://x.com/vetap_official',
      'https://www.linkedin.com/in/vetap',
    ],
    areaServed: {
      '@type': 'Country',
      name: 'Worldwide',
    },
    numberOfEmployees: {
      '@type': 'QuantitativeValue',
      value: '10-50',
    },
    knowsAbout: [
      'Web Development',
      'Website Design',
      'NFC Technology',
      'Next.js',
      'TypeScript',
      'React',
      'SEO Optimization',
      'Digital Solutions',
    ],
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
    alternateName: 'Verified Tap',
    publisher: {
      '@id': `${siteUrl}/#organization`,
    },
    copyrightHolder: {
      '@id': `${siteUrl}/#organization`,
    },
    copyrightYear: new Date().getFullYear(),
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
    telephone: '+905346146038',
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

// Blog Page Schema - Enhanced
export function getBlogPageLd(locale: 'ar' | 'en' = 'en') {
  const isArabic = locale === 'ar';
  return {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    '@id': `${siteUrl}/${locale}/blog#blog`,
    name: isArabic ? 'مدونة VETAP' : 'VETAP Blog',
    description: isArabic
      ? 'مقالات احترافية عن تطوير المواقع، تقنيات NFC، SEO، وأفضل الممارسات في التطوير الرقمي من خبراء VETAP'
      : 'Professional articles on web development, NFC technology, SEO, and digital development best practices from VETAP experts',
    url: `${siteUrl}/${locale}/blog`,
    publisher: {
      '@id': `${siteUrl}/#organization`,
    },
    inLanguage: locale,
    about: {
      '@type': 'Thing',
      name: isArabic ? 'تطوير المواقع والتقنيات الرقمية' : 'Web Development and Digital Technologies',
    },
    keywords: isArabic
      ? 'تطوير المواقع، Next.js، React، NFC، SEO، تقنيات الويب، برمجة، تطوير تطبيقات'
      : 'web development, Next.js, React, NFC, SEO, web technologies, programming, app development',
  };
}

// Blog Posting Schema - Enhanced with comprehensive metadata
export function getBlogPostingLd(
  postId: number,
  title: string,
  excerpt: string,
  datePublished: string,
  dateModified: string,
  authorName: string = 'VETAP Team',
  locale: 'ar' | 'en' = 'en'
) {
  const isArabic = locale === 'ar';
  const postUrl = `${siteUrl}/${locale}/blog/${postId}`;
  
  // Determine article category based on postId
  let articleSection = '';
  let keywords = '';
  
  if (postId === 1) {
    articleSection = isArabic ? 'تطوير الويب' : 'Web Development';
    keywords = isArabic
      ? 'Next.js 15، React Server Components، Partial Prerendering، تطوير الويب، JavaScript'
      : 'Next.js 15, React Server Components, Partial Prerendering, Web Development, JavaScript';
  } else if (postId === 2) {
    articleSection = isArabic ? 'تقنية NFC' : 'NFC Technology';
    keywords = isArabic
      ? 'بطاقات NFC، Near Field Communication، بطاقات أعمال ذكية، تقنية لاسلكية'
      : 'NFC cards, Near Field Communication, smart business cards, wireless technology';
  } else if (postId === 3) {
    articleSection = isArabic ? 'تحسين محركات البحث' : 'SEO';
    keywords = isArabic
      ? 'SEO، تحسين محركات البحث، Structured Data، Core Web Vitals، تحسين الموقع'
      : 'SEO, search engine optimization, Structured Data, Core Web Vitals, website optimization';
  } else if (postId === 4) {
    articleSection = isArabic ? 'أمان المواقع' : 'Website Security';
    keywords = isArabic
      ? 'أمان المواقع، Row Level Security، CSP، التشفير، حماية البيانات'
      : 'website security, Row Level Security, CSP, encryption, data protection';
  } else if (postId === 5) {
    articleSection = isArabic ? 'TypeScript' : 'TypeScript';
    keywords = isArabic
      ? 'TypeScript، JavaScript، برمجة، تطوير الويب، Type Safety'
      : 'TypeScript, JavaScript, programming, web development, type safety';
  } else if (postId === 6) {
    articleSection = isArabic ? 'أداء المواقع' : 'Website Performance';
    keywords = isArabic
      ? 'أداء المواقع، تحسين الأداء، Core Web Vitals، سرعة التحميل، تحسين الصور'
      : 'website performance, performance optimization, Core Web Vitals, load speed, image optimization';
  }
  
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    '@id': `${postUrl}#blogposting`,
    headline: title,
    description: excerpt,
    url: postUrl,
    datePublished: datePublished,
    dateModified: dateModified,
    author: {
      '@type': 'Organization',
      '@id': `${siteUrl}/#organization`,
      name: authorName,
    },
    publisher: {
      '@id': `${siteUrl}/#organization`,
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': postUrl,
    },
    articleSection: articleSection,
    keywords: keywords,
    inLanguage: locale,
    about: {
      '@type': 'Thing',
      name: articleSection,
    },
    isPartOf: {
      '@id': `${siteUrl}/${locale}/blog#blog`,
    },
  };
}

// Documentation Page Schema - Enhanced as TechArticle/HowTo
export function getDocumentationPageLd(locale: 'ar' | 'en' = 'en') {
  const isArabic = locale === 'ar';
  return {
    '@context': 'https://schema.org',
    '@type': 'TechArticle',
    '@id': `${siteUrl}/${locale}/documentation#techarticle`,
    headline: isArabic ? 'توثيق خدمات VETAP' : 'VETAP Services Documentation',
    description: isArabic
      ? 'دليل شامل لاستخدام جميع خدمات ومنتجات VETAP: بطاقات NFC الذكية، تطوير المواقع، وأدوات الأعمال الرقمية'
      : 'Complete guide to using all VETAP services and products: NFC smart cards, web development, and digital business tools',
    url: `${siteUrl}/${locale}/documentation`,
    author: {
      '@id': `${siteUrl}/#organization`,
    },
    publisher: {
      '@id': `${siteUrl}/#organization`,
    },
    dateModified: new Date().toISOString().split('T')[0],
    inLanguage: locale,
    about: [
      {
        '@type': 'Thing',
        name: isArabic ? 'بطاقات NFC الذكية' : 'NFC Smart Cards',
      },
      {
        '@type': 'Thing',
        name: isArabic ? 'تطوير المواقع' : 'Web Development',
      },
      {
        '@type': 'Thing',
        name: isArabic ? 'أدوات الأعمال الرقمية' : 'Digital Business Tools',
      },
    ],
    keywords: isArabic
      ? 'توثيق، دليل، بطاقات NFC، تطوير المواقع، أدوات رقمية، VETAP'
      : 'documentation, guide, NFC cards, web development, digital tools, VETAP',
  };
}

// Support Page Schema - Enhanced with Service and FAQPage
export function getSupportPageLd(locale: 'ar' | 'en' = 'en') {
  const isArabic = locale === 'ar';
  return {
    '@context': 'https://schema.org',
    '@type': ['WebPage', 'Service'],
    '@id': `${siteUrl}/${locale}/support#support`,
    name: isArabic ? 'مركز الدعم - VETAP' : 'Support Center - VETAP',
    description: isArabic
      ? 'احصل على المساعدة والدعم الفني من فريق VETAP. الأسئلة الشائعة، أدلة الاستخدام، وطرق التواصل'
      : 'Get help and technical support from VETAP team. FAQs, usage guides, and contact methods',
    url: `${siteUrl}/${locale}/support`,
    provider: {
      '@id': `${siteUrl}/#organization`,
    },
    serviceType: isArabic ? 'دعم فني' : 'Technical Support',
    areaServed: {
      '@type': 'Country',
      name: 'Worldwide',
    },
    availableChannel: {
      '@type': 'ServiceChannel',
      serviceUrl: `${siteUrl}/${locale}/support`,
      serviceType: isArabic ? 'دعم عبر الإنترنت' : 'Online Support',
      availableLanguage: ['English', 'Arabic', 'العربية'],
    },
    inLanguage: locale,
    about: {
      '@type': 'Thing',
      name: isArabic ? 'الدعم الفني والمساعدة' : 'Technical Support and Help',
    },
  };
}

// Privacy Policy Page Schema
export function getPrivacyPolicyPageLd(locale: 'ar' | 'en' = 'en') {
  const isArabic = locale === 'ar';
  return {
    '@context': 'https://schema.org',
    '@type': ['WebPage', 'PrivacyPolicy'],
    '@id': `${siteUrl}/${locale}/privacy#privacypolicy`,
    name: isArabic ? 'سياسة الخصوصية - VETAP' : 'Privacy Policy - VETAP',
    description: isArabic
      ? 'تعرف على كيفية جمع واستخدام وحماية بياناتك الشخصية في VETAP. نحن ملتزمون بحماية خصوصيتك'
      : 'Learn how we collect, use, and protect your personal data at VETAP. We are committed to protecting your privacy',
    url: `${siteUrl}/${locale}/privacy`,
    publisher: {
      '@id': `${siteUrl}/#organization`,
    },
    dateModified: new Date().toISOString().split('T')[0],
    inLanguage: locale,
    about: {
      '@type': 'Thing',
      name: isArabic ? 'الخصوصية وحماية البيانات' : 'Privacy and Data Protection',
    },
    keywords: isArabic
      ? 'سياسة الخصوصية، حماية البيانات، الخصوصية، GDPR، حماية المعلومات'
      : 'privacy policy, data protection, privacy, GDPR, information security',
    mainEntity: {
      '@id': `${siteUrl}/#organization`,
    },
  };
}

// Terms of Service Page Schema
export function getTermsOfServicePageLd(locale: 'ar' | 'en' = 'en') {
  const isArabic = locale === 'ar';
  return {
    '@context': 'https://schema.org',
    '@type': ['WebPage', 'TermsOfService'],
    '@id': `${siteUrl}/${locale}/terms#termsofservice`,
    name: isArabic ? 'شروط الخدمة - VETAP' : 'Terms of Service - VETAP',
    description: isArabic
      ? 'اقرأ شروط الخدمة الخاصة بـ VETAP. القواعد والأحكام التي تحكم استخدامك لخدماتنا'
      : 'Read VETAP terms of service. Rules and regulations that govern your use of our services',
    url: `${siteUrl}/${locale}/terms`,
    publisher: {
      '@id': `${siteUrl}/#organization`,
    },
    dateModified: new Date().toISOString().split('T')[0],
    inLanguage: locale,
    about: {
      '@type': 'Thing',
      name: isArabic ? 'شروط الخدمة والأحكام' : 'Terms of Service and Conditions',
    },
    keywords: isArabic
      ? 'شروط الخدمة، الأحكام، القواعد، اتفاقية الاستخدام، الشروط والأحكام'
      : 'terms of service, terms and conditions, rules, user agreement, legal terms',
    mainEntity: {
      '@id': `${siteUrl}/#organization`,
    },
  };
}

// Legacy exports for backward compatibility
export const organizationLd = getOrganizationLd('en');
export const websiteLd = getWebsiteLd('en');
export const serviceLd = getServiceLd('en');
