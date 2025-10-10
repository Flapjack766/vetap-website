import { Metadata } from 'next';

export const defaultMetadata: Metadata = {
  metadataBase: new URL(process.env.SITE_URL || 'https://vetaps.com'),
  title: {
    default: 'VETAP — Elite Website Design & Engineering',
    template: '%s | VETAP',
  },
  description:
    'VETAP builds ultra-fast, secure, SEO-optimized websites. Professional web development with Next.js, TypeScript, and modern technologies.',
  keywords: [
    'web development',
    'Next.js',
    'TypeScript',
    'React',
    'SEO optimization',
    'website design',
    'VETAP',
    'elite websites',
    'fast websites',
    'secure websites',
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
    title: 'VETAP — Elite Website Design & Engineering',
    description:
      'We build ultra-fast, secure, SEO-optimized websites. Professional web development with Next.js and TypeScript.',
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
    title: 'VETAP — Elite Website Design & Engineering',
    description:
      'We build ultra-fast, secure, SEO-optimized websites. Professional web development with Next.js and TypeScript.',
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
      default: isArabic ? 'VETAP — هندسة مواقع نخبوية' : 'VETAP — Elite Website Design & Engineering',
      template: isArabic ? '%s | VETAP' : '%s | VETAP',
    },
    description: isArabic
      ? 'VETAP نبني مواقع فائقة السرعة وآمنة ومحسّنة للسيو. تطوير ويب احترافي مع Next.js و TypeScript.'
      : 'VETAP builds ultra-fast, secure, SEO-optimized websites. Professional web development with Next.js, TypeScript, and modern technologies.',
    openGraph: {
      ...defaultMetadata.openGraph,
      locale: isArabic ? 'ar_SA' : 'en_US',
      title: isArabic ? 'VETAP — هندسة مواقع نخبوية' : 'VETAP — Elite Website Design & Engineering',
      description: isArabic
        ? 'نبني مواقع فائقة السرعة وآمنة ومحسّنة للسيو. تطوير ويب احترافي مع Next.js و TypeScript.'
        : 'We build ultra-fast, secure, SEO-optimized websites. Professional web development with Next.js and TypeScript.',
    },
  };
}

