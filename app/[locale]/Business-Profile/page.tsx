import { setRequestLocale } from 'next-intl/server';
import { getTranslations } from 'next-intl/server';
import { ProfileContent } from '@/app/(components)/profile/ProfileContent';
import { getBreadcrumbLd } from '@/app/(seo)/jsonld';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale });
  const siteUrl = process.env.SITE_URL || 'https://vetaps.com';
  const isArabic = locale === 'ar';
  
  return {
    title: isArabic ? `${t('NFC51')} - VETAP` : `${t('NFC51')} - VETAP`,
    description: t('NFC52'),
    openGraph: {
      title: isArabic ? `${t('NFC51')} - VETAP` : `${t('NFC51')} - VETAP`,
      description: t('NFC52'),
      url: `${siteUrl}/${locale}/Business-Profile`,
      siteName: 'VETAP',
      locale: locale,
      type: 'website',
      images: [
        {
          url: `${siteUrl}/images/og-image.png`,
          width: 1200,
          height: 630,
          alt: isArabic ? 'صفحة بروفايل أعمال احترافية' : 'Professional Business Profile Page',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: isArabic ? `${t('NFC51')} - VETAP` : `${t('NFC51')} - VETAP`,
      description: t('NFC52'),
      images: [`${siteUrl}/images/og-image.png`],
    },
    alternates: {
      canonical: `${siteUrl}/${locale}/Business-Profile`,
      languages: {
        'ar': `${siteUrl}/ar/Business-Profile`,
        'en': `${siteUrl}/en/Business-Profile`,
      },
    },
  };
}

export default async function BusinessProfilePagePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const siteUrl = process.env.SITE_URL || 'https://vetaps.com';
  const isArabic = locale === 'ar';
  
  const breadcrumbLd = getBreadcrumbLd([
    { name: isArabic ? 'الرئيسية' : 'Home', item: `${siteUrl}/${locale}` },
    { name: isArabic ? 'الخدمات' : 'Services', item: `${siteUrl}/${locale}/services` },
    { name: isArabic ? 'صفحة بروفايل الأعمال' : 'Business Profile Page', item: `${siteUrl}/${locale}/Business-Profile` },
  ], locale as 'ar' | 'en');
  
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />
      <ProfileContent locale={locale as 'ar' | 'en'} />
    </>
  );
}

