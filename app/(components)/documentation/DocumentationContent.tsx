'use client';

import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { BookOpen, Code2, Smartphone, Shield, Zap, HelpCircle, ArrowRight, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

interface DocumentationContentProps {
  locale: 'ar' | 'en';
}

export function DocumentationContent({ locale }: DocumentationContentProps) {
  const t = useTranslations();

  const sections = [
    {
      id: 'nfc-cards',
      title: t('DOC_NFC_TITLE'),
      icon: Smartphone,
      description: t('DOC_NFC_DESCRIPTION'),
      topics: [
        {
          title: t('DOC_NFC_CREATE_TITLE'),
          content: t('DOC_NFC_CREATE_CONTENT'),
        },
        {
          title: t('DOC_NFC_SOCIAL_TITLE'),
          content: t('DOC_NFC_SOCIAL_CONTENT'),
        },
        {
          title: t('DOC_NFC_SHARE_TITLE'),
          content: t('DOC_NFC_SHARE_CONTENT'),
        },
      ],
    },
    {
      id: 'web-development',
      title: t('DOC_WEBDEV_TITLE'),
      icon: Code2,
      description: t('DOC_WEBDEV_DESCRIPTION'),
      topics: [
        {
          title: t('DOC_WEBDEV_START_TITLE'),
          content: t('DOC_WEBDEV_START_CONTENT'),
        },
        {
          title: t('DOC_WEBDEV_SEO_TITLE'),
          content: t('DOC_WEBDEV_SEO_CONTENT'),
        },
        {
          title: t('DOC_WEBDEV_SECURITY_TITLE'),
          content: t('DOC_WEBDEV_SECURITY_CONTENT'),
        },
      ],
    },
    {
      id: 'dashboard',
      title: t('DOC_DASHBOARD_TITLE'),
      icon: Zap,
      description: t('DOC_DASHBOARD_DESCRIPTION'),
      topics: [
        {
          title: t('DOC_DASHBOARD_PROFILE_TITLE'),
          content: t('DOC_DASHBOARD_PROFILE_CONTENT'),
        },
        {
          title: t('DOC_DASHBOARD_USERNAME_TITLE'),
          content: t('DOC_DASHBOARD_USERNAME_CONTENT'),
        },
        {
          title: t('DOC_DASHBOARD_TEMPLATE_TITLE'),
          content: t('DOC_DASHBOARD_TEMPLATE_CONTENT'),
        },
      ],
    },
    {
      id: 'security',
      title: t('DOC_SECURITY_TITLE'),
      icon: Shield,
      description: t('DOC_SECURITY_DESCRIPTION'),
      topics: [
        {
          title: t('DOC_SECURITY_DATA_TITLE'),
          content: t('DOC_SECURITY_DATA_CONTENT'),
        },
        {
          title: t('DOC_SECURITY_PRIVACY_TITLE'),
          content: t('DOC_SECURITY_PRIVACY_CONTENT'),
        },
      ],
    },
  ];

  const quickStart = [
    {
      step: 1,
      title: t('DOC_CREATE_ACCOUNT'),
      description: t('DOC_CREATE_ACCOUNT_DESC'),
    },
    {
      step: 2,
      title: t('DOC_CREATE_PROFILE'),
      description: t('DOC_CREATE_PROFILE_DESC'),
    },
    {
      step: 3,
      title: t('DOC_CUSTOMIZE_CARD'),
      description: t('DOC_CUSTOMIZE_CARD_DESC'),
    },
    {
      step: 4,
      title: t('DOC_SHARE_CARD'),
      description: t('DOC_SHARE_CARD_DESC'),
    },
  ];

  return (
    <div className="min-h-screen bg-background pt-24 pb-16">
      <div className="vetap-container">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-12 text-center"
        >
          <div className="mb-4 flex items-center justify-center gap-2">
            <BookOpen className="h-8 w-8 text-primary" />
            <h1 className="text-4xl font-bold md:text-5xl">
              {t('DOC_TITLE')}
            </h1>
          </div>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            {t('DOC_DESCRIPTION')}
          </p>
        </motion.div>

        {/* Quick Start */}
        <section className="mb-16">
          <h2 className="mb-6 text-2xl font-semibold">
            {t('DOC_QUICK_START')}
          </h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {quickStart.map((item, index) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true, margin: '-100px' }}
              >
                <Card className="h-full">
                  <CardHeader>
                    <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                      {item.step}
                    </div>
                    <CardTitle className="text-lg">{item.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription>{item.description}</CardDescription>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Documentation Sections */}
        <section className="space-y-8">
          {sections.map((section, sectionIndex) => {
            const Icon = section.icon;
            return (
              <motion.div
                key={section.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: sectionIndex * 0.1 }}
                viewport={{ once: true, margin: '-100px' }}
              >
                <Card>
                  <CardHeader>
                    <div className="mb-4 flex items-center gap-3">
                      <Icon className="h-6 w-6 text-primary" />
                      <CardTitle className="text-2xl">{section.title}</CardTitle>
                    </div>
                    <CardDescription className="text-base">{section.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Accordion type="single" collapsible className="w-full">
                      {section.topics.map((topic, topicIndex) => (
                        <AccordionItem key={topicIndex} value={`item-${sectionIndex}-${topicIndex}`}>
                          <AccordionTrigger className="text-left">
                            {topic.title}
                          </AccordionTrigger>
                          <AccordionContent className="text-muted-foreground">
                            {topic.content}
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </section>

        {/* Support CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          viewport={{ once: true, margin: '-100px' }}
          className="mt-16 rounded-lg border bg-muted/50 p-8 text-center"
        >
          <HelpCircle className="mx-auto mb-4 h-12 w-12 text-primary" />
          <h3 className="mb-4 text-2xl font-semibold">
            {t('DOC_NEED_HELP')}
          </h3>
          <p className="mb-6 text-muted-foreground">
            {t('DOC_NEED_HELP_DESC')}
          </p>
          <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
            <Button asChild variant="outline">
              <Link href={`/${locale}/support`}>
                {t('DOC_SUPPORT_CENTER')}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild>
              <Link href={`/${locale}/contact`}>
                {t('DOC_CONTACT_US')}
              </Link>
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

