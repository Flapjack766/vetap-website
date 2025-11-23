'use client';

import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { 
  Smartphone, 
  Zap, 
  Shield, 
  Share2, 
  CheckCircle2, 
  ArrowRight,
  Radio,
  Users,
  Sparkles,
  Globe,
  Palette,
  BarChart3,
  UserCircle
} from 'lucide-react';
import { memo } from 'react';
import dynamic from 'next/dynamic';
import { Button } from '@/app/(components)/ui/button';

const Card3DViewer = dynamic(() => import('./Card3DViewer').then(mod => ({ default: mod.Card3DViewer })), {
  ssr: false,
  loading: () => <div className="w-full h-96 bg-muted animate-pulse rounded-lg" />
});

export function NFCContent({ locale }: { locale: 'ar' | 'en' }) {
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
                <span>{t('NFC1')}</span>
              </div>
              <h1 className="mb-4 text-4xl font-extrabold tracking-tight md:text-6xl">
                {t('NFC2')}
              </h1>
              <p className="mb-8 text-xl text-muted-foreground max-w-2xl mx-auto">
                {t('NFC3')}
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Button asChild size="lg" className="gap-2">
                  <Link href="/contact">
                    {t('NFC4')}
                    <ArrowRight className="h-5 w-5" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <a href="#demo">{t('NFC5')}</a>
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
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.5 }}
              className="flex justify-center -mt-8"
            >
              <Card3DViewer />
            </motion.div>

            {/* Info */}
            <motion.div
              initial={{ opacity: 0, x: isRtl ? -20 : 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="space-y-6"
            >
              <div>
                <h2 className="mb-3 text-3xl font-bold">{t('NFC6')}</h2>
                <p className="text-lg leading-relaxed text-muted-foreground">
                  {t('NFC7')}
                </p>
              </div>

              <div className="space-y-4">
                <FeatureItem
                  icon={<Smartphone className="h-5 w-5" />}
                  title={t('NFC8')}
                  description={t('NFC9')}
                />
                <FeatureItem
                  icon={<Zap className="h-5 w-5" />}
                  title={t('NFC10')}
                  description={t('NFC11')}
                />
                <FeatureItem
                  icon={<Share2 className="h-5 w-5" />}
                  title={t('NFC12')}
                  description={t('NFC13')}
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
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.5 }}
            className="mb-12 text-center"
          >
            <h2 className="mb-4 text-3xl font-bold">{t('NFC14')}</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {t('NFC15')}
            </p>
          </motion.div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <FeatureCard
              icon={<Radio className="h-6 w-6" />}
              title={t('NFC16')}
              description={t('NFC17')}
            />
            <FeatureCard
              icon={<Zap className="h-6 w-6" />}
              title={t('NFC18')}
              description={t('NFC19')}
            />
            <FeatureCard
              icon={<Shield className="h-6 w-6" />}
              title={t('NFC20')}
              description={t('NFC21')}
            />
            <FeatureCard
              icon={<Users className="h-6 w-6" />}
              title={t('NFC22')}
              description={t('NFC23')}
            />
            <FeatureCard
              icon={<Sparkles className="h-6 w-6" />}
              title={t('NFC24')}
              description={t('NFC25')}
            />
            <FeatureCard
              icon={<Share2 className="h-6 w-6" />}
              title={t('NFC26')}
              description={t('NFC27')}
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
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.5 }}
              className="mb-12 text-center"
            >
              <h2 className="mb-4 text-3xl font-bold">{t('NFC28')}</h2>
              <p className="text-lg text-muted-foreground">
                {t('NFC29')}
              </p>
            </motion.div>

            <div className="space-y-4">
              {[
                { title: 'NFC30', desc: 'NFC31' },
                { title: 'NFC32', desc: 'NFC33' },
                { title: 'NFC34', desc: 'NFC35' },
                { title: 'NFC36', desc: 'NFC37' },
                { title: 'NFC38', desc: 'NFC39' },
              ].map((item, i) => (
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
                    <h3 className="mb-1 font-semibold">{t(item.title)}</h3>
                    <p className="text-sm text-muted-foreground">{t(item.desc)}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Business Profile Section */}
      <section className="vetap-section bg-muted/30">
        <div className="vetap-container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.5 }}
            className="mx-auto max-w-4xl"
          >
            <div className="vetap-card bg-primary/5 border-primary/20 p-8 md:p-12">
              <div className="text-center mb-6">
                <UserCircle className="mx-auto mb-4 h-12 w-12 text-primary" />
                <h2 className="mb-3 text-3xl font-bold">{t('NFC51')}</h2>
                <p className="text-lg leading-relaxed text-muted-foreground max-w-2xl mx-auto">
                  {t('NFC52')}
                </p>
              </div>
              
              <div className="grid gap-4 md:grid-cols-3 mb-8">
                <div className="text-center">
                  <div className="inline-flex rounded-lg bg-primary/10 p-3 text-primary mb-3">
                    <Globe className="h-6 w-6" />
                  </div>
                  <h3 className="font-semibold mb-2">{t('NFC53')}</h3>
                  <p className="text-sm text-muted-foreground">{t('NFC54')}</p>
                </div>
                <div className="text-center">
                  <div className="inline-flex rounded-lg bg-primary/10 p-3 text-primary mb-3">
                    <Palette className="h-6 w-6" />
                  </div>
                  <h3 className="font-semibold mb-2">{t('NFC55')}</h3>
                  <p className="text-sm text-muted-foreground">{t('NFC56')}</p>
                </div>
                <div className="text-center">
                  <div className="inline-flex rounded-lg bg-primary/10 p-3 text-primary mb-3">
                    <BarChart3 className="h-6 w-6" />
                  </div>
                  <h3 className="font-semibold mb-2">{t('NFC57')}</h3>
                  <p className="text-sm text-muted-foreground">{t('NFC58')}</p>
                </div>
              </div>
              
              <div className="text-center">
                <Button asChild size="lg" className="gap-2">
                  <Link href="/Business-Profile">
                    {t('NFC59')}
                    <ArrowRight className="h-5 w-5" />
                  </Link>
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="vetap-section">
        <div className="vetap-container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.5 }}
            className="vetap-card bg-primary/5 border-primary/20 text-center"
          >
            <h2 className="mb-4 text-3xl font-bold">{t('NFC40')}</h2>
            <p className="mb-6 text-lg text-muted-foreground max-w-2xl mx-auto">
              {t('NFC41')}
            </p>
            <Button asChild size="lg" className="gap-2">
              <Link href="/contact">
                {t('NFC4')}
                <ArrowRight className="h-5 w-5" />
              </Link>
            </Button>
          </motion.div>
        </div>
      </section>
    </div>
  );
}

const FeatureItem = memo(function FeatureItem({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
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
});

const FeatureCard = memo(function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
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
});

