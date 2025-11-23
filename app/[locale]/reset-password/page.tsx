import { getTranslations } from 'next-intl/server';
import { ResetPasswordForm } from '@/app/(components)/auth/ResetPasswordForm';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale });
  const siteUrl = process.env.SITE_URL || 'https://vetaps.com';
  const isArabic = locale === 'ar';
  
  return {
    title: isArabic ? `${t('AUTH17')} - VETAP` : `${t('AUTH17')} - VETAP`,
    description: isArabic 
      ? 'قم بتعيين كلمة مرور جديدة لحسابك في VETAP'
      : 'Set a new password for your VETAP account',
    robots: {
      index: false,
      follow: false,
    },
    openGraph: {
      title: isArabic ? `${t('AUTH17')} - VETAP` : `${t('AUTH17')} - VETAP`,
      description: isArabic 
        ? 'قم بتعيين كلمة مرور جديدة'
        : 'Set a new password',
      url: `${siteUrl}/${locale}/reset-password`,
      siteName: 'VETAP',
      locale: locale,
      type: 'website',
    },
    alternates: {
      canonical: `${siteUrl}/${locale}/reset-password`,
      languages: {
        'ar': `${siteUrl}/ar/reset-password`,
        'en': `${siteUrl}/en/reset-password`,
      },
    },
  };
}

export default async function ResetPasswordPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  
  return <ResetPasswordForm locale={locale} />;
}

