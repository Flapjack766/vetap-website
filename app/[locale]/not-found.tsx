'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { Home, ArrowRight, Search, FileQuestion } from 'lucide-react';
import { Button } from '@/app/(components)/ui/button';

export default function NotFound() {
  const t = useTranslations();

  const popularPages = [
    { href: '/services', label: t('A3'), icon: '💼' },
    // { href: '/portfolio', label: t('A4'), icon: '🎨' }, // مخفي مؤقتاً
    { href: '/about', label: t('A5'), icon: 'ℹ️' },
    { href: '/contact', label: t('A6'), icon: '📧' },
  ];

  return (
    <div className="flex min-h-[70vh] items-center justify-center py-16">
      <div className="vetap-container">
        <div className="mx-auto max-w-3xl">
          {/* 404 Illustration */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-8 text-center"
          >
            <div className="relative inline-block">
              <motion.div
                animate={{
                  scale: [1, 1.05, 1],
                  rotate: [0, 5, -5, 0],
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  repeatType: 'reverse',
                }}
              >
                <FileQuestion className="mx-auto h-32 w-32 text-muted-foreground/40" strokeWidth={1.5} />
              </motion.div>
              <motion.div
                className="absolute -top-4 -right-4"
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.5, 1, 0.5],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                }}
              >
                <Search className="h-12 w-12 text-primary/60" />
              </motion.div>
            </div>
          </motion.div>

          {/* Error Message */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mb-8 text-center"
          >
            <h1 className="mb-2 text-8xl font-bold tracking-tight md:text-9xl">
              <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                404
              </span>
            </h1>
            <h2 className="mb-4 text-2xl font-semibold md:text-3xl">{t('A201')}</h2>
            <p className="mb-2 text-lg text-muted-foreground">{t('A202')}</p>
            <p className="text-muted-foreground">{t('A203')}</p>
          </motion.div>

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="mb-12 flex flex-col gap-4 sm:flex-row sm:justify-center"
          >
            <Button asChild size="lg" className="gap-2">
              <Link href="/">
                <Home className="h-5 w-5" />
                {t('A204')}
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="gap-2">
              <Link href="/services">
                {t('A205')}
                <ArrowRight className="h-5 w-5" />
              </Link>
            </Button>
          </motion.div>

          {/* Popular Pages */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="vetap-card"
          >
            <p className="mb-6 text-center text-sm font-medium text-muted-foreground">
              {t('A207')}
            </p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {popularPages.map((page, index) => (
                <motion.div
                  key={page.href}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, delay: 0.7 + index * 0.1 }}
                >
                  <Link
                    href={page.href}
                    className="group flex flex-col items-center gap-3 rounded-lg border border-border bg-card p-6 transition-all hover:border-primary hover:bg-accent"
                  >
                    <span className="text-3xl">{page.icon}</span>
                    <span className="text-sm font-medium transition-colors group-hover:text-primary">
                      {page.label}
                    </span>
                  </Link>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Help Text */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 1 }}
            className="mt-8 text-center"
          >
            <p className="text-sm text-muted-foreground">
              {t('A35')}{' '}
              <Link
                href="/contact"
                className="font-medium text-primary underline-offset-4 hover:underline"
              >
                {t('A206')}
              </Link>
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

