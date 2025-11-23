import { setRequestLocale } from 'next-intl/server';
import { getTranslations } from 'next-intl/server';
import { HeroShowcase } from '@/app/(components)/HeroShowcase';
import { FeatureGrid } from '@/app/(components)/FeatureGrid';
import { ServiceCards } from '@/app/(components)/ServiceCards';
// import { PortfolioMasonry } from '@/app/(components)/PortfolioMasonry'; // مخفي مؤقتاً
// import { Testimonials } from '@/app/(components)/Testimonials'; // مخفي مؤقتاً
import { CTA } from '@/app/(components)/CTA';
import { getOrganizationLd, getWebsiteLd, getBreadcrumbLd } from '@/app/(seo)/jsonld';

// Revalidate home page every 5 minutes
export const revalidate = 300;

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale });
  const siteUrl = process.env.SITE_URL || 'https://vetaps.com';
  const isArabic = locale === 'ar';
  
  return {
    title: isArabic ? 'VETAP — حلول رقمية متكاملة' : 'VETAP — Integrated Digital Solutions',
    description: t('A2'),
    openGraph: {
      title: isArabic ? 'VETAP — حلول رقمية متكاملة' : 'VETAP — Integrated Digital Solutions',
      description: t('A2'),
      url: `${siteUrl}/${locale}`,
      siteName: 'VETAP',
      locale: locale,
      type: 'website',
      images: [
        {
          url: `${siteUrl}/images/og-image.png`,
          width: 1200,
          height: 630,
          alt: 'VETAP',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: isArabic ? 'VETAP — حلول رقمية متكاملة' : 'VETAP — Integrated Digital Solutions',
      description: t('A2'),
      images: [`${siteUrl}/images/og-image.png`],
    },
    alternates: {
      canonical: `${siteUrl}/${locale}`,
      languages: {
        'ar': `${siteUrl}/ar`,
        'en': `${siteUrl}/en`,
      },
    },
  };
}

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const siteUrl = process.env.SITE_URL || 'https://vetaps.com';
  const isArabic = locale === 'ar';
  
  const organizationLd = getOrganizationLd(locale as 'ar' | 'en');
  const websiteLd = getWebsiteLd(locale as 'ar' | 'en');
  const breadcrumbLd = getBreadcrumbLd([
    { name: isArabic ? 'الرئيسية' : 'Home', item: `${siteUrl}/${locale}` },
  ], locale as 'ar' | 'en');
  
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />
      <HeroShowcase />
      {/* <FeatureGrid /> */} {/* مخفي مؤقتاً */}
      <ServiceCards />
      {/* <PortfolioMasonry /> */} {/* مخفي مؤقتاً - لإظهاره: احذف التعليق */}
      {/* <Testimonials /> */} {/* مخفي مؤقتاً - لإظهاره: احذف التعليق */}
      <CTA />
    </>
  );
}

