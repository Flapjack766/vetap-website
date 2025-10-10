'use client';

import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { ExternalLink } from 'lucide-react';
import { Button } from './ui/button';

export function PortfolioMasonry() {
  const t = useTranslations();

  const projects = [
    {
      title: t('A82'), // E-Commerce Platform
      description: t('A83'),
      category: 'E-Commerce',
      image: '/images/portfolio-1.jpg',
    },
    {
      title: t('A84'), // Corporate Website
      description: t('A85'),
      category: 'Corporate',
      image: '/images/portfolio-2.jpg',
    },
    {
      title: t('A86'), // Portfolio Site
      description: t('A87'),
      category: 'Portfolio',
      image: '/images/portfolio-3.jpg',
    },
    {
      title: t('A88'), // SaaS Dashboard
      description: t('A89'),
      category: 'SaaS',
      image: '/images/portfolio-4.jpg',
    },
    {
      title: t('A90'), // Agency Website
      description: t('A91'),
      category: 'Marketing',
      image: '/images/portfolio-5.jpg',
    },
    {
      title: t('A92'), // Restaurant Site
      description: t('A93'),
      category: 'Restaurant',
      image: '/images/portfolio-6.jpg',
    },
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
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">{t('A80')}</h2>
          <p className="mt-4 text-lg text-muted-foreground">{t('A81')}</p>
        </motion.div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project, index) => (
            <motion.div
              key={project.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="group relative overflow-hidden rounded-lg border border-border bg-card"
            >
              <div className="aspect-video w-full overflow-hidden bg-muted">
                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-muted to-muted-foreground/20">
                  <span className="text-sm font-medium text-muted-foreground">
                    {project.category}
                  </span>
                </div>
              </div>
              <div className="p-6">
                <div className="mb-2 inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-medium">
                  {project.category}
                </div>
                <h3 className="mb-2 text-xl font-semibold">{project.title}</h3>
                <p className="mb-4 text-sm text-muted-foreground">{project.description}</p>
                <Button variant="ghost" size="sm" className="group/btn">
                  {t('A33')}
                  <ExternalLink className="ml-2 h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
                </Button>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="mt-12 text-center"
        >
          <Button asChild size="lg">
            <Link href="/portfolio">{t('A148')}</Link>
          </Button>
        </motion.div>
      </div>
    </section>
  );
}

