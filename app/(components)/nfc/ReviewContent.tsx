'use client';

import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { 
  Zap, 
  Shield, 
  CheckCircle2, 
  ArrowRight,
  Radio,
  Users,
  Sparkles,
  Star,
  TrendingUp,
  BarChart3
} from 'lucide-react';
import { Button } from '@/app/(components)/ui/button';
import { ReviewCard3DViewer } from './ReviewCard3DViewer';

export function ReviewContent({ locale }: { locale: 'ar' | 'en' }) {
  const t = useTranslations();
  const isRtl = locale === 'ar';

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
                <Radio className="h-4 w-4" />
                <span>{t('REVIEW1')}</span>
              </div>
              <h1 className="mb-4 text-4xl font-extrabold tracking-tight md:text-6xl">
                {t('REVIEW2')}
              </h1>
              <p className="mb-8 text-xl text-muted-foreground max-w-2xl mx-auto">
                {t('REVIEW3')}
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Button asChild size="lg" className="gap-2">
                  <Link href="/contact">
                    {t('REVIEW4')}
                    <ArrowRight className="h-5 w-5" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <a href="#demo">{t('REVIEW5')}</a>
                </Button>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* 3D Card Demo */}
      <section id="demo" className="vetap-section bg-muted/30">
        <div className="vetap-container">
          <div className="grid gap-12 lg:grid-cols-[1.2fr_1fr] items-center">
            {/* 3D Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="flex justify-center"
            >
              <ReviewCard3DViewer />
            </motion.div>

            {/* Info */}
            <motion.div
              initial={{ opacity: 0, x: isRtl ? -20 : 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="space-y-6"
            >
              <div>
                <h2 className="mb-3 text-3xl font-bold">{t('REVIEW6')}</h2>
                <p className="text-lg leading-relaxed text-muted-foreground">
                  {t('REVIEW7')}
                </p>
              </div>

              <div className="space-y-4">
                <FeatureItem
                  icon={<Star className="h-5 w-5" />}
                  title={t('REVIEW8')}
                  description={t('REVIEW9')}
                />
                <FeatureItem
                  icon={<Shield className="h-5 w-5" />}
                  title={t('REVIEW10')}
                  description={t('REVIEW11')}
                />
                <FeatureItem
                  icon={<BarChart3 className="h-5 w-5" />}
                  title={t('REVIEW12')}
                  description={t('REVIEW13')}
                />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="vetap-section">
        <div className="vetap-container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="mb-12 text-center"
          >
            <h2 className="mb-4 text-3xl font-bold">{t('REVIEW14')}</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {t('REVIEW15')}
            </p>
          </motion.div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <FeatureCard
              icon={<TrendingUp className="h-6 w-6" />}
              title={t('REVIEW16')}
              description={t('REVIEW17')}
            />
            <FeatureCard
              icon={<Star className="h-6 w-6" />}
              title={t('REVIEW18')}
              description={t('REVIEW19')}
            />
            <FeatureCard
              icon={<Zap className="h-6 w-6" />}
              title={t('REVIEW20')}
              description={t('REVIEW21')}
            />
            <FeatureCard
              icon={<Users className="h-6 w-6" />}
              title={t('REVIEW22')}
              description={t('REVIEW23')}
            />
            <FeatureCard
              icon={<Sparkles className="h-6 w-6" />}
              title={t('REVIEW24')}
              description={t('REVIEW25')}
            />
            <FeatureCard
              icon={<BarChart3 className="h-6 w-6" />}
              title={t('REVIEW26')}
              description={t('REVIEW27')}
            />
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="vetap-section bg-muted/30">
        <div className="vetap-container">
          <div className="mx-auto max-w-3xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="mb-12 text-center"
            >
              <h2 className="mb-4 text-3xl font-bold">{t('REVIEW28')}</h2>
              <p className="text-lg text-muted-foreground">
                {t('REVIEW29')}
              </p>
            </motion.div>

            <div className="space-y-4">
              {[
                { title: 'REVIEW30', desc: 'REVIEW31' },
                { title: 'REVIEW32', desc: 'REVIEW33' },
                { title: 'REVIEW34', desc: 'REVIEW35' },
                { title: 'REVIEW36', desc: 'REVIEW37' },
                { title: 'REVIEW38', desc: 'REVIEW39' },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: isRtl ? 20 : -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  className="vetap-card flex items-start gap-4"
                >
                  <CheckCircle2 className="mt-1 h-5 w-5 shrink-0 text-primary" />
                  <div>
                    <h3 className="mb-1 font-semibold">{t(item.title)}</h3>
                    <p className="text-sm text-muted-foreground">{t(item.desc)}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="vetap-section">
        <div className="vetap-container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="vetap-card bg-primary/5 border-primary/20 text-center"
          >
            <h2 className="mb-4 text-3xl font-bold">{t('REVIEW40')}</h2>
            <p className="mb-6 text-lg text-muted-foreground max-w-2xl mx-auto">
              {t('REVIEW41')}
            </p>
            <Button asChild size="lg" className="gap-2">
              <Link href="/contact">
                {t('REVIEW4')}
                <ArrowRight className="h-5 w-5" />
              </Link>
            </Button>
          </motion.div>
        </div>
      </section>
    </div>
  );
}

function FeatureItem({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-1 shrink-0 rounded-lg bg-primary/10 p-2 text-primary">
        {icon}
      </div>
      <div>
        <h3 className="mb-1 font-semibold">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="vetap-card text-center"
    >
      <div className="mb-4 inline-flex rounded-lg bg-primary/10 p-3 text-primary">
        {icon}
      </div>
      <h3 className="mb-2 font-semibold">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </motion.div>
  );
}

