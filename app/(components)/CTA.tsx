'use client';

import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Button } from './ui/button';

export function CTA() {
  const t = useTranslations();

  return (
    <section className="vetap-section bg-primary text-primary-foreground">
      <div className="vetap-container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-3xl text-center"
        >
          <h2 className="mb-4 text-3xl font-bold tracking-tight md:text-5xl">{t('A104')}</h2>
          <p className="mb-8 text-lg text-primary-foreground/90 md:text-xl">{t('A105')}</p>
          <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
            <Button
              asChild
              size="lg"
              variant="secondary"
              className="text-lg"
            >
              <Link href="/contact" prefetch={true}>
                {t('A106')}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-primary-foreground/20 bg-transparent text-primary-foreground hover:bg-primary-foreground/10"
            >
              <Link href="/portfolio" prefetch={true}>{t('A148')}</Link>
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

