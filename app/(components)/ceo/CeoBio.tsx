'use client';

import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';

export function CeoBio() {
  const t = useTranslations();

  return (
    <section className="vetap-section bg-muted/30">
      <div className="vetap-container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-3xl"
        >
          <h2 className="mb-6 text-center text-3xl font-bold">{t('A203')}</h2>
          <div className="vetap-card">
            <p className="text-lg leading-relaxed text-muted-foreground">
              {t('A231')}
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

