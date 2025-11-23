'use client';

import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  Code2,
  Zap,
  Shield,
  Globe,
  Smartphone,
  Database,
  Layers,
  Rocket,
  CheckCircle2,
  ArrowRight,
  Palette,
  Gauge,
  Lock,
  Search,
} from 'lucide-react';
import { Button } from '@/app/(components)/ui/button';
import { CTA } from '@/app/(components)/CTA';

export function WebDevelopmentContent({ locale }: { locale: 'ar' | 'en' }) {
  const t = useTranslations();
  const isRtl = locale === 'ar';

  const features = [
    {
      icon: Zap,
      title: t('WEBDEV3'),
      description: t('WEBDEV4'),
    },
    {
      icon: Search,
      title: t('WEBDEV5'),
      description: t('WEBDEV6'),
    },
    {
      icon: Shield,
      title: t('WEBDEV7'),
      description: t('WEBDEV8'),
    },
    {
      icon: Smartphone,
      title: t('WEBDEV9'),
      description: t('WEBDEV10'),
    },
    {
      icon: Database,
      title: t('WEBDEV11'),
      description: t('WEBDEV12'),
    },
    {
      icon: Layers,
      title: t('WEBDEV13'),
      description: t('WEBDEV14'),
    },
  ];

  const services = [
    {
      icon: Code2,
      title: t('WEBDEV15'),
      description: t('WEBDEV16'),
      features: [t('WEBDEV17'), t('WEBDEV18'), t('WEBDEV19'), t('WEBDEV20')],
    },
    {
      icon: Palette,
      title: t('WEBDEV21'),
      description: t('WEBDEV22'),
      features: [t('WEBDEV23'), t('WEBDEV24'), t('WEBDEV25'), t('WEBDEV26')],
    },
    {
      icon: Rocket,
      title: t('WEBDEV27'),
      description: t('WEBDEV28'),
      features: [t('WEBDEV29'), t('WEBDEV30'), t('WEBDEV31'), t('WEBDEV32')],
    },
  ];

  const benefits = [
    t('WEBDEV33'),
    t('WEBDEV34'),
    t('WEBDEV35'),
    t('WEBDEV36'),
    t('WEBDEV37'),
    t('WEBDEV38'),
  ];

  const process = [
    {
      step: '01',
      title: t('WEBDEV39'),
      description: t('WEBDEV40'),
    },
    {
      step: '02',
      title: t('WEBDEV41'),
      description: t('WEBDEV42'),
    },
    {
      step: '03',
      title: t('WEBDEV43'),
      description: t('WEBDEV44'),
    },
    {
      step: '04',
      title: t('WEBDEV45'),
      description: t('WEBDEV46'),
    },
    {
      step: '05',
      title: t('WEBDEV47'),
      description: t('WEBDEV48'),
    },
  ];

  return (
    <div className={isRtl ? 'rtl' : ''} dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Hero Section */}
      <section className="vetap-section bg-gradient-to-b from-background via-background to-muted/20">
        <div className="vetap-container">
          <div className="mx-auto max-w-4xl text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-2 text-sm text-primary">
                <Code2 className="h-4 w-4" />
                <span>{t('WEBDEV49')}</span>
              </div>
              <h1 className="mb-4 text-4xl font-extrabold tracking-tight md:text-6xl">
                {t('WEBDEV1')}
              </h1>
              <p className="mb-8 text-xl text-muted-foreground max-w-2xl mx-auto">
                {t('WEBDEV2')}
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Button asChild size="lg" className="gap-2">
                  <Link href="/contact" prefetch={true}>
                    {t('WEBDEV50')}
                    <ArrowRight className="h-5 w-5" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <a href="#features">{t('WEBDEV51')}</a>
                </Button>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="vetap-section bg-muted/30">
        <div className="vetap-container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.5 }}
            className="mb-12 text-center"
          >
            <h2 className="mb-4 text-3xl font-bold">{t('WEBDEV52')}</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {t('WEBDEV53')}
            </p>
          </motion.div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="vetap-card text-center"
                >
                  <div className="mb-4 inline-flex rounded-lg bg-primary/10 p-3 text-primary">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="mb-2 font-semibold">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="vetap-section">
        <div className="vetap-container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.5 }}
            className="mb-12 text-center"
          >
            <h2 className="mb-4 text-3xl font-bold">{t('WEBDEV54')}</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {t('WEBDEV55')}
            </p>
          </motion.div>

          <div className="grid gap-8 md:grid-cols-3">
            {services.map((service, index) => {
              const Icon = service.icon;
              return (
                <motion.div
                  key={service.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ duration: 0.5, delay: index * 0.15 }}
                  className="vetap-card"
                >
                  <div className="mb-4 inline-flex rounded-lg bg-primary/10 p-3 text-primary">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="mb-2 text-xl font-semibold">{service.title}</h3>
                  <p className="mb-4 text-muted-foreground">{service.description}</p>
                  <ul className="space-y-2">
                    {service.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                        <span className="text-muted-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Process */}
      <section className="vetap-section bg-muted/30">
        <div className="vetap-container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.5 }}
            className="mb-12 text-center"
          >
            <h2 className="mb-4 text-3xl font-bold">{t('WEBDEV56')}</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {t('WEBDEV57')}
            </p>
          </motion.div>

          <div className="mx-auto max-w-4xl">
            <div className="space-y-8">
              {process.map((item, index) => (
                <motion.div
                  key={item.step}
                  initial={{ opacity: 0, x: isRtl ? 20 : -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="flex gap-6"
                >
                  <div className="flex shrink-0 flex-col items-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-lg font-bold text-primary-foreground">
                      {item.step}
                    </div>
                    {index < process.length - 1 && (
                      <div className="mt-2 h-full w-0.5 bg-border" />
                    )}
                  </div>
                  <div className="flex-1 pb-8">
                    <h3 className="mb-2 text-xl font-semibold">{item.title}</h3>
                    <p className="text-muted-foreground">{item.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="vetap-section">
        <div className="vetap-container">
          <div className="mx-auto max-w-3xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.5 }}
              className="mb-12 text-center"
            >
              <h2 className="mb-4 text-3xl font-bold">{t('WEBDEV58')}</h2>
              <p className="text-lg text-muted-foreground">
                {t('WEBDEV59')}
              </p>
            </motion.div>

            <div className="grid gap-4 md:grid-cols-2">
              {benefits.map((benefit, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: isRtl ? 20 : -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  className="vetap-card flex items-start gap-4"
                >
                  <CheckCircle2 className="mt-1 h-5 w-5 shrink-0 text-primary" />
                  <div>
                    <p className="font-medium">{benefit}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <CTA />
    </div>
  );
}

