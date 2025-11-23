'use client';

import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { Calendar, Clock, ArrowLeft, Code2, Zap, Shield, Globe, CheckCircle2, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CodeBlock } from './CodeBlock';

// Helper to get raw translation without parsing
function getRawTranslation(t: ReturnType<typeof useTranslations>, key: string): string {
  try {
    // Use the translation function but get raw value
    return t.raw(key) || t(key);
  } catch {
    return t(key);
  }
}

interface BlogPostContentProps {
  locale: 'ar' | 'en';
  postId: number;
  postContent?: {
    title: string;
    excerpt: string;
    intro?: string;
    whatIs?: string;
    rsc?: string;
    ppr?: string;
    caching?: string;
    howItWorks?: string;
    benefits?: string;
    implementation?: string;
    bestPractices?: string;
    statistics?: string;
    useCases?: string;
    pitfalls?: string;
    performance?: string;
    gettingStarted?: string;
    // Post 3 (SEO)
    structuredData?: string;
    coreWebVitals?: string;
    contentStrategy?: string;
    technicalSeo?: string;
    localSeo?: string;
    // Post 4 (Security)
    rls?: string;
    csp?: string;
    encryption?: string;
    authentication?: string;
    rateLimiting?: string;
    inputValidation?: string;
    // Post 5 (TypeScript)
    basics?: string;
    advanced?: string;
    nextjs?: string;
    // Post 6 (Performance)
    ssrSsg?: string;
    imageOptimization?: string;
    codeSplitting?: string;
    faq?: string;
    conclusion?: string;
  } | null;
}

