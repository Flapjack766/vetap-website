'use client';

import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { Shield, Lock, Eye, FileText, Calendar } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface PrivacyContentProps {
  locale: 'ar' | 'en';
}

export function PrivacyContent({ locale }: PrivacyContentProps) {
  const t = useTranslations();
  const isArabic = locale === 'ar';
  const currentDate = new Date().toLocaleDateString(isArabic ? 'ar-SA' : 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const sections = [
    {
      icon: FileText,
      title: t('PRIVACY_SECTION1_TITLE'),
      content: t('PRIVACY_SECTION1_CONTENT'),
    },
    {
      icon: Eye,
      title: t('PRIVACY_SECTION2_TITLE'),
      content: t('PRIVACY_SECTION2_CONTENT'),
    },
    {
      icon: Lock,
      title: t('PRIVACY_SECTION3_TITLE'),
      content: t('PRIVACY_SECTION3_CONTENT'),
    },
    {
      icon: Shield,
      title: t('PRIVACY_SECTION4_TITLE'),
      content: t('PRIVACY_SECTION4_CONTENT'),
    },
    {
      icon: Calendar,
      title: t('PRIVACY_SECTION5_TITLE'),
      content: t('PRIVACY_SECTION5_CONTENT'),
    },
    {
      icon: FileText,
      title: t('PRIVACY_SECTION6_TITLE'),
      content: t('PRIVACY_SECTION6_CONTENT'),
    },
    {
      icon: Calendar,
      title: t('PRIVACY_SECTION7_TITLE'),
      content: t('PRIVACY_SECTION7_CONTENT'),
    },
  ];

  return (
    <div className="min-h-screen bg-background pt-24 pb-16">
      <div className="vetap-container max-w-4xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-12 text-center"
        >
          <div className="mb-4 flex items-center justify-center gap-2">
            <Shield className="h-8 w-8 text-primary" />
            <h1 className="text-4xl font-bold md:text-5xl">
              {t('PRIVACY_TITLE')}
            </h1>
          </div>
          <p className="mx-auto max-w-2xl text-muted-foreground">
            {t('PRIVACY_LAST_UPDATED')} {currentDate}
          </p>
        </motion.div>

        {/* Introduction */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          viewport={{ once: true, margin: '-100px' }}
          className="mb-12"
        >
          <Card>
            <CardContent className="pt-6">
              <p className="text-lg leading-relaxed text-muted-foreground">
                {t('PRIVACY_INTRO')}
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Sections */}
        <div className="space-y-6">
          {sections.map((section, index) => {
            const Icon = section.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 + index * 0.05 }}
                viewport={{ once: true, margin: '-100px' }}
              >
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <Icon className="h-6 w-6 text-primary" />
                      <CardTitle className="text-xl">{section.title}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="leading-relaxed text-muted-foreground">{section.content}</p>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* Contact */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          viewport={{ once: true, margin: '-100px' }}
          className="mt-12 rounded-lg border bg-muted/50 p-8 text-center"
        >
          <h3 className="mb-4 text-2xl font-semibold">
            {t('PRIVACY_CONTACT')}
          </h3>
          <p className="mb-4 text-muted-foreground">
            {t('PRIVACY_CONTACT_DESC')}
          </p>
          <p className="text-lg">
            <strong>Email:</strong>{' '}
            <a href="mailto:support@vetaps.com" className="text-primary hover:underline">
              support@vetaps.com
            </a>
          </p>
        </motion.div>
      </div>
    </div>
  );
}

