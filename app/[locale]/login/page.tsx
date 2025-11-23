import { getTranslations } from 'next-intl/server';
import { LoginForm } from '@/app/(components)/auth/LoginForm';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale });
  const siteUrl = process.env.SITE_URL || 'https://vetaps.com';
  const isArabic = locale === 'ar';
  
  return {
    title: isArabic ? `${t('AUTH8')} - VETAP` : `${t('AUTH8')} - VETAP`,
    description: isArabic 
      ? 'سجل الدخول إلى حسابك في VETAP للوصول إلى لوحة التحكم وإدارة بروفايلاتك'
      : 'Sign in to your VETAP account to access your dashboard and manage your profiles',
    robots: {
      index: false,
      follow: false,
    },
    openGraph: {
      title: isArabic ? `${t('AUTH8')} - VETAP` : `${t('AUTH8')} - VETAP`,
      description: isArabic 
        ? 'سجل الدخول إلى حسابك في VETAP'
        : 'Sign in to your VETAP account',
      url: `${siteUrl}/${locale}/login`,
      siteName: 'VETAP',
      locale: locale,
      type: 'website',
    },
    alternates: {
      canonical: `${siteUrl}/${locale}/login`,
      languages: {
        'ar': `${siteUrl}/ar/login`,
        'en': `${siteUrl}/en/login`,
      },
    },
  };
}

export default async function LoginPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  
  return <LoginForm locale={locale} />;
}

