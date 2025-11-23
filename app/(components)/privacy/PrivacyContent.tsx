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
      title: isArabic ? '1. المعلومات التي نجمعها' : '1. Information We Collect',
      content: isArabic
        ? 'نجمع المعلومات التي تقدمها لنا مباشرة عند إنشاء حساب أو استخدام خدماتنا، بما في ذلك: الاسم، عنوان البريد الإلكتروني، رقم الهاتف، معلومات الملف الشخصي، وبيانات الاستخدام. نحن لا نجمع معلومات حساسة مثل أرقام البطاقات الائتمانية مباشرة - يتم التعامل مع المدفوعات من خلال مزودي خدمات دفع آمنين.'
        : 'We collect information you provide directly when creating an account or using our services, including: name, email address, phone number, profile information, and usage data. We do not collect sensitive information such as credit card numbers directly - payments are processed through secure payment service providers.',
    },
    {
      icon: Eye,
      title: isArabic ? '2. كيفية استخدامنا للمعلومات' : '2. How We Use Information',
      content: isArabic
        ? 'نستخدم المعلومات التي نجمعها لتقديم وصيانة وتحسين خدماتنا، ومعالجة المعاملات، وإرسال الإشعارات، والرد على استفساراتك، وتوفير الدعم الفني. قد نستخدم أيضاً معلوماتك لإرسال تحديثات حول خدماتنا، ولكن يمكنك إلغاء الاشتراك في أي وقت.'
        : 'We use the information we collect to provide, maintain, and improve our services, process transactions, send notifications, respond to your inquiries, and provide technical support. We may also use your information to send updates about our services, but you can unsubscribe at any time.',
    },
    {
      icon: Lock,
      title: isArabic ? '3. حماية البيانات' : '3. Data Protection',
      content: isArabic
        ? 'نطبق تدابير أمنية متقدمة لحماية بياناتك، بما في ذلك: تشفير SSL/TLS لجميع الاتصالات، Row Level Security (RLS) في قاعدة البيانات، Content Security Policy (CSP) لمنع هجمات XSS، وRate Limiting لحماية من الهجمات. نحن نراجع بانتظام ممارساتنا الأمنية ونحدثها.'
        : 'We implement advanced security measures to protect your data, including: SSL/TLS encryption for all communications, Row Level Security (RLS) in the database, Content Security Policy (CSP) to prevent XSS attacks, and Rate Limiting to protect against attacks. We regularly review and update our security practices.',
    },
    {
      icon: Shield,
      title: isArabic ? '4. مشاركة المعلومات' : '4. Information Sharing',
      content: isArabic
        ? 'نحن لا نبيع أو نؤجر معلوماتك الشخصية لأطراف ثالثة. قد نشارك معلوماتك فقط في الحالات التالية: مع مزودي الخدمات الذين يساعدوننا في تشغيل خدماتنا (مثل مزودي الاستضافة والدفع)، عندما يكون ذلك مطلوباً بموجب القانون، أو لحماية حقوقنا ومستخدمينا. جميع مزودي الخدمات لدينا ملزمون بمعايير صارمة لحماية البيانات.'
        : 'We do not sell or rent your personal information to third parties. We may share your information only in the following cases: with service providers who help us operate our services (such as hosting and payment providers), when required by law, or to protect our rights and users. All our service providers are bound by strict data protection standards.',
    },
    {
      icon: Calendar,
      title: isArabic ? '5. حقوقك' : '5. Your Rights',
      content: isArabic
        ? 'لديك الحق في: الوصول إلى معلوماتك الشخصية، تصحيح المعلومات غير الدقيقة، حذف معلوماتك، الاعتراض على معالجة معلوماتك، وطلب نقل بياناتك. يمكنك ممارسة هذه الحقوق من خلال لوحة التحكم أو بالاتصال بنا على support@vetaps.com.'
        : 'You have the right to: access your personal information, correct inaccurate information, delete your information, object to processing of your information, and request transfer of your data. You can exercise these rights through the dashboard or by contacting us at support@vetaps.com.',
    },
    {
      icon: FileText,
      title: isArabic ? '6. ملفات تعريف الارتباط والتقنيات المشابهة' : '6. Cookies and Similar Technologies',
      content: isArabic
        ? 'نستخدم ملفات تعريف الارتباط والتقنيات المشابهة لتتبع النشاط على موقعنا وتحسين تجربة المستخدم. يمكنك تعطيل ملفات تعريف الارتباط من خلال إعدادات المتصفح، ولكن قد يؤثر ذلك على وظائف معينة في موقعنا.'
        : 'We use cookies and similar technologies to track activity on our site and improve user experience. You can disable cookies through browser settings, but this may affect certain functions on our site.',
    },
    {
      icon: Calendar,
      title: isArabic ? '7. التغييرات على سياسة الخصوصية' : '7. Changes to Privacy Policy',
      content: isArabic
        ? 'قد نحدث سياسة الخصوصية هذه من وقت لآخر. سنخطرك بأي تغييرات جوهرية عن طريق إرسال إشعار إلى عنوان البريد الإلكتروني المحدد في حسابك أو عن طريق إشعار بارز على موقعنا. ننصحك بمراجعة هذه السياسة بانتظام.'
        : 'We may update this privacy policy from time to time. We will notify you of any material changes by sending a notice to the email address specified in your account or by posting a prominent notice on our site. We advise you to review this policy regularly.',
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
              {isArabic ? 'سياسة الخصوصية' : 'Privacy Policy'}
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
                  ? 'في VETAP، نحن ملتزمون بحماية خصوصيتك. توضح سياسة الخصوصية هذه كيفية جمع واستخدام وحماية معلوماتك الشخصية عند استخدام خدماتنا. باستخدام خدماتنا، فإنك توافق على ممارسات جمع واستخدام المعلومات الموضحة في هذه السياسة.'
                  : 'At VETAP, we are committed to protecting your privacy. This privacy policy explains how we collect, use, and protect your personal information when using our services. By using our services, you agree to the information collection and use practices described in this policy.'}
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
              ? 'إذا كان لديك أي أسئلة حول سياسة الخصوصية هذه، يرجى الاتصال بنا:'
              : 'If you have any questions about this privacy policy, please contact us:'}
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

