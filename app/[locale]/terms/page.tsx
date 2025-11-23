import { setRequestLocale } from 'next-intl/server';
import { getTranslations } from 'next-intl/server';
import { getOrganizationLd, getBreadcrumbLd, getTermsOfServicePageLd } from '@/app/(seo)/jsonld';
import { TermsContent } from '@/app/(components)/terms/TermsContent';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const siteUrl = process.env.SITE_URL || 'https://vetaps.com';
  
  return {
    title: locale === 'ar' ? 'شروط الخدمة - VETAP | القواعد والأحكام' : 'Terms of Service - VETAP | Rules & Regulations',
    description: locale === 'ar' 
      ? 'اقرأ شروط الخدمة الخاصة بـ VETAP. القواعد والأحكام التي تحكم استخدامك لخدماتنا'
      : 'Read VETAP terms of service. Rules and regulations that govern your use of our services',
    openGraph: {
      title: locale === 'ar' ? 'شروط الخدمة - VETAP' : 'Terms of Service - VETAP',
      description: locale === 'ar' 
        ? 'القواعد والأحكام'
        : 'Rules & Regulations',
      url: `${siteUrl}/${locale}/terms`,
      siteName: 'VETAP',
      locale: locale,
      type: 'website',
    },
    alternates: {
      canonical: `${siteUrl}/${locale}/terms`,
      languages: {
        'ar': `${siteUrl}/ar/terms`,
        'en': `${siteUrl}/en/terms`,
      },
    },
  };
}

export default async function TermsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const siteUrl = process.env.SITE_URL || 'https://vetaps.com';
  const isArabic = locale === 'ar';
  
  const organizationLd = getOrganizationLd(locale as 'ar' | 'en');
  const breadcrumbLd = getBreadcrumbLd([
    { name: isArabic ? 'الرئيسية' : 'Home', item: `${siteUrl}/${locale}` },
    { name: isArabic ? 'شروط الخدمة' : 'Terms of Service', item: `${siteUrl}/${locale}/terms` },
  ], locale as 'ar' | 'en');
  const termsLd = getTermsOfServicePageLd(locale as 'ar' | 'en');
  
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(termsLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />
      <TermsContent locale={locale as 'ar' | 'en'} />
    </>
  );
}

