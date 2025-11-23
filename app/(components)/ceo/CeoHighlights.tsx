'use client';

import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { Zap, Shield, Palette, TrendingUp } from 'lucide-react';

const iconMap = {
  Zap,
  Shield,
  Palette,
  TrendingUp,
};

export function CeoHighlights() {
  const t = useTranslations();

  const highlights = [
    { icon: 'Zap', title: t('A232'), description: t('A218') },
    { icon: 'Shield', title: t('A219'), description: t('A219') },
    { icon: 'Palette', title: t('A233'), description: t('A220') },
    { icon: 'TrendingUp', title: t('A234'), description: t('A222') },
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
          <h2 className="text-3xl font-bold">{t('A204')}</h2>
        </motion.div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {highlights.map((highlight, index) => {
            const Icon = iconMap[highlight.icon as keyof typeof iconMap];
            return (
              <motion.div
                key={highlight.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="vetap-card text-center"
              >
                <div className="mb-4 inline-flex rounded-lg bg-primary/10 p-3">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="mb-2 font-semibold">{highlight.title}</h3>
                <p className="text-sm text-muted-foreground">{highlight.description}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

