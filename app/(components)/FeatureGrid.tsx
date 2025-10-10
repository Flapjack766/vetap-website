'use client';

import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { Zap, Search, Accessibility, Shield, Code, Gauge } from 'lucide-react';

const iconMap = {
  Zap,
  Search,
  Accessibility,
  Shield,
  Code,
  Gauge,
};

export function FeatureGrid() {
  const t = useTranslations();

  const features = [
    { icon: 'Zap', title: t('A16'), description: t('A186') }, // Lightning-fast performance
    { icon: 'Search', title: t('A17'), description: t('A62') }, // Ultra Pro SEO
    { icon: 'Accessibility', title: t('A18'), description: t('A63') }, // Accessibility first
    { icon: 'Shield', title: t('A19'), description: t('A64') }, // Security & hardening
    { icon: 'Code', title: t('A65'), description: t('A61') }, // Clean code
    { icon: 'Gauge', title: t('A181'), description: t('A182') }, // Performance Metrics
  ];

  return (
    <section className="vetap-section bg-muted/30">
      <div className="vetap-container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-12 text-center"
        >
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">{t('A15')}</h2>
          <p className="mt-4 text-lg text-muted-foreground">{t('A60')}</p>
        </motion.div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => {
            const Icon = iconMap[feature.icon as keyof typeof iconMap];
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="vetap-card group"
              >
                <div className="mb-4 inline-flex rounded-lg bg-primary/10 p-3 transition-colors group-hover:bg-primary/20">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="mb-2 text-xl font-semibold">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

