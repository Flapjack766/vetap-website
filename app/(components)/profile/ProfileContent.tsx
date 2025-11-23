'use client';

import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { memo } from 'react';
import { 
  Globe, 
  Palette, 
  BarChart3, 
  Share2, 
  CheckCircle2, 
  ArrowRight,
  UserCircle,
  Users,
  Sparkles,
  Zap,
  Shield,
  Smartphone
} from 'lucide-react';
import { Button } from '@/app/(components)/ui/button';

export const ProfileContent = memo(function ProfileContent({ locale }: { locale: 'ar' | 'en' }) {
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
                <Globe className="h-4 w-4" />
                <span>{t('PROFILE1')}</span>
              </div>
              <h1 className="mb-4 text-4xl font-extrabold tracking-tight md:text-6xl">
                {t('PROFILE2')}
              </h1>
              <p className="mb-8 text-xl text-muted-foreground max-w-2xl mx-auto">
                {t('PROFILE3')}
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Button asChild size="lg" className="gap-2">
                  <Link href="/signup">
                    {t('PROFILE4')}
                    <ArrowRight className="h-5 w-5" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <a href="#features">{t('PROFILE5')}</a>
                </Button>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* One Account Section */}
      <section className="vetap-section">
        <div className="vetap-container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.5 }}
            className="mx-auto max-w-4xl text-center"
          >
            <div className="vetap-card bg-primary/5 border-primary/20 p-8 md:p-12">
              <UserCircle className="mx-auto mb-6 h-16 w-16 text-primary" />
              <h2 className="mb-4 text-3xl font-bold md:text-4xl">{t('PROFILE42')}</h2>
              <p className="mb-6 text-lg leading-relaxed text-muted-foreground max-w-2xl mx-auto">
                {t('PROFILE43')}
              </p>
              <p className="mb-8 text-base text-muted-foreground/80 max-w-xl mx-auto">
                {t('PROFILE44')}
              </p>
              <Button asChild size="lg" className="gap-2">
                <Link href="/signup">
                  {t('PROFILE45')}
                  <ArrowRight className="h-5 w-5" />
                </Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="vetap-section bg-muted/30">
        <div className="vetap-container">
          <div className="grid gap-12 lg:grid-cols-2 items-center">
            {/* Info */}
            <motion.div
              initial={{ opacity: 0, x: isRtl ? 20 : -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.5 }}
              className="space-y-6"
            >
              <div>
                <h2 className="mb-3 text-3xl font-bold">{t('PROFILE6')}</h2>
                <p className="text-lg leading-relaxed text-muted-foreground">
                  {t('PROFILE7')}
                </p>
              </div>

              <div className="space-y-4">
                <FeatureItem
                  icon={<Globe className="h-5 w-5" />}
                  title={t('PROFILE8')}
                  description={t('PROFILE9')}
                />
                <FeatureItem
                  icon={<Palette className="h-5 w-5" />}
                  title={t('PROFILE10')}
                  description={t('PROFILE11')}
                />
                <FeatureItem
                  icon={<BarChart3 className="h-5 w-5" />}
                  title={t('PROFILE12')}
                  description={t('PROFILE13')}
                />
              </div>
            </motion.div>

            {/* Image */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="flex justify-center"
            >
              <div className="w-full max-w-md">
                <Image
                  src="/images/bsp.png"
                  alt="Business Profile Page"
                  width={600}
                  height={400}
                  className="w-full h-auto rounded-lg shadow-lg"
                  priority
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
            <h2 className="mb-4 text-3xl font-bold">{t('PROFILE14')}</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {t('PROFILE15')}
            </p>
          </motion.div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <FeatureCard
              icon={<Globe className="h-6 w-6" />}
              title={t('PROFILE16')}
              description={t('PROFILE17')}
            />
            <FeatureCard
              icon={<Palette className="h-6 w-6" />}
              title={t('PROFILE18')}
              description={t('PROFILE19')}
            />
            <FeatureCard
              icon={<Share2 className="h-6 w-6" />}
              title={t('PROFILE20')}
              description={t('PROFILE21')}
            />
            <FeatureCard
              icon={<BarChart3 className="h-6 w-6" />}
              title={t('PROFILE22')}
              description={t('PROFILE23')}
            />
            <FeatureCard
              icon={<Smartphone className="h-6 w-6" />}
              title={t('PROFILE24')}
              description={t('PROFILE25')}
            />
            <FeatureCard
              icon={<Shield className="h-6 w-6" />}
              title={t('PROFILE26')}
              description={t('PROFILE27')}
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
              <h2 className="mb-4 text-3xl font-bold">{t('PROFILE28')}</h2>
              <p className="text-lg text-muted-foreground">
                {t('PROFILE29')}
              </p>
            </motion.div>

            <div className="space-y-4">
              {[
                { title: 'PROFILE30', desc: 'PROFILE31' },
                { title: 'PROFILE32', desc: 'PROFILE33' },
                { title: 'PROFILE34', desc: 'PROFILE35' },
                { title: 'PROFILE36', desc: 'PROFILE37' },
                { title: 'PROFILE38', desc: 'PROFILE39' },
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
            <h2 className="mb-4 text-3xl font-bold">{t('PROFILE40')}</h2>
            <p className="mb-6 text-lg text-muted-foreground max-w-2xl mx-auto">
              {t('PROFILE41')}
            </p>
            <Button asChild size="lg" className="gap-2">
              <Link href="/signup">
                {t('PROFILE4')}
                <ArrowRight className="h-5 w-5" />
              </Link>
            </Button>
          </motion.div>
        </div>
      </section>
    </div>
  );
});

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

