import { useTranslations } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { ContactForm } from '@/app/(components)/ContactForm';
import { Mail, MapPin, Phone } from 'lucide-react';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale });
  
  return {
    title: t('A6'), // Contact
    description: t('A120'),
  };
}

export default async function ContactPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <>
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
          <div className="grid gap-12 lg:grid-cols-3">
            {/* Contact Info */}
            <div className="space-y-6">
              <ContactInfo />
            </div>

            {/* Contact Form */}
            <div className="lg:col-span-2">
              <h2 className="mb-6 text-2xl font-bold">
                <FormTitle />
              </h2>
              <ContactForm />
            </div>
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

function ContactInfo() {
  const t = useTranslations();
  
  return (
    <>
      <div>
        <h3 className="mb-4 text-xl font-semibold">{t('A122')}</h3>
        <div className="space-y-4">
          <a
            href="mailto:info@vetaps.com"
            className="flex items-start gap-3 rounded-lg p-3 transition-colors hover:bg-accent"
          >
            <Mail className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" />
            <div>
              <div className="font-medium">Email</div>
              <div className="text-sm text-muted-foreground">info@vetaps.com</div>
            </div>
          </a>
          <div className="flex items-start gap-3 rounded-lg p-3">
            <Phone className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" />
            <div>
              <div className="font-medium">Phone</div>
              <div className="text-sm text-muted-foreground">+966 (55) 319-8577</div>
            </div>
          </div>
          <div className="flex items-start gap-3 rounded-lg p-3">
            <MapPin className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" />
            <div>
              <div className="font-medium">Location</div>
              <div className="text-sm text-muted-foreground">Worldwide</div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

