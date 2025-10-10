import { Metadata } from 'next';
import { ceoData } from '@/lib/ceo/data';

const siteUrl = process.env.SITE_URL || 'https://vetaps.com';

export function getCeoMetadata(locale: 'ar' | 'en'): Metadata {
  const isArabic = locale === 'ar';
  const name = ceoData.name[locale];
  const title = isArabic
    ? `${name} - مؤسس و الرئيس التنفيذي | VETAP`
    : `${name} - Founder & CEO | VETAP`;
  const description = isArabic
    ? 'أحمد الزباجي مؤسس و الرئيس التنفيذي لشركة VETAP. يقود تقديم مواقع عالية الأداء وتجارب علامة فاخرة.'
    : 'Ahmed Alzbaji is the Founder & CEO of VETAP. Leading delivery of high-performance websites and premium brand experiences.';

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'profile',
      images: [
        {
          url: `${siteUrl}/images/ceo.jpg`,
          width: 800,
          height: 800,
          alt: name,
        },
      ],
    },
    twitter: {
      card: 'summary',
      title,
      description,
      images: [`${siteUrl}/images/ceo.jpg`],
    },
  };
}

export const personLd = {
  '@context': 'https://schema.org',
  '@type': 'Person',
  name: 'Ahmed Alzbaji',
  givenName: 'Ahmed',
  familyName: 'Alzbaji',
  jobTitle: 'Founder & CEO',
  worksFor: {
    '@type': 'Organization',
    name: 'VETAP',
    url: siteUrl,
  },
  email: ceoData.emails[0],
  telephone: ceoData.phones[0],
  url: `${siteUrl}/ceo`,
  image: `${siteUrl}/images/ceo.jpg`,
  sameAs: [
    ceoData.social.twitter.url,
    ceoData.social.instagram.url,
    ceoData.social.snapchat.url,
  ],
  contactPoint: [
    {
      '@type': 'ContactPoint',
      telephone: ceoData.phones[0],
      contactType: 'Customer Service',
      availableLanguage: ['English', 'Arabic'],
    },
    {
      '@type': 'ContactPoint',
      email: ceoData.emails[0],
      contactType: 'Business Inquiries',
    },
  ],
};

