'use client';

import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  ShieldCheck,
  CheckCircle2,
  Search,
  Hammer,
  Ship,
  LineChart,
  Users,
  ArrowRight,
} from 'lucide-react';
import { Button } from '@/app/(components)/ui/button';

export function AboutContent({ locale }: { locale: 'ar' | 'en' }) {
  const t = useTranslations();
  const isRtl = locale === 'ar';

  const principles = [
    {
      icon: ShieldCheck,
      title: t('ABOUT1'),
      text: t('ABOUT2'),
    },
    {
      icon: CheckCircle2,
      title: t('ABOUT3'),
      text: t('ABOUT4'),
    },
    {
      icon: Users,
      title: t('ABOUT5'),
      text: t('ABOUT6'),
    },
  ];

  const verifiedFlow = [
    { icon: Search, title: t('ABOUT7'), text: t('ABOUT8') },
    { icon: ShieldCheck, title: t('ABOUT9'), text: t('ABOUT10') },
    { icon: Hammer, title: t('ABOUT11'), text: t('ABOUT12') },
    { icon: CheckCircle2, title: t('ABOUT13'), text: t('ABOUT14') },
    { icon: Ship, title: t('ABOUT15'), text: t('ABOUT16') },
    { icon: LineChart, title: t('ABOUT17'), text: t('ABOUT18') },
  ];

  const services = [
    {
      title: t('ABOUT19'),
      text: t('ABOUT20'),
      href: '/services',
    },
    {
      title: t('ABOUT21'),
      text: t('ABOUT22'),
      href: '/services',
    },
    {
      title: t('ABOUT23'),
      text: t('ABOUT24'),
      href: '/services',
    },
    {
      title: t('ABOUT25'),
      text: t('ABOUT26'),
      href: '/web-dev',
    },
    {
      title: t('ABOUT27'),
      text: t('ABOUT28'),
      href: '/business-card',
    },
  ];

  const clients = [
    t('ABOUT29'),
    t('ABOUT30'),
    t('ABOUT31'),
    t('ABOUT32'),
    t('ABOUT33'),
    t('ABOUT34'),
    t('ABOUT35'),
    t('ABOUT36'),
    t('ABOUT37'),
    t('ABOUT38'),
    t('ABOUT39'),
    t('ABOUT40'),
    t('ABOUT41'),
    t('ABOUT42'),
    t('ABOUT43'),
    t('ABOUT44'),
    t('ABOUT45'),
    t('ABOUT46'),
    t('ABOUT47'),
    t('ABOUT48'),
    t('ABOUT49'),
    t('ABOUT50'),
  ];

  const faqs = [
    {
      question: t('ABOUT51'),
      answer: t('ABOUT52'),
    },
    {
      question: t('ABOUT53'),
      answer: t('ABOUT54'),
    },
    {
      question: t('ABOUT55'),
      answer: t('ABOUT56'),
    },
  ];

  return (
    <div className={isRtl ? 'rtl' : ''} dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Hero Section */}
      <section className="vetap-section bg-gradient-to-b from-background via-background to-muted/20">
        <div className="vetap-container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mx-auto max-w-4xl text-center"
          >
            <h1 className="mb-4 text-4xl font-extrabold tracking-tight md:text-5xl lg:text-6xl">
              {t('ABOUT57')}
            </h1>
            <p className="mb-8 text-xl text-muted-foreground md:text-2xl">
              {t('ABOUT58')}
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button asChild size="lg" className="gap-2">
                <Link href="/services">
                  {t('ABOUT59')}
                  <ArrowRight className="h-5 w-5" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/contact">{t('ABOUT60')}</Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Who we are + Principles */}
      <section className="vetap-section">
        <div className="vetap-container">
          <div className="mx-auto max-w-6xl">
            <div className="grid gap-10 lg:grid-cols-3">
              <motion.div
                initial={{ opacity: 0, x: isRtl ? 20 : -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.5 }}
                className="lg:col-span-2"
              >
                <h2 className="mb-6 text-3xl font-bold md:text-4xl">{t('ABOUT61')}</h2>
                <div className="space-y-4 leading-relaxed text-muted-foreground">
                  <p>
                    {t('ABOUT62')}
                  </p>
                  <p>
                    {t('ABOUT63')}
                  </p>
                </div>
              </motion.div>

              <aside className="space-y-4">
                {principles.map(({ icon: Icon, title, text }, index) => (
                  <motion.div
                    key={title}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    className="vetap-card"
                  >
                    <div className="mb-2 flex items-center gap-3">
                      <Icon className="h-5 w-5 text-primary" />
                      <h3 className="font-semibold">{title}</h3>
                    </div>
                    <p className="text-sm leading-7 text-muted-foreground">{text}</p>
                  </motion.div>
                ))}
              </aside>
            </div>
          </div>
        </div>
      </section>

      {/* Verified Flow */}
      <section className="vetap-section bg-muted/30">
        <div className="vetap-container">
          <div className="mx-auto max-w-6xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.5 }}
              className="mb-10"
            >
              <h2 className="mb-4 text-3xl font-bold md:text-4xl">{t('ABOUT64')}</h2>
            </motion.div>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {verifiedFlow.map(({ icon: Icon, title, text }, index) => (
                <motion.div
                  key={title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="vetap-card"
                >
                  <div className="mb-2 flex items-center gap-3">
                    <Icon className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold">{title}</h3>
                  </div>
                  <p className="text-sm leading-7 text-muted-foreground">{text}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Selected Clients */}
      <section className="vetap-section">
        <div className="vetap-container">
          <div className="mx-auto max-w-6xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.5 }}
              className="mb-6"
            >
              <h2 className="mb-4 text-3xl font-bold md:text-4xl">{t('ABOUT65')}</h2>
              <p className="text-muted-foreground">{t('ABOUT66')}</p>
            </motion.div>
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {clients.map((client, index) => (
                <motion.li
                  key={client}
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ duration: 0.3, delay: index * 0.02 }}
                  className="vetap-card p-3 text-sm"
                >
                  {client}
                </motion.li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* What we do today */}
      <section className="vetap-section bg-muted/30">
        <div className="vetap-container">
          <div className="mx-auto max-w-6xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.5 }}
              className="mb-10"
            >
              <h2 className="mb-4 text-3xl font-bold md:text-4xl">{t('ABOUT67')}</h2>
            </motion.div>
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {services.map((service, index) => (
                <motion.div
                  key={service.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <Link
                    href={service.href}
                    className="vetap-card group block transition-all hover:shadow-lg"
                  >
                    <h3 className="mb-2 font-semibold group-hover:underline">{service.title}</h3>
                    <p className="mb-4 text-sm leading-7 text-muted-foreground">{service.text}</p>
                    <span className="text-sm text-primary">
                      {t('ABOUT68')} <ArrowRight className="ml-1 inline h-4 w-4" />
                    </span>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Privacy & Security + Quick Stats */}
      <section className="vetap-section">
        <div className="vetap-container">
          <div className="mx-auto max-w-6xl">
            <div className="grid gap-10 lg:grid-cols-3">
              <motion.div
                initial={{ opacity: 0, x: isRtl ? 20 : -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.5 }}
                className="lg:col-span-2"
              >
                <h2 className="mb-6 text-3xl font-bold md:text-4xl">{t('ABOUT69')}</h2>
                <ul className="list-disc space-y-3 pl-6 leading-8 text-muted-foreground">
                  <li>{t('ABOUT70')}</li>
                  <li>{t('ABOUT71')}</li>
                  <li>{t('ABOUT72')}</li>
                </ul>
              </motion.div>

              <aside className="grid grid-cols-3 gap-4 text-center">
                {[
                  { value: t('ABOUT82'), label: t('ABOUT73') },
                  { value: t('ABOUT83'), label: t('ABOUT74') },
                  { value: t('ABOUT84'), label: t('ABOUT75') },
                ].map((stat, index) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    className="vetap-card p-5"
                  >
                    <div className="mb-1 text-3xl font-bold text-primary">{stat.value}</div>
                    <div className="text-xs text-muted-foreground">{stat.label}</div>
                  </motion.div>
                ))}
              </aside>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="vetap-section bg-muted/30">
        <div className="vetap-container">
          <div className="mx-auto max-w-4xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.5 }}
              className="mb-8"
            >
              <h2 className="mb-4 text-3xl font-bold md:text-4xl">{t('ABOUT76')}</h2>
            </motion.div>
            <div className="space-y-4">
              {faqs.map((faq, index) => (
                <motion.details
                  key={faq.question}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="vetap-card group"
                >
                  <summary className="cursor-pointer font-semibold transition-colors hover:text-primary">
                    {faq.question}
                  </summary>
                  <p className="mt-3 leading-8 text-muted-foreground">{faq.answer}</p>
                </motion.details>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="vetap-section">
        <div className="vetap-container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.5 }}
            className="mx-auto max-w-3xl text-center"
          >
            <h2 className="mb-4 text-3xl font-bold md:text-4xl">{t('ABOUT77')}</h2>
            <p className="mb-8 text-muted-foreground">{t('ABOUT78')}</p>
            <Button asChild size="lg" className="gap-2">
              <Link href="/contact">
                {t('ABOUT79')}
                <ArrowRight className="h-5 w-5" />
              </Link>
            </Button>
          </motion.div>
        </div>
      </section>
    </div>
  );
}

