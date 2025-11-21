import { getTranslations } from 'next-intl/server';
import { ResetPasswordForm } from '@/app/(components)/auth/ResetPasswordForm';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale });
  
  return {
    title: t('AUTH17'),
  };
}

export default async function ResetPasswordPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  
  return <ResetPasswordForm locale={locale} />;
}

