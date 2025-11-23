import { setRequestLocale } from 'next-intl/server';
import { getTranslations } from 'next-intl/server';
import { WebDevelopmentContent } from '@/app/(components)/web-development/WebDevelopmentContent';
import { getWebDevelopmentServiceLd, getBreadcrumbLd } from '@/app/(seo)/jsonld';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale });
  
  return {
    title: t('WEBDEV1'),
    description: t('WEBDEV2'),
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

