'use client';

import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { Phone, Mail, MessageCircle, Download } from 'lucide-react';
import { Button } from '../ui/button';
import { ceoData, getWhatsAppLink, getMailtoLink, getTelLink } from '@/lib/ceo/data';

export function CeoHero({ locale }: { locale: 'ar' | 'en' }) {
  const t = useTranslations();

  return (
    <section className="vetap-section">
      <div className="vetap-container">
        <div className="mx-auto max-w-5xl">
          <div className="grid gap-12 md:grid-cols-2 md:items-center">
            {/* Image */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="order-1 md:order-1"
            >
              <div className="relative aspect-square overflow-hidden rounded-2xl border border-border bg-muted">
                <Image
                  src="/images/ceo.jpg"
                  alt={ceoData.name[locale]}
                  fill
                  className="object-cover"
                  priority
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              </div>
            </motion.div>

            {/* Info */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="order-2 md:order-2"
            >
              <p className="mb-2 text-sm font-medium text-primary">{t('A236')}</p>
              <h1 className="mb-2 text-4xl font-bold tracking-tight md:text-5xl">
                {ceoData.name[locale]}
              </h1>
              <p className="mb-6 text-xl text-muted-foreground">{t('A201')}</p>

              {/* Quick Actions */}
              <div className="flex flex-wrap gap-3">
                <Button
                  asChild
                  size="lg"
                  className="gap-2"
                >
                  <a href={getWhatsAppLink(ceoData.phones[0], locale)} target="_blank" rel="noopener noreferrer">
                    <MessageCircle className="h-5 w-5" />
                    {t('A210')}
                  </a>
                </Button>
                
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="gap-2"
                >
                  <a href={getMailtoLink(ceoData.emails[0], locale)}>
                    <Mail className="h-5 w-5" />
                    {t('A208')}
                  </a>
                </Button>

                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="gap-2"
                >
                  <a href={getTelLink(ceoData.phones[0])}>
                    <Phone className="h-5 w-5" />
                    {t('A230')}
                  </a>
                </Button>

                <Button
                  asChild
                  size="lg"
                  variant="secondary"
                  className="gap-2"
                >
                  <a href={ceoData.vcardUrl}>
                    <Download className="h-5 w-5" />
                    {t('A207')}
                  </a>
                </Button>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}

