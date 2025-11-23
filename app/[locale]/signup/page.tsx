import { getTranslations } from 'next-intl/server';
import { SignUpForm } from '@/app/(components)/auth/SignUpForm';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale });
  const siteUrl = process.env.SITE_URL || 'https://vetaps.com';
  const isArabic = locale === 'ar';
  
  return {
    title: isArabic ? `${t('AUTH1')} - VETAP` : `${t('AUTH1')} - VETAP`,
    description: isArabic 
      ? 'أنشئ حساباً جديداً في VETAP وابدأ في إنشاء بروفايلاتك الرقمية وبطاقات NFC الذكية'
      : 'Create a new account on VETAP and start building your digital profiles and NFC smart cards',
    robots: {
      index: false,
      follow: false,
    },
    openGraph: {
      title: isArabic ? `${t('AUTH1')} - VETAP` : `${t('AUTH1')} - VETAP`,
      description: isArabic 
        ? 'أنشئ حساباً جديداً في VETAP'
        : 'Create a new account on VETAP',
      url: `${siteUrl}/${locale}/signup`,
      siteName: 'VETAP',
      locale: locale,
      type: 'website',
    },
    alternates: {
      canonical: `${siteUrl}/${locale}/signup`,
      languages: {
        'ar': `${siteUrl}/ar/signup`,
        'en': `${siteUrl}/en/signup`,
      },
    },
  };
}

export default async function SignUpPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  
  return <SignUpForm locale={locale} />;
}

