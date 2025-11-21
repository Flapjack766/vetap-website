import { getTranslations } from 'next-intl/server';
import { SignUpForm } from '@/app/(components)/auth/SignUpForm';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale });
  
  return {
    title: t('AUTH1'),
  };
}

export default async function SignUpPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  
  return <SignUpForm locale={locale} />;
}

