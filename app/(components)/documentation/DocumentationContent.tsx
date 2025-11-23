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
  const isArabic = locale === 'ar';

  const sections = [
    {
      id: 'nfc-cards',
      title: isArabic ? 'بطاقات NFC الذكية' : 'NFC Smart Cards',
      icon: Smartphone,
      description: isArabic
        ? 'تعلم كيفية إنشاء وإدارة بطاقات NFC الذكية لمشاركة معلومات الاتصال بسهولة'
        : 'Learn how to create and manage NFC smart cards for easy contact sharing',
      topics: [
        {
          title: isArabic ? 'إنشاء بطاقة NFC جديدة' : 'Creating a New NFC Card',
          content: isArabic
            ? 'ابدأ بإنشاء حساب في VETAP، ثم انتقل إلى لوحة التحكم واختر "إنشاء بطاقة جديدة". املأ معلوماتك الأساسية مثل الاسم، العنوان، الهاتف، والبريد الإلكتروني.'
            : 'Start by creating an account on VETAP, then go to the dashboard and select "Create New Card". Fill in your basic information such as name, address, phone, and email.',
        },
        {
          title: isArabic ? 'إضافة روابط التواصل الاجتماعي' : 'Adding Social Media Links',
          content: isArabic
            ? 'يمكنك إضافة روابط لـ WhatsApp، Twitter، Instagram، Snapchat، وغيرها من منصات التواصل الاجتماعي. هذه الروابط ستكون قابلة للمشاركة بضغطة واحدة عند استخدام البطاقة.'
            : 'You can add links to WhatsApp, Twitter, Instagram, Snapchat, and other social media platforms. These links will be shareable with a single tap when using the card.',
        },
        {
          title: isArabic ? 'مشاركة البطاقة' : 'Sharing Your Card',
          content: isArabic
            ? 'بعد إنشاء بطاقتك، يمكنك مشاركتها عبر رابط مباشر أو استخدام بطاقة NFC مادية. عند النقر على الرابط أو الاقتراب من البطاقة، سيتم فتح صفحة تحتوي على جميع معلومات الاتصال.'
            : 'After creating your card, you can share it via a direct link or use a physical NFC card. When clicking the link or tapping the card, a page will open with all your contact information.',
        },
      ],
    },
    {
      id: 'web-development',
      title: isArabic ? 'تطوير المواقع' : 'Web Development',
      icon: Code2,
      description: isArabic
        ? 'دليل شامل لتطوير المواقع باستخدام Next.js 15 و TypeScript'
        : 'Complete guide to web development using Next.js 15 and TypeScript',
      topics: [
        {
          title: isArabic ? 'بدء مشروع جديد' : 'Starting a New Project',
          content: isArabic
            ? 'نستخدم Next.js 15 مع TypeScript لبناء تطبيقات ويب عالية الأداء. المشروع يدعم Server-Side Rendering، Static Site Generation، وIncremental Static Regeneration لضمان أفضل أداء.'
            : 'We use Next.js 15 with TypeScript to build high-performance web applications. The project supports Server-Side Rendering, Static Site Generation, and Incremental Static Regeneration for optimal performance.',
        },
        {
          title: isArabic ? 'تحسين SEO' : 'SEO Optimization',
          content: isArabic
            ? 'نطبق أفضل ممارسات SEO بما في ذلك Structured Data (JSON-LD)، Open Graph tags، وCore Web Vitals optimization. كل صفحة تحتوي على metadata محسّن لمحركات البحث.'
            : 'We apply best SEO practices including Structured Data (JSON-LD), Open Graph tags, and Core Web Vitals optimization. Every page contains search engine optimized metadata.',
        },
        {
          title: isArabic ? 'الأمان والأداء' : 'Security & Performance',
          content: isArabic
            ? 'نستخدم Row Level Security (RLS) لحماية البيانات، Content Security Policy (CSP) لمنع XSS، وRate Limiting لحماية من الهجمات. الأداء محسّن باستخدام Image Optimization وCode Splitting.'
            : 'We use Row Level Security (RLS) to protect data, Content Security Policy (CSP) to prevent XSS, and Rate Limiting to protect against attacks. Performance is optimized using Image Optimization and Code Splitting.',
        },
      ],
    },
    {
      id: 'dashboard',
      title: isArabic ? 'لوحة التحكم' : 'Dashboard',
      icon: Zap,
      description: isArabic
        ? 'تعلم كيفية استخدام لوحة التحكم لإدارة ملفك الشخصي وبياناتك'
        : 'Learn how to use the dashboard to manage your profile and data',
      topics: [
        {
          title: isArabic ? 'إدارة الملف الشخصي' : 'Managing Your Profile',
          content: isArabic
            ? 'في لوحة التحكم، يمكنك تحديث معلوماتك الشخصية، إضافة صور، وتخصيص مظهر ملفك الشخصي. يمكنك أيضاً إنشاء عدة ملفات شخصية لأغراض مختلفة.'
            : 'In the dashboard, you can update your personal information, add images, and customize your profile appearance. You can also create multiple profiles for different purposes.',
        },
        {
          title: isArabic ? 'طلب اسم مستخدم مخصص' : 'Requesting Custom Username',
          content: isArabic
            ? 'يمكنك طلب اسم مستخدم مخصص لملفك الشخصي. اختر الفترة المناسبة (أسبوع، شهر، أو سنة) وانتظر الموافقة من الفريق.'
            : 'You can request a custom username for your profile. Choose the appropriate period (week, month, or year) and wait for team approval.',
        },
        {
          title: isArabic ? 'طلب قالب مخصص' : 'Requesting Custom Template',
          content: isArabic
            ? 'إذا كنت تريد قالباً مخصصاً لملفك الشخصي، يمكنك تقديم طلب من خلال لوحة التحكم. وصف التصميم المطلوب والمواصفات الخاصة.'
            : 'If you want a custom template for your profile, you can submit a request through the dashboard. Describe the required design and special specifications.',
        },
      ],
    },
    {
      id: 'security',
      title: isArabic ? 'الأمان والخصوصية' : 'Security & Privacy',
      icon: Shield,
      description: isArabic
        ? 'تعرف على كيفية حماية بياناتك ومعلوماتك الشخصية'
        : 'Learn how your data and personal information is protected',
      topics: [
        {
          title: isArabic ? 'حماية البيانات' : 'Data Protection',
          content: isArabic
            ? 'نستخدم تشفير SSL/TLS لجميع الاتصالات، Row Level Security (RLS) لحماية البيانات في قاعدة البيانات، وContent Security Policy (CSP) لمنع هجمات XSS.'
            : 'We use SSL/TLS encryption for all communications, Row Level Security (RLS) to protect data in the database, and Content Security Policy (CSP) to prevent XSS attacks.',
        },
        {
          title: isArabic ? 'الخصوصية' : 'Privacy',
          content: isArabic
            ? 'نحترم خصوصيتك ولا نشارك بياناتك مع أطراف ثالثة. يمكنك مراجعة سياسة الخصوصية للحصول على مزيد من التفاصيل.'
            : 'We respect your privacy and do not share your data with third parties. You can review the privacy policy for more details.',
        },
      ],
    },
  ];

  const quickStart = [
    {
      step: 1,
      title: isArabic ? 'إنشاء حساب' : 'Create Account',
      description: isArabic
        ? 'سجّل حساباً جديداً في VETAP باستخدام بريدك الإلكتروني'
        : 'Register a new account on VETAP using your email',
    },
    {
      step: 2,
      title: isArabic ? 'إنشاء ملف شخصي' : 'Create Profile',
      description: isArabic
        ? 'أنشئ ملفك الشخصي الأول وأضف معلوماتك الأساسية'
        : 'Create your first profile and add your basic information',
    },
    {
      step: 3,
      title: isArabic ? 'تخصيص البطاقة' : 'Customize Card',
      description: isArabic
        ? 'أضف روابط التواصل الاجتماعي وخصص مظهر بطاقتك'
        : 'Add social media links and customize your card appearance',
    },
    {
      step: 4,
      title: isArabic ? 'مشاركة البطاقة' : 'Share Card',
      description: isArabic
        ? 'شارك رابط بطاقتك أو استخدم بطاقة NFC مادية'
        : 'Share your card link or use a physical NFC card',
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
              {isArabic ? 'التوثيق' : 'Documentation'}
            </h1>
          </div>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            {isArabic
              ? 'دليل شامل لاستخدام جميع خدمات ومنتجات VETAP'
              : 'Complete guide to using all VETAP services and products'}
          </p>
        </motion.div>

        {/* Quick Start */}
        <section className="mb-16">
          <h2 className="mb-6 text-2xl font-semibold">
            {isArabic ? 'البدء السريع' : 'Quick Start'}
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
            {isArabic ? 'هل تحتاج مساعدة إضافية؟' : 'Need Additional Help?'}
          </h3>
          <p className="mb-6 text-muted-foreground">
            {isArabic
              ? 'تواصل مع فريق الدعم للحصول على مساعدة فورية'
              : 'Contact our support team for immediate assistance'}
          </p>
          <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
            <Button asChild variant="outline">
              <Link href={`/${locale}/support`}>
                {isArabic ? 'مركز الدعم' : 'Support Center'}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild>
              <Link href={`/${locale}/contact`}>
                {isArabic ? 'اتصل بنا' : 'Contact Us'}
              </Link>
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

