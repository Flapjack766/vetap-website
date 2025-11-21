import { getTranslations } from 'next-intl/server';
import { ForgotPasswordForm } from '@/app/(components)/auth/ForgotPasswordForm';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale });
  
  return {
    title: t('AUTH12'),
  };
}

export default async function ForgotPasswordPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  
  return <ForgotPasswordForm locale={locale} />;
}

