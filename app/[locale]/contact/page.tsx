import { useTranslations } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { ContactForm } from '@/app/(components)/ContactForm';
import { Mail, MapPin, Phone } from 'lucide-react';
import { getContactPageLd, getOrganizationLd, getBreadcrumbLd } from '@/app/(seo)/jsonld';
import { getDirection } from '@/lib/utils/rtl';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale });
  const siteUrl = process.env.SITE_URL || 'https://vetaps.com';
  const isArabic = locale === 'ar';
  
  return {
    title: isArabic ? `${t('A6')} - VETAP` : `${t('A6')} - VETAP`,
    description: t('A120'),
    openGraph: {
      title: isArabic ? `${t('A6')} - VETAP` : `${t('A6')} - VETAP`,
      description: t('A120'),
      url: `${siteUrl}/${locale}/contact`,
      siteName: 'VETAP',
      locale: locale,
      type: 'website',
      images: [
        {
          url: `${siteUrl}/images/og-image.png`,
          width: 1200,
          height: 630,
          alt: isArabic ? 'اتصل بنا - VETAP' : 'Contact VETAP',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: isArabic ? `${t('A6')} - VETAP` : `${t('A6')} - VETAP`,
      description: t('A120'),
      images: [`${siteUrl}/images/og-image.png`],
    },
    alternates: {
      canonical: `${siteUrl}/${locale}/contact`,
      languages: {
        'ar': `${siteUrl}/ar/contact`,
        'en': `${siteUrl}/en/contact`,
      },
    },
  };
}

export default async function ContactPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const siteUrl = process.env.SITE_URL || 'https://vetaps.com';
  const isArabic = locale === 'ar';
  
  const contactPageLd = getContactPageLd(locale as 'ar' | 'en');
  const organizationLd = getOrganizationLd(locale as 'ar' | 'en');
  const breadcrumbLd = getBreadcrumbLd([
    { name: isArabic ? 'الرئيسية' : 'Home', item: `${siteUrl}/${locale}` },
    { name: isArabic ? 'اتصل بنا' : 'Contact', item: `${siteUrl}/${locale}/contact` },
  ], locale as 'ar' | 'en');
  
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(contactPageLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />
      <section className="vetap-section">
        <div className="vetap-container">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="mb-4 text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl">
              <ContactTitle />
            </h1>
            <p className="text-lg text-muted-foreground md:text-xl">
              <ContactDescription />
            </p>
          </div>
        </div>
      </section>

      <section className="pb-16 md:pb-24">
        <div className="vetap-container">
          <div className={`grid gap-12 lg:grid-cols-3 ${isArabic ? 'lg:grid-flow-col-dense' : ''}`} dir={getDirection(locale)}>
            {isArabic ? (
              <>
                {/* Contact Form - First in RTL */}
                <div className="lg:col-span-2 lg:col-start-1 lg:col-end-3">
                  <h2 className="mb-6 text-right text-2xl font-bold">
                    <FormTitle />
                  </h2>
                  <ContactForm />
                </div>
                {/* Contact Info - Second in RTL */}
                <div className="space-y-6 lg:col-start-3 lg:col-end-4">
                  <ContactInfo locale={locale} />
                </div>
              </>
            ) : (
              <>
                {/* Contact Info - First in LTR */}
                <div className="space-y-6">
                  <ContactInfo locale={locale} />
                </div>
                {/* Contact Form - Second in LTR */}
                <div className="lg:col-span-2">
                  <h2 className="mb-6 text-left text-2xl font-bold">
                    <FormTitle />
                  </h2>
                  <ContactForm />
                </div>
              </>
            )}
          </div>
        </div>
      </section>
    </>
  );
}

function ContactTitle() {
  const t = useTranslations();
  return <>{t('A119')}</>;
}

function ContactDescription() {
  const t = useTranslations();
  return <>{t('A120')}</>;
}

function FormTitle() {
  const t = useTranslations();
  return <>{t('A121')}</>;
}

function ContactInfo({ locale }: { locale: string }) {
  const t = useTranslations();
  const isRTL = locale === 'ar';
  const dir = getDirection(locale);
  
  return (
    <>
      <div dir={dir}>
        <h3 className={`mb-4 text-xl font-semibold ${isRTL ? 'text-right' : 'text-left'}`}>{t('A122')}</h3>
        <div className="space-y-4">
          <a
            href="mailto:info@vetaps.com"
            className={`flex items-start gap-3 rounded-lg p-3 transition-colors hover:bg-accent ${isRTL ? 'flex-row-reverse' : ''}`}
          >
            <Mail className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" />
            <div className="text-left">
              <div className="font-medium text-left" dir="ltr">Email</div>
              <div className="text-sm text-muted-foreground text-left" dir="ltr">info@vetaps.com</div>
            </div>
          </a>
          <div className={`flex items-start gap-3 rounded-lg p-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <Phone className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" />
            <div className="text-left">
              <div className="font-medium text-left" dir="ltr">Phone</div>
              <div className="text-sm text-muted-foreground text-left" dir="ltr">+905346146038</div>
            </div>
          </div>
          <div className={`flex items-start gap-3 rounded-lg p-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <MapPin className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" />
            <div className="text-left">
              <div className="font-medium text-left" dir="ltr">Location</div>
              <div className="text-sm text-muted-foreground text-left" dir="ltr">Worldwide</div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

