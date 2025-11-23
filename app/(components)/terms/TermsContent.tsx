'use client';

import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { FileText, Scale, AlertCircle, CheckCircle2, XCircle, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface TermsContentProps {
  locale: 'ar' | 'en';
}

export function TermsContent({ locale }: TermsContentProps) {
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
      title: isArabic ? '1. قبول الشروط' : '1. Acceptance of Terms',
      content: isArabic
        ? 'باستخدام خدمات VETAP، فإنك توافق على الالتزام بهذه الشروط والأحكام. إذا كنت لا توافق على أي جزء من هذه الشروط، فيجب عليك عدم استخدام خدماتنا. نحتفظ بالحق في تعديل هذه الشروط في أي وقت، وسيتم إشعارك بأي تغييرات جوهرية.'
        : 'By using VETAP services, you agree to be bound by these terms and conditions. If you do not agree to any part of these terms, you must not use our services. We reserve the right to modify these terms at any time, and you will be notified of any material changes.',
    },
    {
      icon: CheckCircle2,
      title: isArabic ? '2. استخدام الخدمة' : '2. Use of Service',
      content: isArabic
        ? 'يجب أن تكون 18 عاماً أو أكثر لاستخدام خدماتنا. أنت مسؤول عن الحفاظ على سرية معلومات حسابك وكلمة المرور. يجب عليك إخطارنا فوراً بأي استخدام غير مصرح به لحسابك. أنت توافق على استخدام خدماتنا فقط للأغراض القانونية ووفقاً لجميع القوانين واللوائح المعمول بها.'
        : 'You must be 18 years or older to use our services. You are responsible for maintaining the confidentiality of your account information and password. You must notify us immediately of any unauthorized use of your account. You agree to use our services only for lawful purposes and in accordance with all applicable laws and regulations.',
    },
    {
      icon: XCircle,
      title: isArabic ? '3. المحتوى المحظور' : '3. Prohibited Content',
      content: isArabic
        ? 'يُحظر استخدام خدماتنا لنشر أو مشاركة أي محتوى غير قانوني، مسيء، مهدد، مسيء، أو ينتهك حقوق أي طرف ثالث. يُحظر أيضاً استخدام خدماتنا لأي نشاط احتيالي أو خادع. نحتفظ بالحق في حذف أي محتوى أو تعليق حساب ينتهك هذه الشروط.'
        : 'It is prohibited to use our services to publish or share any illegal, offensive, threatening, abusive, or content that violates the rights of any third party. It is also prohibited to use our services for any fraudulent or deceptive activity. We reserve the right to delete any content or suspend accounts that violate these terms.',
    },
    {
      icon: Scale,
      title: isArabic ? '4. الملكية الفكرية' : '4. Intellectual Property',
      content: isArabic
        ? 'جميع المحتوى والمواد على موقعنا، بما في ذلك النصوص والرسومات والشعارات والصور، هي ملك لـ VETAP أو مورديها ومحمية بموجب قوانين حقوق النشر والعلامات التجارية. لا يجوز لك نسخ أو توزيع أو تعديل أو إنشاء أعمال مشتقة من أي محتوى دون إذن كتابي منا.'
        : 'All content and materials on our site, including text, graphics, logos, and images, are the property of VETAP or its suppliers and are protected by copyright and trademark laws. You may not copy, distribute, modify, or create derivative works from any content without our written permission.',
    },
    {
      icon: AlertCircle,
      title: isArabic ? '5. إخلاء المسؤولية' : '5. Disclaimer',
      content: isArabic
        ? 'نقدم خدماتنا "كما هي" دون أي ضمانات صريحة أو ضمنية. لا نضمن أن خدماتنا ستكون غير منقطعة أو خالية من الأخطاء. لن نكون مسؤولين عن أي أضرار مباشرة أو غير مباشرة ناتجة عن استخدام أو عدم القدرة على استخدام خدماتنا.'
        : 'We provide our services "as is" without any express or implied warranties. We do not guarantee that our services will be uninterrupted or error-free. We will not be liable for any direct or indirect damages resulting from the use or inability to use our services.',
    },
    {
      icon: Scale,
      title: isArabic ? '6. المدفوعات والاسترداد' : '6. Payments and Refunds',
      content: isArabic
        ? 'جميع المدفوعات مستحقة عند الطلب. الأسعار قابلة للتغيير دون إشعار مسبق. في حالة طلب استرداد، سيتم تقييم كل حالة على حدة. لا نقدم استرداداً تلقائياً، ولكننا نراجع جميع طلبات الاسترداد بعناية.'
        : 'All payments are due upon request. Prices are subject to change without prior notice. In case of refund requests, each case will be evaluated individually. We do not offer automatic refunds, but we carefully review all refund requests.',
    },
    {
      icon: FileText,
      title: isArabic ? '7. إنهاء الخدمة' : '7. Termination of Service',
      content: isArabic
        ? 'نحتفظ بالحق في تعليق أو إنهاء حسابك في أي وقت، مع أو بدون إشعار، لأي سبب من الأسباب، بما في ذلك انتهاك هذه الشروط. عند إنهاء حسابك، قد يتم حذف جميع بياناتك وملفاتك.'
        : 'We reserve the right to suspend or terminate your account at any time, with or without notice, for any reason, including violation of these terms. Upon termination of your account, all your data and files may be deleted.',
    },
    {
      icon: Calendar,
      title: isArabic ? '8. التغييرات على الشروط' : '8. Changes to Terms',
      content: isArabic
        ? 'قد نحدث شروط الخدمة هذه من وقت لآخر. سنخطرك بأي تغييرات جوهرية عن طريق إرسال إشعار إلى عنوان البريد الإلكتروني المحدد في حسابك أو عن طريق إشعار بارز على موقعنا. استمرار استخدامك لخدماتنا بعد التغييرات يعني موافقتك على الشروط المحدثة.'
        : 'We may update these terms of service from time to time. We will notify you of any material changes by sending a notice to the email address specified in your account or by posting a prominent notice on our site. Your continued use of our services after changes means you agree to the updated terms.',
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
            <Scale className="h-8 w-8 text-primary" />
            <h1 className="text-4xl font-bold md:text-5xl">
              {isArabic ? 'شروط الخدمة' : 'Terms of Service'}
            </h1>
          </div>
          <p className="mx-auto max-w-2xl text-muted-foreground">
            {isArabic
              ? `آخر تحديث: ${currentDate}`
              : `Last Updated: ${currentDate}`}
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
                {isArabic
                  ? 'يرجى قراءة شروط الخدمة هذه بعناية قبل استخدام خدمات VETAP. باستخدام خدماتنا، فإنك توافق على الالتزام بهذه الشروط والأحكام. إذا كنت لا توافق على هذه الشروط، فيرجى عدم استخدام خدماتنا.'
                  : 'Please read these terms of service carefully before using VETAP services. By using our services, you agree to be bound by these terms and conditions. If you do not agree to these terms, please do not use our services.'}
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
            {isArabic ? 'اتصل بنا' : 'Contact Us'}
          </h3>
          <p className="mb-4 text-muted-foreground">
            {isArabic
              ? 'إذا كان لديك أي أسئلة حول شروط الخدمة هذه، يرجى الاتصال بنا:'
              : 'If you have any questions about these terms of service, please contact us:'}
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

