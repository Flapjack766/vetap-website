'use client';

import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { HelpCircle, Mail, MessageSquare, BookOpen, Clock, CheckCircle2, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

interface SupportContentProps {
  locale: 'ar' | 'en';
  faqs: { question: string; answer: string }[];
}

export function SupportContent({ locale, faqs }: SupportContentProps) {
  const t = useTranslations();
  const isArabic = locale === 'ar';

  const supportOptions = [
    {
      icon: BookOpen,
      title: isArabic ? 'التوثيق' : 'Documentation',
      description: isArabic
        ? 'استكشف أدلة الاستخدام الشاملة'
        : 'Explore comprehensive usage guides',
      href: `/${locale}/documentation`,
      color: 'text-blue-500',
    },
    {
      icon: MessageSquare,
      title: isArabic ? 'اتصل بنا' : 'Contact Us',
      description: isArabic
        ? 'تواصل مع فريق الدعم مباشرة'
        : 'Get in touch with our support team',
      href: `/${locale}/contact`,
      color: 'text-green-500',
    },
    {
      icon: Mail,
      title: isArabic ? 'البريد الإلكتروني' : 'Email',
      description: isArabic
        ? 'أرسل بريداً إلكترونياً إلى support@vetaps.com'
        : 'Send an email to support@vetaps.com',
      href: 'mailto:support@vetaps.com',
      color: 'text-purple-500',
    },
  ];

  const responseTimes = [
    {
      type: isArabic ? 'الاستفسارات العامة' : 'General Inquiries',
      time: isArabic ? 'خلال 24 ساعة' : 'Within 24 hours',
    },
    {
      type: isArabic ? 'المشاكل التقنية' : 'Technical Issues',
      time: isArabic ? 'خلال 12 ساعة' : 'Within 12 hours',
    },
    {
      type: isArabic ? 'الاستفسارات العاجلة' : 'Urgent Inquiries',
      time: isArabic ? 'خلال 4 ساعات' : 'Within 4 hours',
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
            <HelpCircle className="h-8 w-8 text-primary" />
            <h1 className="text-4xl font-bold md:text-5xl">
              {isArabic ? 'مركز الدعم' : 'Support Center'}
            </h1>
          </div>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            {isArabic
              ? 'نحن هنا لمساعدتك. ابحث عن إجابات لأسئلتك أو تواصل معنا للحصول على مساعدة فورية'
              : 'We are here to help. Find answers to your questions or contact us for immediate assistance'}
          </p>
        </motion.div>

        {/* Support Options */}
        <section className="mb-16">
          <h2 className="mb-6 text-2xl font-semibold">
            {isArabic ? 'طرق الحصول على المساعدة' : 'Ways to Get Help'}
          </h2>
          <div className="grid gap-6 md:grid-cols-3">
            {supportOptions.map((option, index) => {
              const Icon = option.icon;
              return (
                <motion.div
                  key={option.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true, margin: '-100px' }}
                >
                  <Card className="h-full transition-all hover:shadow-lg">
                    <CardHeader>
                      <Icon className={`mb-2 h-8 w-8 ${option.color}`} />
                      <CardTitle>{option.title}</CardTitle>
                      <CardDescription>{option.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button variant="outline" className="w-full" asChild>
                        <Link href={option.href}>
                          {isArabic ? 'ابدأ الآن' : 'Get Started'}
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

        {/* FAQs */}
        <section className="mb-16">
          <h2 className="mb-6 text-2xl font-semibold">
            {isArabic ? 'الأسئلة الشائعة' : 'Frequently Asked Questions'}
          </h2>
          <Card>
            <CardContent className="pt-6">
              <Accordion type="single" collapsible className="w-full">
                {faqs.map((faq, index) => (
                  <AccordionItem key={index} value={`item-${index}`}>
                    <AccordionTrigger className="text-left">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>
        </section>

        {/* Response Times */}
        <section className="mb-16">
          <h2 className="mb-6 text-2xl font-semibold">
            {isArabic ? 'أوقات الاستجابة المتوقعة' : 'Expected Response Times'}
          </h2>
          <div className="grid gap-4 md:grid-cols-3">
            {responseTimes.map((item, index) => (
              <motion.div
                key={item.type}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true, margin: '-100px' }}
              >
                <Card>
                  <CardHeader>
                    <div className="mb-2 flex items-center gap-2">
                      <Clock className="h-5 w-5 text-primary" />
                      <CardTitle className="text-lg">{item.type}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold text-primary">{item.time}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Contact Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          viewport={{ once: true, margin: '-100px' }}
          className="rounded-lg border bg-muted/50 p-8"
        >
          <h3 className="mb-6 text-2xl font-semibold">
            {isArabic ? 'لم تجد ما تبحث عنه؟' : "Can't Find What You're Looking For?"}
          </h3>
          <p className="mb-6 text-muted-foreground">
            {isArabic
              ? 'تواصل معنا مباشرة وسنكون سعداء بمساعدتك'
              : 'Contact us directly and we will be happy to help you'}
          </p>
          <Button asChild size="lg">
            <Link href={`/${locale}/contact`}>
              {isArabic ? 'اتصل بنا الآن' : 'Contact Us Now'}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </motion.div>
      </div>
    </div>
  );
}

