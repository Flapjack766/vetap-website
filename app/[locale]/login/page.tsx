import { getTranslations } from 'next-intl/server';
import { LoginForm } from '@/app/(components)/auth/LoginForm';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale });
  
  return {
    title: t('AUTH8'),
  };
}

export default async function LoginPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  
  return <LoginForm locale={locale} />;
}

