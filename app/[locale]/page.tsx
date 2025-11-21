import { setRequestLocale } from 'next-intl/server';
import { HeroShowcase } from '@/app/(components)/HeroShowcase';
import { FeatureGrid } from '@/app/(components)/FeatureGrid';
import { ServiceCards } from '@/app/(components)/ServiceCards';
// import { PortfolioMasonry } from '@/app/(components)/PortfolioMasonry'; // مخفي مؤقتاً
// import { Testimonials } from '@/app/(components)/Testimonials'; // مخفي مؤقتاً
import { CTA } from '@/app/(components)/CTA';
import { organizationLd, websiteLd } from '@/app/(seo)/jsonld';

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
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
      <HeroShowcase />
      {/* <FeatureGrid /> */} {/* مخفي مؤقتاً */}
      <ServiceCards />
      {/* <PortfolioMasonry /> */} {/* مخفي مؤقتاً - لإظهاره: احذف التعليق */}
      {/* <Testimonials /> */} {/* مخفي مؤقتاً - لإظهاره: احذف التعليق */}
      <CTA />
    </>
  );
}

