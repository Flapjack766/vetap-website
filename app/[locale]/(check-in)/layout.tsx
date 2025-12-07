import { ReactNode } from 'react';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { locales } from '@/lib/i18n/config';
import { getDirection } from '@/lib/i18n/helper';
import { ToasterProvider } from '@/components/ui/toaster';
import '@/styles/globals.css';
import '@/styles/themes.css';

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

interface CheckInLayoutProps {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}

export default async function CheckInLayout({ children, params }: CheckInLayoutProps) {
  const { locale } = await params;
  
  if (!locales.includes(locale as any)) {
    notFound();
  }

  const messages = await getMessages();
  const direction = getDirection(locale as 'ar' | 'en');

  return (
    <html lang={locale} dir={direction} className="dark overflow-x-hidden">
      <body className="overflow-x-hidden bg-background">
        <NextIntlClientProvider messages={messages}>
          <ToasterProvider>
            {children}
          </ToasterProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}

