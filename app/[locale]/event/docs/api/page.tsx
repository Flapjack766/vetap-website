import { APIDocumentation } from '@/app/(components)/event/docs/APIDocumentation';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const isArabic = locale === 'ar';

  return {
    title: isArabic ? 'توثيق API - VETAP Event' : 'API Documentation - VETAP Event',
    description: isArabic
      ? 'توثيق شامل لـ VETAP Event API للمطورين'
      : 'Comprehensive VETAP Event API documentation for developers',
  };
}

export default async function APIDocsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const messages = await getMessages();

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <div className="min-h-screen bg-background py-8 px-4" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
        <APIDocumentation locale={locale} />
      </div>
    </NextIntlClientProvider>
  );
}

