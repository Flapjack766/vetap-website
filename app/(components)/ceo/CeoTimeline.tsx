'use client';

import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { Building2, Rocket, Layers } from 'lucide-react';

const iconMap = {
  Building2,
  Rocket,
  Layers,
};

export function CeoTimeline() {
  const t = useTranslations();

  const milestones = [
    { icon: 'Building2', title: t('A224'), year: '2020' },
    { icon: 'Rocket', title: t('A225'), year: '2021-2023' },
    { icon: 'Layers', title: t('A226'), year: '2024' },
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
          <h2 className="text-3xl font-bold">{t('A223')}</h2>
        </motion.div>

        <div className="mx-auto max-w-3xl">
          <div className="space-y-8">
            {milestones.map((milestone, index) => {
              const Icon = iconMap[milestone.icon as keyof typeof iconMap];
              return (
                <motion.div
                  key={milestone.title}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="flex gap-6"
                >
                  <div className="flex flex-col items-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground">
                      <Icon className="h-6 w-6" />
                    </div>
                    {index < milestones.length - 1 && (
                      <div className="mt-2 h-full w-0.5 bg-border" />
                    )}
                  </div>
                  <div className="flex-1 pb-8">
                    <p className="mb-1 text-sm font-medium text-primary">{milestone.year}</p>
                    <p className="text-lg font-semibold">{milestone.title}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

