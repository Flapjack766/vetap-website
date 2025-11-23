import { setRequestLocale } from 'next-intl/server';
import { CeoHero } from '@/app/(components)/ceo/CeoHero';
import { CeoBio } from '@/app/(components)/ceo/CeoBio';
import { CeoHighlights } from '@/app/(components)/ceo/CeoHighlights';
import { CeoTimeline } from '@/app/(components)/ceo/CeoTimeline';
import { ContactIcons } from '@/app/(components)/ceo/ContactIcons';
import { getCeoMetadata, personLd } from '@/app/(seo)/ceo-seo';
import { getPersonLd, getBreadcrumbLd } from '@/app/(seo)/jsonld';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return getCeoMetadata(locale as 'ar' | 'en');
}

export default async function CeoPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const siteUrl = process.env.SITE_URL || 'https://vetaps.com';
  const isArabic = locale === 'ar';
  
  const personLdData = getPersonLd(locale as 'ar' | 'en');
  const breadcrumbLd = getBreadcrumbLd([
    { name: isArabic ? 'الرئيسية' : 'Home', item: `${siteUrl}/${locale}` },
    { name: isArabic ? 'من نحن' : 'About', item: `${siteUrl}/${locale}/about` },
    { name: isArabic ? 'الرئيس التنفيذي' : 'CEO', item: `${siteUrl}/${locale}/ceo` },
  ], locale as 'ar' | 'en');

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(personLdData) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />
      <CeoHero locale={locale as 'ar' | 'en'} />
      <CeoBio />
      <CeoHighlights />
      <CeoTimeline />
      <ContactIcons locale={locale as 'ar' | 'en'} />
    </>
  );
}

