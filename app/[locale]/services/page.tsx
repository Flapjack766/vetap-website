import { getTranslations, setRequestLocale } from 'next-intl/server';
import { ServiceCards } from '@/app/(components)/ServiceCards';
import { CTA } from '@/app/(components)/CTA';
import { serviceLd } from '@/app/(seo)/jsonld';

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

      <section className="vetap-section bg-muted/30">
        <div className="vetap-container">
          <div className="mx-auto max-w-4xl">
            <h2 className="mb-12 text-center text-3xl font-bold">
              {t('A137')}
            </h2>
            <div className="grid gap-8 md:grid-cols-2">
              {benefits.map((benefit) => (
                <div key={benefit.title} className="vetap-card">
                  <h3 className="mb-2 text-xl font-semibold">{benefit.title}</h3>
                  <p className="text-muted-foreground">{benefit.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <CTA />
    </>
  );
}
