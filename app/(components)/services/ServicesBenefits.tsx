'use client';

import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';

type Benefit = {
  title: string;
  description: string;
};

export function ServicesBenefits({ benefits }: { benefits: Benefit[] }) {
  const t = useTranslations();
  
  return (
    <section className="vetap-section bg-muted/30">
      <div className="vetap-container">
        <div className="mx-auto max-w-4xl">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.5 }}
            className="mb-12 text-center text-3xl font-bold"
          >
            {t('A137')}
          </motion.h2>
          <div className="grid gap-8 md:grid-cols-2">
            {benefits.map((benefit, index) => (
              <motion.div
                key={benefit.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="vetap-card"
              >
                <h3 className="mb-2 text-xl font-semibold">{benefit.title}</h3>
                <p className="text-muted-foreground">{benefit.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

