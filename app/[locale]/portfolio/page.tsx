// صفحة معرض الأعمال - مخفية مؤقتاً
// لإظهار الصفحة: احذف التعليقات من الكود أدناه

import { useTranslations } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';
// import { PortfolioMasonry } from '@/app/(components)/PortfolioMasonry';
// import { CTA } from '@/app/(components)/CTA';
import { redirect } from 'next/navigation';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale });
  
  return {
    title: t('A4'), // Portfolio
    description: t('A81'),
  };
}

export default async function PortfolioPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  // setRequestLocale(locale);
  
  // إعادة توجيه مؤقتة للصفحة الرئيسية
  redirect(`/${locale}`);
  
  // الكود الأصلي (مخفي مؤقتاً)
  /*
  return (
    <>
      <section className="vetap-section">
        <div className="vetap-container">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="mb-4 text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl">
              <PortfolioTitle />
            </h1>
            <p className="text-lg text-muted-foreground md:text-xl">
              <PortfolioDescription />
            </p>
          </div>
        </div>
      </section>

      <section className="bg-muted/30 py-16">
        <PortfolioMasonry />
      </section>

      <CTA />
    </>
  );
  */
}

/*
function PortfolioTitle() {
  const t = useTranslations();
  return <>{t('A80')}</>;
}

function PortfolioDescription() {
  const t = useTranslations();
  return <>{t('A81')}</>;
}
*/

