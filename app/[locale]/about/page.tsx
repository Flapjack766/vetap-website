import { setRequestLocale } from 'next-intl/server';
import { getTranslations } from 'next-intl/server';
import { AboutContent } from '@/app/(components)/about/AboutContent';
import { getAboutPageLd, getOrganizationLd, getBreadcrumbLd } from '@/app/(seo)/jsonld';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale });
  
  return {
    title: t('ABOUT80'),
    description: t('ABOUT81'),
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
