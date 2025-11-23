import { setRequestLocale } from 'next-intl/server';
import { getTranslations } from 'next-intl/server';
import { AboutContent } from '@/app/(components)/about/AboutContent';
import { getAboutPageLd, getOrganizationLd, getBreadcrumbLd } from '@/app/(seo)/jsonld';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale });
  const siteUrl = process.env.SITE_URL || 'https://vetaps.com';
  const isArabic = locale === 'ar';
  
  return {
    title: isArabic ? `${t('ABOUT80')} - VETAP` : `${t('ABOUT80')} - VETAP`,
    description: t('ABOUT81'),
    openGraph: {
      title: isArabic ? `${t('ABOUT80')} - VETAP` : `${t('ABOUT80')} - VETAP`,
      description: t('ABOUT81'),
      url: `${siteUrl}/${locale}/about`,
      siteName: 'VETAP',
      locale: locale,
      type: 'website',
      images: [
        {
          url: `${siteUrl}/images/og-image.png`,
          width: 1200,
          height: 630,
          alt: isArabic ? 'من نحن - VETAP' : 'About VETAP',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: isArabic ? `${t('ABOUT80')} - VETAP` : `${t('ABOUT80')} - VETAP`,
      description: t('ABOUT81'),
      images: [`${siteUrl}/images/og-image.png`],
    },
    alternates: {
      canonical: `${siteUrl}/${locale}/about`,
      languages: {
        'ar': `${siteUrl}/ar/about`,
        'en': `${siteUrl}/en/about`,
      },
    },
  };
}

export default async function AboutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const siteUrl = process.env.SITE_URL || 'https://vetaps.com';
  const isArabic = locale === 'ar';
  
  const aboutPageLd = getAboutPageLd(locale as 'ar' | 'en');
  const organizationLd = getOrganizationLd(locale as 'ar' | 'en');
  const breadcrumbLd = getBreadcrumbLd([
    { name: isArabic ? 'الرئيسية' : 'Home', item: `${siteUrl}/${locale}` },
    { name: isArabic ? 'من نحن' : 'About', item: `${siteUrl}/${locale}/about` },
  ], locale as 'ar' | 'en');
  
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(aboutPageLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />
      <AboutContent locale={locale as 'ar' | 'en'} />
    </>
  );
}
