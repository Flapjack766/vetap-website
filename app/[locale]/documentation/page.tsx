import { setRequestLocale } from 'next-intl/server';
import { getTranslations } from 'next-intl/server';
import { getOrganizationLd, getBreadcrumbLd } from '@/app/(seo)/jsonld';
import { DocumentationContent } from '@/app/(components)/documentation/DocumentationContent';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const siteUrl = process.env.SITE_URL || 'https://vetaps.com';
  
  return {
    title: locale === 'ar' ? 'التوثيق - VETAP | دليل شامل للخدمات والمنتجات' : 'Documentation - VETAP | Complete Guide to Services & Products',
    description: locale === 'ar' 
      ? 'دليل شامل لاستخدام خدمات VETAP: بطاقات NFC الذكية، تطوير المواقع، وأدوات الأعمال الرقمية'
      : 'Complete guide to using VETAP services: NFC smart cards, web development, and digital business tools',
    openGraph: {
      title: locale === 'ar' ? 'التوثيق - VETAP' : 'Documentation - VETAP',
      description: locale === 'ar' 
        ? 'دليل شامل للخدمات والمنتجات'
        : 'Complete guide to services and products',
      url: `${siteUrl}/${locale}/documentation`,
      siteName: 'VETAP',
      locale: locale,
      type: 'website',
    },
    alternates: {
      canonical: `${siteUrl}/${locale}/documentation`,
      languages: {
        'ar': `${siteUrl}/ar/documentation`,
        'en': `${siteUrl}/en/documentation`,
      },
    },
  };
}

export default async function DocumentationPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const siteUrl = process.env.SITE_URL || 'https://vetaps.com';
  const isArabic = locale === 'ar';
  
  const organizationLd = getOrganizationLd(locale as 'ar' | 'en');
  const breadcrumbLd = getBreadcrumbLd([
    { name: isArabic ? 'الرئيسية' : 'Home', item: `${siteUrl}/${locale}` },
    { name: isArabic ? 'التوثيق' : 'Documentation', item: `${siteUrl}/${locale}/documentation` },
  ], locale as 'ar' | 'en');
  
  const documentationLd = {
    '@context': 'https://schema.org',
    '@type': 'TechArticle',
    headline: isArabic ? 'توثيق خدمات VETAP' : 'VETAP Services Documentation',
    description: isArabic
      ? 'دليل شامل لاستخدام جميع خدمات ومنتجات VETAP'
      : 'Complete guide to using all VETAP services and products',
    author: {
      '@id': `${siteUrl}/#organization`,
    },
    publisher: {
      '@id': `${siteUrl}/#organization`,
    },
    datePublished: '2024-01-01',
    dateModified: new Date().toISOString().split('T')[0],
    inLanguage: locale,
  };
  
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(documentationLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />
      <DocumentationContent locale={locale as 'ar' | 'en'} />
    </>
  );
}

