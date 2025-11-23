import { getTranslations } from 'next-intl/server';
import { ForgotPasswordForm } from '@/app/(components)/auth/ForgotPasswordForm';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale });
  const siteUrl = process.env.SITE_URL || 'https://vetaps.com';
  const isArabic = locale === 'ar';
  
  return {
    title: isArabic ? `${t('AUTH12')} - VETAP` : `${t('AUTH12')} - VETAP`,
    description: isArabic 
      ? 'استعد الوصول إلى حسابك في VETAP. أدخل بريدك الإلكتروني لإعادة تعيين كلمة المرور'
      : 'Recover access to your VETAP account. Enter your email to reset your password',
    robots: {
      index: false,
      follow: false,
    },
    openGraph: {
      title: isArabic ? `${t('AUTH12')} - VETAP` : `${t('AUTH12')} - VETAP`,
      description: isArabic 
        ? 'استعد الوصول إلى حسابك'
        : 'Recover access to your account',
      url: `${siteUrl}/${locale}/forgot-password`,
      siteName: 'VETAP',
      locale: locale,
      type: 'website',
    },
    alternates: {
      canonical: `${siteUrl}/${locale}/forgot-password`,
      languages: {
        'ar': `${siteUrl}/ar/forgot-password`,
        'en': `${siteUrl}/en/forgot-password`,
      },
    },
  };
}

export default async function ForgotPasswordPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  
  return <ForgotPasswordForm locale={locale} />;
}

