import { getTranslations, setRequestLocale } from 'next-intl/server';
import { ServiceCards } from '@/app/(components)/ServiceCards';
import { CTA } from '@/app/(components)/CTA';
import { serviceLd } from '@/app/(seo)/jsonld';
import { ServicesBenefits } from '@/app/(components)/services/ServicesBenefits';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale });
  
  return {
    title: t('A3'), // Services
    description: t('A67'),
  };
}

export default async function ServicesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale });
  
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
      
      <ServiceCards />

      <ServicesBenefits benefits={benefits} />

      <CTA />
    </>
  );
}
