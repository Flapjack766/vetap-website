'use client';

import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { Calendar, Clock, ArrowRight, BookOpen, Code2, Zap, Shield, Globe } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface BlogContentProps {
  locale: 'ar' | 'en';
}

export function BlogContent({ locale }: BlogContentProps) {
  const t = useTranslations();

  const blogPosts = [
    {
      id: 1,
      title: t('BLOG_POST1_TITLE'),
      excerpt: t('BLOG_POST1_EXCERPT'),
      category: t('BLOG_CATEGORY_WEB_DEV'),
      date: '2024-12-15',
      readTime: '15',
      icon: Code2,
      featured: true,
    },
    {
      id: 2,
      title: t('BLOG_POST2_TITLE'),
      excerpt: t('BLOG_POST2_EXCERPT'),
      category: t('BLOG_CATEGORY_NFC'),
      date: '2024-12-10',
      readTime: '12',
      icon: Zap,
      featured: true,
    },
    {
      id: 3,
      title: t('BLOG_POST3_TITLE'),
      excerpt: t('BLOG_POST3_EXCERPT'),
      category: t('BLOG_CATEGORY_SEO'),
      date: '2024-12-05',
      readTime: '10',
      icon: Globe,
      featured: false,
    },
    {
      id: 4,
      title: t('BLOG_POST4_TITLE'),
      excerpt: t('BLOG_POST4_EXCERPT'),
      category: t('BLOG_CATEGORY_SECURITY'),
      date: '2024-11-28',
      readTime: '12',
      icon: Shield,
      featured: false,
    },
    {
      id: 5,
      title: t('BLOG_POST5_TITLE'),
      excerpt: t('BLOG_POST5_EXCERPT'),
      category: t('BLOG_CATEGORY_WEB_DEV'),
      date: '2024-11-20',
      readTime: '7',
      icon: Code2,
      featured: false,
    },
    {
      id: 6,
      title: t('BLOG_POST6_TITLE'),
      excerpt: t('BLOG_POST6_EXCERPT'),
      category: t('BLOG_CATEGORY_PERFORMANCE'),
      date: '2024-11-15',
      readTime: '9',
      icon: Zap,
      featured: false,
    },
  ];

  const featuredPosts = blogPosts.filter(post => post.featured);
  const regularPosts = blogPosts.filter(post => !post.featured);

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
              {t('BLOG_TITLE')}
            </h1>
          </div>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            {t('BLOG_DESCRIPTION')}
          </p>
        </motion.div>

        {/* Featured Posts */}
        {featuredPosts.length > 0 && (
          <section className="mb-16">
            <h2 className="mb-6 text-2xl font-semibold">
              {t('BLOG_FEATURED_ARTICLES')}
            </h2>
            <div className="grid gap-6 md:grid-cols-2">
              {featuredPosts.map((post, index) => {
                const Icon = post.icon;
                return (
                  <motion.div
                    key={post.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                  >
                    <Card className="h-full transition-all hover:shadow-lg">
                      <CardHeader>
                        <div className="mb-2 flex items-center gap-2">
                          <Icon className="h-5 w-5 text-primary" />
                          <span className="text-sm font-medium text-primary">{post.category}</span>
                        </div>
                        <CardTitle className="text-xl">{post.title}</CardTitle>
                        <CardDescription className="mt-2">{post.excerpt}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="mb-4 flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            <span>{post.date}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            <span>{post.readTime} {t('BLOG_MIN_READ')}</span>
                          </div>
                        </div>
                        <Button variant="outline" className="w-full" asChild>
                          <Link href={`/${locale}/blog/${post.id}`}>
                            {t('BLOG_READ_MORE')}
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </Link>
                        </Button>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </section>
        )}

        {/* Regular Posts */}
        <section>
          <h2 className="mb-6 text-2xl font-semibold">
            {t('BLOG_ALL_ARTICLES')}
          </h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {regularPosts.map((post, index) => {
              const Icon = post.icon;
              return (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true, margin: '-100px' }}
                >
                  <Card className="h-full transition-all hover:shadow-lg">
                    <CardHeader>
                      <div className="mb-2 flex items-center gap-2">
                        <Icon className="h-4 w-4 text-primary" />
                        <span className="text-xs font-medium text-primary">{post.category}</span>
                      </div>
                      <CardTitle className="text-lg">{post.title}</CardTitle>
                      <CardDescription className="mt-2 line-clamp-3">{post.excerpt}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="mb-4 flex items-center gap-4 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>{post.date}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>{post.readTime} {t('BLOG_MIN')}</span>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" className="w-full" asChild>
                        <Link href={`/${locale}/blog/${post.id}`}>
                          {t('BLOG_READ_MORE')}
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </section>

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          viewport={{ once: true, margin: '-100px' }}
          className="mt-16 rounded-lg border bg-muted/50 p-8 text-center"
        >
          <h3 className="mb-4 text-2xl font-semibold">
            {t('BLOG_WANT_LEARN_MORE')}
          </h3>
          <p className="mb-6 text-muted-foreground">
            {t('BLOG_CONTACT_DESCRIPTION')}
          </p>
          <Button asChild size="lg">
            <Link href={`/${locale}/contact`}>
              {t('BLOG_CONTACT_US')}
            </Link>
          </Button>
        </motion.div>
      </div>
    </div>
  );
}

