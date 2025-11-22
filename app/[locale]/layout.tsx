import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { locales } from '@/lib/i18n/config';
import { getLocalizedMetadata } from '@/app/(seo)/default-seo';
import { getDirection } from '@/lib/i18n/helper';
import { Header } from '@/app/(components)/Header';
import { Footer } from '@/app/(components)/Footer';
import { LoadingBar } from '@/app/(components)/LoadingBar';
import '@/styles/globals.css';
import '@/styles/themes.css';

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return getLocalizedMetadata(locale);
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!locales.includes(locale as any)) {
    notFound();
  }

  const messages = await getMessages();
  const direction = getDirection(locale as 'ar' | 'en');

  return (
    <html lang={locale} dir={direction} className="dark overflow-x-hidden">
      <body className="overflow-x-hidden">
        <NextIntlClientProvider messages={messages}>
          <LoadingBar />
          <a href="#main-content" className="skip-to-content">
            Skip to content
          </a>
          <Header />
          <main id="main-content" className="overflow-x-hidden">{children}</main>
          <Footer />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}

