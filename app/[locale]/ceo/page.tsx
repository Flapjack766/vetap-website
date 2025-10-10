import { setRequestLocale } from 'next-intl/server';
import { CeoHero } from '@/app/(components)/ceo/CeoHero';
import { CeoBio } from '@/app/(components)/ceo/CeoBio';
import { CeoHighlights } from '@/app/(components)/ceo/CeoHighlights';
import { CeoTimeline } from '@/app/(components)/ceo/CeoTimeline';
import { ContactIcons } from '@/app/(components)/ceo/ContactIcons';
import { getCeoMetadata, personLd } from '@/app/(seo)/ceo-seo';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return getCeoMetadata(locale as 'ar' | 'en');
}

export default async function CeoPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(personLd) }}
      />
      <CeoHero locale={locale as 'ar' | 'en'} />
      <CeoBio />
      <CeoHighlights />
      <CeoTimeline />
      <ContactIcons locale={locale as 'ar' | 'en'} />
    </>
  );
}

