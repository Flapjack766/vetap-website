import { getTranslations, setRequestLocale } from 'next-intl/server';
import { ServiceCards } from '@/app/(components)/ServiceCards';
import { CTA } from '@/app/(components)/CTA';
import { getServiceLd, getServicesPageLd, getBreadcrumbLd } from '@/app/(seo)/jsonld';
import { ServicesBenefits } from '@/app/(components)/services/ServicesBenefits';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale });
  const siteUrl = process.env.SITE_URL || 'https://vetaps.com';
  const isArabic = locale === 'ar';
  
  return {
    title: isArabic ? `${t('A3')} - VETAP` : `${t('A3')} - VETAP`,
    description: t('A67'),
    openGraph: {
      title: isArabic ? `${t('A3')} - VETAP` : `${t('A3')} - VETAP`,
      description: t('A67'),
      url: `${siteUrl}/${locale}/services`,
      siteName: 'VETAP',
      locale: locale,
      type: 'website',
      images: [
        {
          url: `${siteUrl}/images/og-image.png`,
          width: 1200,
          height: 630,
          alt: isArabic ? 'خدمات VETAP' : 'VETAP Services',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: isArabic ? `${t('A3')} - VETAP` : `${t('A3')} - VETAP`,
      description: t('A67'),
      images: [`${siteUrl}/images/og-image.png`],
    },
    alternates: {
      canonical: `${siteUrl}/${locale}/services`,
      languages: {
        'ar': `${siteUrl}/ar/services`,
        'en': `${siteUrl}/en/services`,
      },
    },
  };
}

export default async function ServicesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale });
  const siteUrl = process.env.SITE_URL || 'https://vetaps.com';
  const isArabic = locale === 'ar';
  
  const serviceLd = getServiceLd(locale as 'ar' | 'en');
  const servicesPageLd = getServicesPageLd(locale as 'ar' | 'en');
  const breadcrumbLd = getBreadcrumbLd([
    { name: isArabic ? 'الرئيسية' : 'Home', item: `${siteUrl}/${locale}` },
    { name: isArabic ? 'الخدمات' : 'Services', item: `${siteUrl}/${locale}/services` },
  ], locale as 'ar' | 'en');
  
  const benefits = [
    { title: t('A138'), description: t('A139') },
    { title: t('A140'), description: t('A141') },
    { title: t('A142'), description: t('A143') },
    { title: t('A144'), description: t('A145') },
  ];
  
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(servicesPageLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />
      
      <ServiceCards />

      <ServicesBenefits benefits={benefits} />

      <CTA />
    </>
  );
}
