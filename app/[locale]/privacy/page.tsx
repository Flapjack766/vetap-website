import { setRequestLocale } from 'next-intl/server';
import { getTranslations } from 'next-intl/server';
import { getOrganizationLd, getBreadcrumbLd, getPrivacyPolicyPageLd } from '@/app/(seo)/jsonld';
import { PrivacyContent } from '@/app/(components)/privacy/PrivacyContent';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const siteUrl = process.env.SITE_URL || 'https://vetaps.com';
  
  return {
    title: locale === 'ar' ? 'سياسة الخصوصية - VETAP | حماية بياناتك الشخصية' : 'Privacy Policy - VETAP | Protecting Your Personal Data',
    description: locale === 'ar' 
      ? 'تعرف على كيفية جمع واستخدام وحماية بياناتك الشخصية في VETAP. نحن ملتزمون بحماية خصوصيتك'
      : 'Learn how we collect, use, and protect your personal data at VETAP. We are committed to protecting your privacy',
    openGraph: {
      title: locale === 'ar' ? 'سياسة الخصوصية - VETAP' : 'Privacy Policy - VETAP',
      description: locale === 'ar' 
        ? 'حماية بياناتك الشخصية'
        : 'Protecting Your Personal Data',
      url: `${siteUrl}/${locale}/privacy`,
      siteName: 'VETAP',
      locale: locale,
      type: 'website',
    },
    alternates: {
      canonical: `${siteUrl}/${locale}/privacy`,
      languages: {
        'ar': `${siteUrl}/ar/privacy`,
        'en': `${siteUrl}/en/privacy`,
      },
    },
  };
}

export default async function PrivacyPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const siteUrl = process.env.SITE_URL || 'https://vetaps.com';
  const isArabic = locale === 'ar';
  
  const organizationLd = getOrganizationLd(locale as 'ar' | 'en');
  const breadcrumbLd = getBreadcrumbLd([
    { name: isArabic ? 'الرئيسية' : 'Home', item: `${siteUrl}/${locale}` },
    { name: isArabic ? 'سياسة الخصوصية' : 'Privacy Policy', item: `${siteUrl}/${locale}/privacy` },
  ], locale as 'ar' | 'en');
  const privacyLd = getPrivacyPolicyPageLd(locale as 'ar' | 'en');
  
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(privacyLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />
      <PrivacyContent locale={locale as 'ar' | 'en'} />
    </>
  );
}

