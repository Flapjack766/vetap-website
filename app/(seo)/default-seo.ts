import { Metadata } from 'next';

export const defaultMetadata: Metadata = {
  metadataBase: new URL(process.env.SITE_URL || 'https://vetaps.com'),
  title: {
    default: 'VETAP — Integrated Digital Solutions',
    template: '%s | VETAP',
  },
  description:
    'Comprehensive digital solutions including websites, NFC smart cards, and modern web technologies. Professional development with Next.js, TypeScript, and cutting-edge tools.',
  keywords: [
    // Company name variations
    'VETAP',
    'vetap',
    'فيتاب',
    'VETAP website',
    'vetap website',
    'VETAP solutions',
    'vetap solutions',
    'شركة فيتاب',
    'VETAP company',
    // Digital solutions
    'integrated digital solutions',
    'حلول رقمية متكاملة',
    'حلول رقمية',
    'digital solutions',
    'comprehensive digital solutions',
    // Web development
    'web development',
    'تطوير مواقع',
    'تطوير مواقع إلكترونية',
    'برمجة مواقع',
    'تصميم مواقع',
    'website development',
    'website design',
    'custom web development',
    'تطوير ويب مخصص',
    'تصميم مواقع احترافي',
    // Technologies
    'Next.js',
    'TypeScript',
    'React',
    'modern web technologies',
    'تقنيات ويب حديثة',
    // SEO & Performance
    'SEO optimization',
    'تحسين محركات البحث',
    'سيو',
    'SEO',
    'ultra-fast websites',
    'مواقع سريعة',
    'fast websites',
    'performance optimization',
    'تحسين الأداء',
    // Security
    'secure websites',
    'مواقع آمنة',
    'website security',
    'أمان المواقع',
    // NFC Cards
    'NFC smart cards',
    'بطاقات NFC ذكية',
    'بطاقات NFC',
    'NFC business cards',
    'بطاقات أعمال NFC',
    'NFC review cards',
    'بطاقات تقييم NFC',
    'smart business cards',
    'بطاقات أعمال ذكية',
    'Google Maps review cards',
    'بطاقات تقييم Google Maps',
    // Services
    'elite websites',
    'مواقع نخبوية',
    'professional web development',
    'تطوير ويب احترافي',
    'brand-grade websites',
    'مواقع بمستوى العلامات',
    'website migration',
    'ترحيل المواقع',
    'website optimization',
    'تحسين المواقع',
    // Accessibility
    'accessible websites',
    'مواقع متاحة',
    'accessibility',
    'الوصولية',
    // Arabic keywords
    'شركة تطوير مواقع',
    'مطور مواقع',
    'مصمم مواقع',
    'شركة برمجة',
    'حلول ويب',
    'تطوير تطبيقات ويب',
    'تصميم وتطوير',
    'خدمات رقمية',
    'حلول تقنية',
    'مواقع احترافية',
    'مواقع عصرية',
    'تطوير سريع',
    'مواقع متجاوبة',
    'responsive websites',
    'مواقع متعددة اللغات',
    'multilingual websites',
  ],
  authors: [{ name: 'VETAP', url: 'https://vetaps.com' }],
  creator: 'VETAP',
  publisher: 'VETAP',
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/icons/icons.png', sizes: '512x512', type: 'image/png' },
    ],
    shortcut: '/favicon.ico',
    apple: '/icons/logo.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'VETAP',
  },
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://vetaps.com',
    siteName: 'VETAP',
    title: 'VETAP — Integrated Digital Solutions',
    description:
      'Comprehensive digital solutions including websites, NFC smart cards, and modern web technologies. Professional development with Next.js and TypeScript.',
    images: [
      {
        url: '/images/og-image.png',
        width: 1200,
        height: 630,
        alt: 'VETAP',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'VETAP — Integrated Digital Solutions',
    description:
      'Comprehensive digital solutions including websites, NFC smart cards, and modern web technologies. Professional development with Next.js and TypeScript.',
    images: ['/images/og-image.png'],
    creator: '@vetap',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: '/',
    languages: {
      en: '/en',
      ar: '/ar',
    },
  },
  verification: {
    google: 'your-google-verification-code',
  },
};

export function getLocalizedMetadata(locale: string): Metadata {
  const isArabic = locale === 'ar';
  
  return {
    ...defaultMetadata,
    title: {
      default: isArabic ? 'VETAP — حلول رقمية متكاملة' : 'VETAP — Integrated Digital Solutions',
      template: isArabic ? '%s | VETAP' : '%s | VETAP',
    },
    description: isArabic
      ? 'حلول رقمية شاملة تشمل المواقع الإلكترونية، بطاقات NFC الذكية، وتقنيات الويب الحديثة. تطوير احترافي مع Next.js و TypeScript وأدوات متطورة.'
      : 'Comprehensive digital solutions including websites, NFC smart cards, and modern web technologies. Professional development with Next.js, TypeScript, and cutting-edge tools.',
    appleWebApp: {
      capable: true,
      statusBarStyle: 'black-translucent',
      title: 'VETAP',
    },
    openGraph: {
      ...defaultMetadata.openGraph,
      locale: isArabic ? 'ar_SA' : 'en_US',
      title: isArabic ? 'VETAP — حلول رقمية متكاملة' : 'VETAP — Integrated Digital Solutions',
      description: isArabic
        ? 'حلول رقمية شاملة تشمل المواقع الإلكترونية، بطاقات NFC الذكية، وتقنيات الويب الحديثة. تطوير احترافي مع Next.js و TypeScript وأدوات متطورة.'
        : 'Comprehensive digital solutions including websites, NFC smart cards, and modern web technologies. Professional development with Next.js and TypeScript.',
    },
  };
}