function renderMarkdownContent(content: string, isArabic: boolean) {
  const lines = content.split('\n');
  const elements: any[] = [];
  let currentCodeBlock = '';
  let inCodeBlock = false;
  let codeLanguage = 'tsx';
  let currentListItems: any[] = [];
  let inList = false;
  let tableRows: any[] = [];
  let tableHeader: any = null;
  let inTable = false;

  lines.forEach((line, index) => {
    // Code blocks
    if (line.startsWith('```')) {
      if (inCodeBlock) {
        // End of code block
        elements.push({
          type: 'code',
          code: currentCodeBlock.trim(),
          language: codeLanguage,
          key: `code-${index}`,
        });
        currentCodeBlock = '';
        inCodeBlock = false;
      } else {
        // Start of code block
        codeLanguage = line.replace('```', '').trim() || 'tsx';
        inCodeBlock = true;
      }
      return;
    }

    if (inCodeBlock) {
      currentCodeBlock += line + '\n';
      return;
    }

    // Headers
    if (line.startsWith('## ')) {
      // Close any open lists or tables
      if (inList && currentListItems.length > 0) {
        elements.push({ type: 'ul', items: currentListItems, key: `ul-${index}` });
        currentListItems = [];
        inList = false;
      }
      if (inTable && tableRows.length > 0) {
        elements.push({ type: 'table', header: tableHeader, rows: tableRows, key: `table-${index}` });
        tableRows = [];
        tableHeader = null;
        inTable = false;
      }

      elements.push({
        type: 'h2',
        text: line.replace('## ', ''),
        key: `h2-${index}`,
      });
      return;
    }

    if (line.startsWith('### ')) {
      if (inList && currentListItems.length > 0) {
        elements.push({ type: 'ul', items: currentListItems, key: `ul-${index}` });
        currentListItems = [];
        inList = false;
      }
      if (inTable && tableRows.length > 0) {
        elements.push({ type: 'table', header: tableHeader, rows: tableRows, key: `table-${index}` });
        tableRows = [];
        tableHeader = null;
        inTable = false;
      }

      elements.push({
        type: 'h3',
        text: line.replace('### ', ''),
        key: `h3-${index}`,
      });
      return;
    }

    // Tables
    if (line.includes('|') && line.split('|').length > 2) {
      const isSeparator = line.trim().match(/^\|[\s\-:]+\|$/);
      
      if (isSeparator) {
        // This is the separator line, table header was before this
        inTable = true;
        return;
      }

      if (!inTable && !tableHeader) {
        // First row is header
        const cells = line.split('|').filter(c => c.trim()).map(c => c.trim());
        tableHeader = cells;
        inTable = true;
      } else if (inTable) {
        const cells = line.split('|').filter(c => c.trim()).map(c => c.trim());
        if (cells.length > 0) {
          tableRows.push(cells);
        }
      }
      return;
    }

    // If we hit a non-table line and we're in a table, close it
    if (inTable && line.trim() && !line.includes('|')) {
      elements.push({ type: 'table', header: tableHeader, rows: tableRows, key: `table-${index}` });
      tableRows = [];
      tableHeader = null;
      inTable = false;
    }

    // Lists
    if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
      if (!inList) {
        inList = true;
      }
      const text = line.replace(/^[-*]\s+/, '');
      currentListItems.push({ text, key: `li-${index}` });
      return;
    }

    // If we hit a non-list line and we're in a list, close it
    if (inList && line.trim() && !line.trim().startsWith('- ') && !line.trim().startsWith('* ')) {
      elements.push({ type: 'ul', items: currentListItems, key: `ul-${index}` });
      currentListItems = [];
      inList = false;
    }

    // Empty lines
    if (line.trim() === '') {
      return;
    }

    // Regular paragraphs (only if not in table or list)
    if (line.trim() && !inTable && !inList) {
      elements.push({
        type: 'p',
        text: line,
        key: `p-${index}`,
      });
    }
  });

  // Close any remaining lists or tables
  if (inList && currentListItems.length > 0) {
    elements.push({ type: 'ul', items: currentListItems, key: 'ul-final' });
  }
  if (inTable && tableRows.length > 0) {
    elements.push({ type: 'table', header: tableHeader, rows: tableRows, key: 'table-final' });
  }

  // Render elements
  return (
    <div className="space-y-4">
      {elements.map((element) => {
        switch (element.type) {
          case 'h2':
            return (
              <h2 key={element.key} className="text-2xl font-bold mt-8 mb-4">
                {element.text}
              </h2>
            );
          case 'h3':
            return (
              <h3 key={element.key} className="text-xl font-semibold mt-6 mb-3">
                {element.text}
              </h3>
            );
          case 'p':
            if (element.text.includes('`')) {
              const parts = element.text.split('`');
              return (
                <p key={element.key} className="mb-4 leading-relaxed text-foreground">
                  {parts.map((part: string, partIndex: number) => 
                    partIndex % 2 === 1 ? (
                      <code key={partIndex} className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono">
                        {part}
                      </code>
                    ) : (
                      <span key={partIndex}>{part}</span>
                    )
                  )}
                </p>
              );
            }
            return (
              <p key={element.key} className="mb-4 leading-relaxed text-foreground">
                {element.text}
              </p>
            );
          case 'code':
            return <CodeBlock key={element.key} code={element.code} language={element.language} />;
          case 'ul':
            return (
              <ul key={element.key} className="list-disc list-inside space-y-2 mb-4 ml-4">
                {element.items.map((item: any) => {
                  if (item.text.includes('**')) {
                    const parts = item.text.split('**');
                    return (
                      <li key={item.key} className="mb-2">
                        {parts.map((part: string, partIndex: number) => 
                          partIndex % 2 === 1 ? (
                            <strong key={partIndex}>{part}</strong>
                          ) : (
                            <span key={partIndex}>{part}</span>
                          )
                        )}
                      </li>
                    );
                  }
                  return <li key={item.key} className="mb-2">{item.text}</li>;
                })}
              </ul>
            );
          case 'table':
            return (
              <div key={element.key} className="my-6 overflow-x-auto rounded-lg border">
                <table className="w-full border-collapse">
                  {element.header && (
                    <thead>
                      <tr className="border-b bg-muted">
                        {element.header.map((cell: string, cellIndex: number) => (
                          <th key={cellIndex} className="px-4 py-3 text-left font-semibold">
                            {cell}
                          </th>
                        ))}
                      </tr>
                    </thead>
                  )}
                  <tbody>
                    {element.rows.map((row: string[], rowIndex: number) => (
                      <tr key={rowIndex} className="border-b">
                        {row.map((cell, cellIndex) => (
                          <td key={cellIndex} className="px-4 py-2">
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          default:
            return null;
        }
      })}
    </div>
  );
}

export function BlogPostContent({ locale, postId, postContent }: BlogPostContentProps) {
  const t = useTranslations();
  const isArabic = locale === 'ar';

  const postData = {
    1: {
      title: postContent?.title || t('BLOG_POST1_TITLE'),
      excerpt: postContent?.excerpt || t('BLOG_POST1_EXCERPT'),
      intro: postContent?.intro || '',
      whatIs: postContent?.whatIs || '',
      rsc: postContent?.rsc || '',
      ppr: postContent?.ppr || '',
      caching: postContent?.caching || '',
      useCases: postContent?.useCases || '',
      pitfalls: postContent?.pitfalls || '',
      performance: postContent?.performance || '',
      gettingStarted: postContent?.gettingStarted || '',
      faq: postContent?.faq || '',
      conclusion: postContent?.conclusion || '',
      category: isArabic ? 'تطوير المواقع' : 'Web Development',
      date: '2025-11-23',
      readTime: '15',
      icon: Code2,
    },
    2: {
      title: postContent?.title || t('BLOG_POST2_TITLE'),
      excerpt: postContent?.excerpt || t('BLOG_POST2_EXCERPT'),
      intro: postContent?.intro || '',
      whatIs: postContent?.whatIs || '',
      howItWorks: postContent?.howItWorks || '',
      benefits: postContent?.benefits || '',
      useCases: postContent?.useCases || '',
      implementation: postContent?.implementation || '',
      bestPractices: postContent?.bestPractices || '',
      pitfalls: postContent?.pitfalls || '',
      statistics: postContent?.statistics || '',
      faq: postContent?.faq || '',
      conclusion: postContent?.conclusion || '',
      category: isArabic ? 'تقنيات NFC' : 'NFC Technology',
      date: '2025-11-23',
      readTime: '12',
      icon: Zap,
    },
    3: {
      title: postContent?.title || t('BLOG_POST3_TITLE'),
      excerpt: postContent?.excerpt || t('BLOG_POST3_EXCERPT'),
      intro: postContent?.intro || '',
      whatIs: postContent?.whatIs || '',
      structuredData: postContent?.structuredData || '',
      coreWebVitals: postContent?.coreWebVitals || '',
      contentStrategy: postContent?.contentStrategy || '',
      technicalSeo: postContent?.technicalSeo || '',
      localSeo: postContent?.localSeo || '',
      useCases: postContent?.useCases || '',
      pitfalls: postContent?.pitfalls || '',
      statistics: postContent?.statistics || '',
      faq: postContent?.faq || '',
      conclusion: postContent?.conclusion || '',
      category: isArabic ? 'تحسين SEO' : 'SEO Optimization',
      date: '2025-11-23',
      readTime: '15',
      icon: Globe,
    },
    4: {
      title: postContent?.title || t('BLOG_POST4_TITLE'),
      excerpt: postContent?.excerpt || t('BLOG_POST4_EXCERPT'),
      intro: postContent?.intro || '',
      whatIs: postContent?.whatIs || '',
      rls: postContent?.rls || '',
      csp: postContent?.csp || '',
      encryption: postContent?.encryption || '',
      authentication: postContent?.authentication || '',
      rateLimiting: postContent?.rateLimiting || '',
      inputValidation: postContent?.inputValidation || '',
      useCases: postContent?.useCases || '',
      pitfalls: postContent?.pitfalls || '',
      statistics: postContent?.statistics || '',
      faq: postContent?.faq || '',
      conclusion: postContent?.conclusion || '',
      category: isArabic ? 'الأمان' : 'Security',
      date: '2025-11-23',
      readTime: '15',
      icon: Shield,
    },
    5: {
      title: postContent?.title || t('BLOG_POST5_TITLE'),
      excerpt: postContent?.excerpt || t('BLOG_POST5_EXCERPT'),
      intro: postContent?.intro || '',
      whatIs: postContent?.whatIs || '',
      basics: postContent?.basics || '',
      advanced: postContent?.advanced || '',
      nextjs: postContent?.nextjs || '',
      bestPractices: postContent?.bestPractices || '',
      useCases: postContent?.useCases || '',
      pitfalls: postContent?.pitfalls || '',
      statistics: postContent?.statistics || '',
      faq: postContent?.faq || '',
      conclusion: postContent?.conclusion || '',
      category: isArabic ? 'تطوير المواقع' : 'Web Development',
      date: '2025-11-23',
      readTime: '12',
      icon: Code2,
    },
    6: {
      title: postContent?.title || t('BLOG_POST6_TITLE'),
      excerpt: postContent?.excerpt || t('BLOG_POST6_EXCERPT'),
      intro: postContent?.intro || '',
      whatIs: postContent?.whatIs || '',
      ssrSsg: postContent?.ssrSsg || '',
      imageOptimization: postContent?.imageOptimization || '',
      codeSplitting: postContent?.codeSplitting || '',
      caching: postContent?.caching || '',
      useCases: postContent?.useCases || '',
      pitfalls: postContent?.pitfalls || '',
      statistics: postContent?.statistics || '',
      faq: postContent?.faq || '',
      conclusion: postContent?.conclusion || '',
      category: isArabic ? 'الأداء' : 'Performance',
      date: '2025-11-23',
      readTime: '12',
      icon: Zap,
    },
  };

  const post = postData[postId as keyof typeof postData];
  
  if (!post) {
    return (
      <div className="min-h-screen bg-background pt-24 pb-16">
        <div className="vetap-container text-center">
          <h1 className="text-4xl font-bold mb-4">
            {t('BLOG_POST_NOT_FOUND')}
          </h1>
          <Button asChild>
            <Link href={`/${locale}/blog`}>
              {t('BLOG_BACK_TO_BLOG')}
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  const Icon = post.icon;

  return (
    <div className="min-h-screen bg-background pt-24 pb-16">
      <div className="vetap-container max-w-4xl">
        {/* Back Button */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <Button variant="ghost" asChild>
            <Link href={`/${locale}/blog`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t('BLOG_BACK_TO_BLOG')}
            </Link>
          </Button>
        </motion.div>

        {/* Article Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <div className="mb-4 flex items-center gap-2">
            <Icon className="h-5 w-5 text-primary" />
            <span className="text-sm font-medium text-primary">{post.category}</span>
          </div>
          <h1 className="mb-4 text-4xl font-bold md:text-5xl">{post.title}</h1>
          <p className="mb-6 text-xl text-muted-foreground">{post.excerpt}</p>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              <span>{post.date}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span>{post.readTime} {t('BLOG_MIN_READ')}</span>
            </div>
          </div>
        </motion.div>

        {/* Article Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          viewport={{ once: true, margin: '-100px' }}
          className="space-y-8"
        >
          {/* Special handling for Posts 1-6 with structured content */}
          {postId >= 1 && postId <= 6 && 'intro' in post && post.intro ? (
            <article className="space-y-8">
              {/* Introduction */}
              {'intro' in post && post.intro && (
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-lg leading-relaxed text-foreground">{post.intro}</p>
                  </CardContent>
                </Card>
              )}

              {/* What is */}
              {'whatIs' in post && post.whatIs && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-2xl">{isArabic ? 'ما هو' : 'What is'}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {renderMarkdownContent(post.whatIs, isArabic)}
                  </CardContent>
                </Card>
              )}

              {/* Post 1 specific sections */}
              {postId === 1 && (
                <>
                  {/* React Server Components */}
                  {'rsc' in post && post.rsc && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-2xl">{isArabic ? 'React Server Components' : 'React Server Components'}</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {renderMarkdownContent(post.rsc, isArabic)}
                      </CardContent>
                    </Card>
                  )}

                  {/* Partial Prerendering */}
                  {'ppr' in post && post.ppr && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-2xl">{isArabic ? 'Partial Prerendering' : 'Partial Prerendering'}</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {renderMarkdownContent(post.ppr, isArabic)}
                      </CardContent>
                    </Card>
                  )}

                  {/* Caching */}
                  {'caching' in post && post.caching && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-2xl">{isArabic ? 'التخزين المؤقت المتقدم' : 'Advanced Caching'}</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {renderMarkdownContent(post.caching, isArabic)}
                      </CardContent>
                    </Card>
                  )}
                </>
              )}

              {/* Post 2 specific sections */}
              {postId === 2 && (
                <>
                  {/* How It Works */}
                  {'howItWorks' in post && post.howItWorks && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-2xl">{isArabic ? 'كيف تعمل تقنية NFC' : 'How NFC Technology Works'}</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {renderMarkdownContent(post.howItWorks, isArabic)}
                      </CardContent>
                    </Card>
                  )}

                  {/* Benefits */}
                  {'benefits' in post && post.benefits && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-2xl">{isArabic ? 'فوائد بطاقات NFC الذكية' : 'Benefits of NFC Smart Cards'}</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {renderMarkdownContent(post.benefits, isArabic)}
                      </CardContent>
                    </Card>
                  )}

                  {/* Implementation */}
                  {'implementation' in post && post.implementation && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-2xl">{isArabic ? 'دليل التطبيق' : 'Implementation Guide'}</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {renderMarkdownContent(post.implementation, isArabic)}
                      </CardContent>
                    </Card>
                  )}

                  {/* Best Practices */}
                  {'bestPractices' in post && post.bestPractices && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-2xl">{isArabic ? 'أفضل الممارسات' : 'Best Practices'}</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {renderMarkdownContent(post.bestPractices, isArabic)}
                      </CardContent>
                    </Card>
                  )}

                  {/* Statistics */}
                  {'statistics' in post && post.statistics && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-2xl">{isArabic ? 'إحصائيات بطاقات NFC' : 'NFC Card Statistics'}</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {renderMarkdownContent(post.statistics, isArabic)}
                      </CardContent>
                    </Card>
                  )}
                </>
              )}

              {/* Post 3 specific sections (SEO) */}
              {postId === 3 && (
                <>
                  {'structuredData' in post && post.structuredData && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-2xl">{isArabic ? 'Structured Data (JSON-LD)' : 'Structured Data (JSON-LD)'}</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {renderMarkdownContent(post.structuredData, isArabic)}
                      </CardContent>
                    </Card>
                  )}

                  {'coreWebVitals' in post && post.coreWebVitals && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-2xl">{isArabic ? 'Core Web Vitals' : 'Core Web Vitals'}</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {renderMarkdownContent(post.coreWebVitals, isArabic)}
                      </CardContent>
                    </Card>
                  )}

                  {'contentStrategy' in post && post.contentStrategy && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-2xl">{isArabic ? 'استراتيجية المحتوى و E-A-T' : 'Content Strategy and E-A-T'}</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {renderMarkdownContent(post.contentStrategy, isArabic)}
                      </CardContent>
                    </Card>
                  )}

                  {'technicalSeo' in post && post.technicalSeo && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-2xl">{isArabic ? 'أساسيات Technical SEO' : 'Technical SEO Essentials'}</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {renderMarkdownContent(post.technicalSeo, isArabic)}
                      </CardContent>
                    </Card>
                  )}

                  {'localSeo' in post && post.localSeo && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-2xl">{isArabic ? 'تحسين SEO المحلي' : 'Local SEO Optimization'}</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {renderMarkdownContent(post.localSeo, isArabic)}
                      </CardContent>
                    </Card>
                  )}
                </>
              )}

              {/* Post 4 specific sections (Security) */}
              {postId === 4 && (
                <>
                  {'rls' in post && post.rls && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-2xl">{isArabic ? 'Row Level Security (RLS)' : 'Row Level Security (RLS)'}</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {renderMarkdownContent(post.rls, isArabic)}
                      </CardContent>
                    </Card>
                  )}

                  {'csp' in post && post.csp && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-2xl">{isArabic ? 'Content Security Policy (CSP)' : 'Content Security Policy (CSP)'}</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {renderMarkdownContent(post.csp, isArabic)}
                      </CardContent>
                    </Card>
                  )}

                  {'encryption' in post && post.encryption && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-2xl">{isArabic ? 'التشفير' : 'Encryption'}</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {renderMarkdownContent(post.encryption, isArabic)}
                      </CardContent>
                    </Card>
                  )}

                  {'authentication' in post && post.authentication && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-2xl">{isArabic ? 'المصادقة والتفويض' : 'Authentication and Authorization'}</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {renderMarkdownContent(post.authentication, isArabic)}
                      </CardContent>
                    </Card>
                  )}

                  {'rateLimiting' in post && post.rateLimiting && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-2xl">{isArabic ? 'Rate Limiting' : 'Rate Limiting'}</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {renderMarkdownContent(post.rateLimiting, isArabic)}
                      </CardContent>
                    </Card>
                  )}

                  {'inputValidation' in post && post.inputValidation && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-2xl">{isArabic ? 'التحقق من المدخلات وتنظيفها' : 'Input Validation and Sanitization'}</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {renderMarkdownContent(post.inputValidation, isArabic)}
                      </CardContent>
                    </Card>
                  )}
                </>
              )}

              {/* Post 5 specific sections (TypeScript) */}
              {postId === 5 && (
                <>
                  {'basics' in post && post.basics && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-2xl">{isArabic ? 'أساسيات TypeScript' : 'TypeScript Basics'}</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {renderMarkdownContent(post.basics, isArabic)}
                      </CardContent>
                    </Card>
                  )}

                  {'advanced' in post && post.advanced && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-2xl">{isArabic ? 'ميزات TypeScript المتقدمة' : 'Advanced TypeScript Features'}</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {renderMarkdownContent(post.advanced, isArabic)}
                      </CardContent>
                    </Card>
                  )}

                  {'nextjs' in post && post.nextjs && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-2xl">{isArabic ? 'TypeScript في Next.js' : 'TypeScript in Next.js'}</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {renderMarkdownContent(post.nextjs, isArabic)}
                      </CardContent>
                    </Card>
                  )}

                  {'bestPractices' in post && post.bestPractices && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-2xl">{isArabic ? 'أفضل ممارسات TypeScript' : 'TypeScript Best Practices'}</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {renderMarkdownContent(post.bestPractices, isArabic)}
                      </CardContent>
                    </Card>
                  )}
                </>
              )}

              {/* Post 6 specific sections (Performance) */}
              {postId === 6 && (
                <>
                  {'ssrSsg' in post && post.ssrSsg && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-2xl">{isArabic ? 'SSR مقابل SSG' : 'SSR vs SSG'}</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {renderMarkdownContent(post.ssrSsg, isArabic)}
                      </CardContent>
                    </Card>
                  )}

                  {'imageOptimization' in post && post.imageOptimization && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-2xl">{isArabic ? 'تحسين الصور' : 'Image Optimization'}</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {renderMarkdownContent(post.imageOptimization, isArabic)}
                      </CardContent>
                    </Card>
                  )}

                  {'codeSplitting' in post && post.codeSplitting && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-2xl">{isArabic ? 'تقسيم الكود وتحسين الحزمة' : 'Code Splitting and Bundle Optimization'}</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {renderMarkdownContent(post.codeSplitting, isArabic)}
                      </CardContent>
                    </Card>
                  )}

                  {'caching' in post && post.caching && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-2xl">{isArabic ? 'استراتيجيات التخزين المؤقت' : 'Caching Strategies'}</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {renderMarkdownContent(post.caching, isArabic)}
                      </CardContent>
                    </Card>
                  )}
                </>
              )}

              {/* Use Cases */}
              {'useCases' in post && post.useCases && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-2xl">{isArabic ? 'حالات استخدام حقيقية' : 'Real-World Use Cases'}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {renderMarkdownContent(post.useCases, isArabic)}
                  </CardContent>
                </Card>
              )}

              {/* Pitfalls */}
              {'pitfalls' in post && post.pitfalls && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-2xl">{isArabic ? 'المشاكل الشائعة والقيود' : 'Common Pitfalls and Limitations'}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {renderMarkdownContent(post.pitfalls, isArabic)}
                  </CardContent>
                </Card>
              )}

              {/* Statistics */}
              {'statistics' in post && post.statistics && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-2xl">{isArabic ? 'الإحصائيات والتأثير' : 'Statistics and Impact'}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {renderMarkdownContent(post.statistics, isArabic)}
                  </CardContent>
                </Card>
              )}

              {/* Performance (Post 1 only) */}
              {postId === 1 && 'performance' in post && post.performance && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-2xl">{isArabic ? 'تحسينات الأداء' : 'Performance Optimizations'}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {renderMarkdownContent(post.performance, isArabic)}
                  </CardContent>
                </Card>
              )}

              {/* Getting Started (Post 1 only) */}
              {postId === 1 && 'gettingStarted' in post && post.gettingStarted && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-2xl">{isArabic ? 'البدء مع Next.js 15' : 'Getting Started'}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {renderMarkdownContent(post.gettingStarted, isArabic)}
                  </CardContent>
                </Card>
              )}

              {/* FAQ */}
              {'faq' in post && post.faq && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-2xl">{isArabic ? 'الأسئلة الشائعة' : 'Frequently Asked Questions'}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {renderMarkdownContent(post.faq, isArabic)}
                  </CardContent>
                </Card>
              )}

              {/* Conclusion */}
              {'conclusion' in post && post.conclusion && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-2xl">{isArabic ? 'الخلاصة' : 'Conclusion'}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {renderMarkdownContent(post.conclusion, isArabic)}
                  </CardContent>
                </Card>
              )}
            </article>
          ) : (
            'content' in post && typeof post.content === 'string' && post.content ? (
              <Card>
                <CardContent className="pt-6">
                  <article className="prose prose-lg dark:prose-invert max-w-none">
                    <div className="space-y-4 text-base leading-relaxed text-foreground">
                      {post.content.split('\n').map((paragraph: string, index: number) => (
                        <p key={index} className="mb-4">
                          {paragraph}
                        </p>
                      ))}
                    </div>
                  </article>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-center text-muted-foreground">
                    {t('BLOG_CONTENT_NOT_AVAILABLE')}
                  </p>
                </CardContent>
              </Card>
            )
          )}
        </motion.div>

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          viewport={{ once: true, margin: '-100px' }}
          className="mt-12 rounded-lg border bg-muted/50 p-8 text-center"
        >
          <h3 className="mb-4 text-2xl font-semibold">
            {t('BLOG_ENJOYED_ARTICLE')}
          </h3>
          <p className="mb-6 text-muted-foreground">
            {t('BLOG_CONTACT_DESCRIPTION')}
          </p>
          <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
            <Button variant="outline" asChild>
              <Link href={`/${locale}/blog`}>
                {t('BLOG_READ_MORE_ARTICLES')}
              </Link>
            </Button>
            <Button asChild>
              <Link href={`/${locale}/contact`}>
                {t('BLOG_CONTACT_US')}
              </Link>
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

