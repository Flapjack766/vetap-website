import { setRequestLocale } from 'next-intl/server';
import { getTranslations } from 'next-intl/server';
import { NFCContent } from '@/app/(components)/nfc/NFCContent';
import { getBreadcrumbLd } from '@/app/(seo)/jsonld';

// Revalidate every 5 minutes for business card page
export const revalidate = 300;

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale });
  const siteUrl = process.env.SITE_URL || 'https://vetaps.com';
  const isArabic = locale === 'ar';
  
  return {
    title: isArabic ? `${t('NFC2')} - VETAP` : `${t('NFC2')} - VETAP`,
    description: t('NFC3'),
    openGraph: {
      title: isArabic ? `${t('NFC2')} - VETAP` : `${t('NFC2')} - VETAP`,
      description: t('NFC3'),
      url: `${siteUrl}/${locale}/business-card`,
      siteName: 'VETAP',
      locale: locale,
      type: 'website',
      images: [
        {
          url: `${siteUrl}/images/og-image.png`,
          width: 1200,
          height: 630,
          alt: isArabic ? 'بطاقات أعمال ذكية NFC' : 'Smart NFC Business Cards',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: isArabic ? `${t('NFC2')} - VETAP` : `${t('NFC2')} - VETAP`,
      description: t('NFC3'),
      images: [`${siteUrl}/images/og-image.png`],
    },
    alternates: {
      canonical: `${siteUrl}/${locale}/business-card`,
      languages: {
        'ar': `${siteUrl}/ar/business-card`,
        'en': `${siteUrl}/en/business-card`,
      },
    },
  };
}

export default async function NFCBusinessCardPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const siteUrl = process.env.SITE_URL || 'https://vetaps.com';
  const isArabic = locale === 'ar';
  
  const breadcrumbLd = getBreadcrumbLd([
    { name: isArabic ? 'الرئيسية' : 'Home', item: `${siteUrl}/${locale}` },
    { name: isArabic ? 'الخدمات' : 'Services', item: `${siteUrl}/${locale}/services` },
    { name: isArabic ? 'بطاقات أعمال NFC' : 'NFC Business Cards', item: `${siteUrl}/${locale}/business-card` },
  ], locale as 'ar' | 'en');
  
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />
      <NFCContent locale={locale as 'ar' | 'en'} />
    </>
  );
}

