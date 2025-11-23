import { setRequestLocale } from 'next-intl/server';
import { getTranslations } from 'next-intl/server';
import { WebDevelopmentContent } from '@/app/(components)/web-development/WebDevelopmentContent';
import { getWebDevelopmentServiceLd, getBreadcrumbLd } from '@/app/(seo)/jsonld';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale });
  const siteUrl = process.env.SITE_URL || 'https://vetaps.com';
  const isArabic = locale === 'ar';
  
  return {
    title: isArabic ? `${t('WEBDEV1')} - VETAP` : `${t('WEBDEV1')} - VETAP`,
    description: t('WEBDEV2'),
    openGraph: {
      title: isArabic ? `${t('WEBDEV1')} - VETAP` : `${t('WEBDEV1')} - VETAP`,
      description: t('WEBDEV2'),
      url: `${siteUrl}/${locale}/web-dev`,
      siteName: 'VETAP',
      locale: locale,
      type: 'website',
      images: [
        {
          url: `${siteUrl}/images/og-image.png`,
          width: 1200,
          height: 630,
          alt: isArabic ? 'تطوير المواقع - VETAP' : 'Web Development - VETAP',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: isArabic ? `${t('WEBDEV1')} - VETAP` : `${t('WEBDEV1')} - VETAP`,
      description: t('WEBDEV2'),
      images: [`${siteUrl}/images/og-image.png`],
    },
    alternates: {
      canonical: `${siteUrl}/${locale}/web-dev`,
      languages: {
        'ar': `${siteUrl}/ar/web-dev`,
        'en': `${siteUrl}/en/web-dev`,
      },
    },
  };
}

export default async function WebDevelopmentPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const siteUrl = process.env.SITE_URL || 'https://vetaps.com';
  const isArabic = locale === 'ar';
  
  const webDevServiceLd = getWebDevelopmentServiceLd(locale as 'ar' | 'en');
  const breadcrumbLd = getBreadcrumbLd([
    { name: isArabic ? 'الرئيسية' : 'Home', item: `${siteUrl}/${locale}` },
    { name: isArabic ? 'الخدمات' : 'Services', item: `${siteUrl}/${locale}/services` },
    { name: isArabic ? 'تطوير المواقع' : 'Web Development', item: `${siteUrl}/${locale}/web-dev` },
  ], locale as 'ar' | 'en');
  
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webDevServiceLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />
      <WebDevelopmentContent locale={locale as 'ar' | 'en'} />
    </>
  );
}

