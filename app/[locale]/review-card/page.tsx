import { setRequestLocale } from 'next-intl/server';
import { getTranslations } from 'next-intl/server';
import { ReviewContent } from '@/app/(components)/nfc/ReviewContent';
import { getBreadcrumbLd } from '@/app/(seo)/jsonld';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale });
  const siteUrl = process.env.SITE_URL || 'https://vetaps.com';
  const isArabic = locale === 'ar';
  
  return {
    title: isArabic ? `${t('REVIEW2')} - VETAP` : `${t('REVIEW2')} - VETAP`,
    description: t('REVIEW3'),
    openGraph: {
      title: isArabic ? `${t('REVIEW2')} - VETAP` : `${t('REVIEW2')} - VETAP`,
      description: t('REVIEW3'),
      url: `${siteUrl}/${locale}/review-card`,
      siteName: 'VETAP',
      locale: locale,
      type: 'website',
      images: [
        {
          url: `${siteUrl}/images/og-image.png`,
          width: 1200,
          height: 630,
          alt: isArabic ? 'بطاقة تقييم قوقل ماب ذكية NFC' : 'NFC Google Maps Review Cards',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: isArabic ? `${t('REVIEW2')} - VETAP` : `${t('REVIEW2')} - VETAP`,
      description: t('REVIEW3'),
      images: [`${siteUrl}/images/og-image.png`],
    },
    alternates: {
      canonical: `${siteUrl}/${locale}/review-card`,
      languages: {
        'ar': `${siteUrl}/ar/review-card`,
        'en': `${siteUrl}/en/review-card`,
      },
    },
  };
}

export default async function NFCReviewCardPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const siteUrl = process.env.SITE_URL || 'https://vetaps.com';
  const isArabic = locale === 'ar';
  
  const breadcrumbLd = getBreadcrumbLd([
    { name: isArabic ? 'الرئيسية' : 'Home', item: `${siteUrl}/${locale}` },
    { name: isArabic ? 'الخدمات' : 'Services', item: `${siteUrl}/${locale}/services` },
    { name: isArabic ? 'بطاقات تقييم NFC' : 'NFC Review Cards', item: `${siteUrl}/${locale}/review-card` },
  ], locale as 'ar' | 'en');
  
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />
      <ReviewContent locale={locale as 'ar' | 'en'} />
    </>
  );
}

