import { useTranslations } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { CTA } from '@/app/(components)/CTA';
import { Testimonials } from '@/app/(components)/Testimonials';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale });
  
  return {
    title: t('A5'), // About
    description: t('A108'),
  };
}

export default async function AboutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <>
      <section className="vetap-section">
        <div className="vetap-container">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="mb-4 text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl">
              <AboutTitle />
            </h1>
            <p className="text-lg text-muted-foreground md:text-xl">
              <AboutDescription />
            </p>
          </div>
        </div>
      </section>

      <section className="vetap-section bg-muted/30">
        <div className="vetap-container">
          <div className="mx-auto max-w-5xl">
            <div className="grid gap-12 md:grid-cols-3">
              <MissionVisionValues />
            </div>
          </div>
        </div>
      </section>

      <section className="vetap-section">
        <div className="vetap-container">
          <div className="mx-auto max-w-5xl">
            <div className="grid gap-8 md:grid-cols-4">
              <Stats />
            </div>
          </div>
        </div>
      </section>

      <Testimonials />
      <CTA />
    </>
  );
}

function AboutTitle() {
  const t = useTranslations();
  return <>{t('A107')}</>;
}

function AboutDescription() {
  const t = useTranslations();
  return <>{t('A108')}</>;
}

function MissionVisionValues() {
  const t = useTranslations();
  
  const items = [
    { title: t('A109'), description: t('A110') },
    { title: t('A111'), description: t('A112') },
    { title: t('A113'), description: t('A114') },
  ];

  return (
    <>
      {items.map((item) => (
        <div key={item.title} className="vetap-card">
          <h3 className="mb-2 text-xl font-semibold">{item.title}</h3>
          <p className="text-muted-foreground">{item.description}</p>
        </div>
      ))}
    </>
  );
}

function Stats() {
  const t = useTranslations();
  
  const stats = [
    { label: t('A115'), value: '5+' },
    { label: t('A116'), value: '100+' },
    { label: t('A117'), value: '80+' },
    { label: t('A118'), value: '15+' },
  ];

  return (
    <>
      {stats.map((stat) => (
        <div key={stat.label} className="text-center">
          <div className="mb-2 text-4xl font-bold text-primary">{stat.value}</div>
          <div className="text-sm text-muted-foreground">{stat.label}</div>
        </div>
      ))}
    </>
  );
}

