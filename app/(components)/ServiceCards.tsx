'use client';

import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { Code2, Palette, Wrench, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { Button } from './ui/button';

const iconMap = {
  Code2,
  Palette,
  Wrench,
};

export function ServiceCards() {
  const t = useTranslations();

  const services = [
    {
      icon: 'Code2',
      title: t('A29'), // Custom web development
      description: t('A67'),
      features: [t('A68'), t('A69'), t('A70'), t('A71')],
    },
    {
      icon: 'Palette',
      title: t('A30'), // Brand-grade frontend
      description: t('A72'),
      features: [t('A73'), t('A74'), t('A75'), t('A63')],
    },
    {
      icon: 'Wrench',
      title: t('A31'), // Migration & optimization
      description: t('A76'),
      features: [t('A77'), t('A78'), t('A79'), t('A71')],
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
            return (
              <motion.div
                key={service.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="vetap-card flex flex-col"
              >
                <div className="mb-4 inline-flex rounded-lg bg-primary p-3 text-primary-foreground">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="mb-2 text-xl font-semibold">{service.title}</h3>
                <p className="mb-4 text-muted-foreground">{service.description}</p>
                <ul className="mb-6 flex-1 space-y-2">
                  {service.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-sm">
                      <ArrowRight className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button asChild variant="outline" className="w-full">
                  <Link href="/services">{t('A193')}</Link>
                </Button>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

