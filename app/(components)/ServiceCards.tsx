'use client';

import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { Code2, Palette, Wrench, CreditCard, Star, ArrowRight, UserCircle } from 'lucide-react';
import Link from 'next/link';
import { Button } from './ui/button';
import { Card3DViewerMini } from './nfc/Card3DViewerMini';
import { ReviewCard3DViewerMini } from './nfc/ReviewCard3DViewerMini';

const iconMap = {
  Code2,
  Palette,
  Wrench,
  CreditCard,
  Star,
  UserCircle,
};

export function ServiceCards() {
  const t = useTranslations();

  const services = [
    {
      icon: 'CreditCard',
      title: t('A202'), // NFC Smart Business Card
      description: t('A210'),
      features: [t('A211'), t('A212'), t('A213'), t('A219')],
      href: '/business-card',
    },
    {
      icon: 'Star',
      title: t('A203'), // NFC Google Maps Review Card
      description: t('A214'),
      features: [t('A215'), t('A216'), t('A217'), t('A218')],
      href: '/review-card',
    },
    {
      icon: 'UserCircle',
      title: t('SERVICE1'), // Business Profile Page
      description: t('SERVICE2'),
      features: [t('SERVICE3'), t('SERVICE4'), t('SERVICE5'), t('SERVICE6')],
      href: '/Business-Profile',
    },
    {
      icon: 'Code2',
      title: t('A29'), // Custom web development
      description: t('A67'),
      features: [t('A68'), t('A69'), t('A70'), t('A71')],
      href: '/services',
    },
    {
      icon: 'Palette',
      title: t('A30'), // Brand-grade frontend
      description: t('A72'),
      features: [t('A73'), t('A74'), t('A75'), t('A63')],
      href: '/services',
    },
    {
      icon: 'Wrench',
      title: t('A31'), // Migration & optimization
      description: t('A76'),
      features: [t('A77'), t('A78'), t('A79'), t('A71')],
      href: '/services',
    },
  ];

  return (
    <section className="vetap-section">
      <div className="vetap-container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-12 text-center"
        >
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">{t('A28')}</h2>
          <p className="mt-4 text-lg text-muted-foreground">{t('A67')}</p>
        </motion.div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {services.map((service, index) => {
            const Icon = iconMap[service.icon as keyof typeof iconMap];
            const isNFCCard = service.title === t('A202'); // NFC Smart Business Card
            const isReviewCard = service.title === t('A203'); // NFC Google Maps Review Card
            
            return (
              <motion.div
                key={service.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className={`vetap-card flex flex-col ${isReviewCard ? '!p-3' : ''}`}
              >
                <div className="mb-4">
                  <div className="inline-flex rounded-lg bg-primary p-3 text-primary-foreground">
                    <Icon className="h-6 w-6" />
                  </div>
                </div>
                <h3 className={`text-xl font-semibold ${isNFCCard ? 'mb-0.5' : isReviewCard ? '-mb-1' : 'mb-2'}`}>{service.title}</h3>
                <p className={`text-muted-foreground ${isNFCCard ? 'mb-1.5' : isReviewCard ? 'mb-0.5' : 'mb-4'}`}>{service.description}</p>
                <ul className={`flex-1 space-y-1.5 ${isNFCCard ? 'mb-3' : isReviewCard ? 'mb-2' : 'mb-6'}`}>
                  {service.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-sm">
                      <ArrowRight className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                {(isNFCCard || isReviewCard) && (
                  <div className={`mb-4 flex justify-center ${isNFCCard ? 'w-full' : 'w-full'}`}>
                    {isNFCCard && (
                      <div className="w-40">
                        <Card3DViewerMini className="h-full" />
                      </div>
                    )}
                    {isReviewCard && (
                      <div className="w-32">
                        <ReviewCard3DViewerMini className="h-full" />
                      </div>
                    )}
                  </div>
                )}
                <Button asChild variant="outline" className="w-full">
                  <Link href={service.href}>{t('A193')}</Link>
                </Button>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

