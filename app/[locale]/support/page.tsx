import { setRequestLocale } from 'next-intl/server';
import { getTranslations } from 'next-intl/server';
import { getOrganizationLd, getBreadcrumbLd, getFAQPageLd, getSupportPageLd } from '@/app/(seo)/jsonld';
import { SupportContent } from '@/app/(components)/support/SupportContent';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const siteUrl = process.env.SITE_URL || 'https://vetaps.com';
  
  return {
    title: locale === 'ar' ? 'مركز الدعم - VETAP | المساعدة والدعم الفني' : 'Support Center - VETAP | Help & Technical Support',
    description: locale === 'ar' 
      ? 'احصل على المساعدة والدعم الفني من فريق VETAP. الأسئلة الشائعة، أدلة الاستخدام، وطرق التواصل'
      : 'Get help and technical support from VETAP team. FAQs, usage guides, and contact methods',
    openGraph: {
      title: locale === 'ar' ? 'مركز الدعم - VETAP' : 'Support Center - VETAP',
      description: locale === 'ar' 
        ? 'المساعدة والدعم الفني'
        : 'Help & Technical Support',
      url: `${siteUrl}/${locale}/support`,
      siteName: 'VETAP',
      locale: locale,
      type: 'website',
    },
    alternates: {
      canonical: `${siteUrl}/${locale}/support`,
      languages: {
        'ar': `${siteUrl}/ar/support`,
        'en': `${siteUrl}/en/support`,
      },
    },
  };
}

export default async function SupportPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const siteUrl = process.env.SITE_URL || 'https://vetaps.com';
  const isArabic = locale === 'ar';
  
  const organizationLd = getOrganizationLd(locale as 'ar' | 'en');
  const breadcrumbLd = getBreadcrumbLd([
    { name: isArabic ? 'الرئيسية' : 'Home', item: `${siteUrl}/${locale}` },
    { name: isArabic ? 'مركز الدعم' : 'Support Center', item: `${siteUrl}/${locale}/support` },
  ], locale as 'ar' | 'en');
  
  const faqs = [
    {
      question: isArabic 
        ? 'كيف يمكنني إنشاء بطاقة NFC جديدة؟'
        : 'How can I create a new NFC card?',
      answer: isArabic
        ? 'سجّل حساباً في VETAP، ثم انتقل إلى لوحة التحكم واختر "إنشاء بطاقة جديدة". املأ معلوماتك الأساسية وأضف روابط التواصل الاجتماعي.'
        : 'Register an account on VETAP, then go to the dashboard and select "Create New Card". Fill in your basic information and add social media links.',
    },
    {
      question: isArabic
        ? 'ما هي مدة صلاحية اسم المستخدم المخصص؟'
        : 'What is the validity period for custom usernames?',
      answer: isArabic
        ? 'يمكنك اختيار فترة صلاحية من أسبوع، شهر، أو سنة. بعد انتهاء الفترة، سيتم إرجاعك إلى اسم المستخدم العشوائي.'
        : 'You can choose a validity period of one week, month, or year. After the period expires, you will be reverted to a random username.',
    },
    {
      question: isArabic
        ? 'كيف يمكنني طلب قالب مخصص؟'
        : 'How can I request a custom template?',
      answer: isArabic
        ? 'انتقل إلى لوحة التحكم > تبويبة القوالب > "تصميم قالب مخصص". املأ النموذج بوصف التصميم المطلوب والمواصفات الخاصة.'
        : 'Go to Dashboard > Templates tab > "Design Custom Template". Fill out the form with a description of the required design and special specifications.',
    },
    {
      question: isArabic
        ? 'ما هي طرق الدفع المتاحة؟'
        : 'What payment methods are available?',
      answer: isArabic
        ? 'نقبل الدفع عبر البطاقات الائتمانية، التحويل البنكي، والدفع الإلكتروني. جميع المعاملات آمنة ومشفرة.'
        : 'We accept payment via credit cards, bank transfer, and electronic payment. All transactions are secure and encrypted.',
    },
    {
      question: isArabic
        ? 'كيف يمكنني تحديث معلوماتي الشخصية؟'
        : 'How can I update my personal information?',
      answer: isArabic
        ? 'انتقل إلى لوحة التحكم > تبويبة معلومات البروفايل. يمكنك تحديث أي معلومات تريدها وحفظ التغييرات.'
        : 'Go to Dashboard > Profile Information tab. You can update any information you want and save the changes.',
    },
    {
      question: isArabic
        ? 'هل بياناتي آمنة؟'
        : 'Is my data secure?',
      answer: isArabic
        ? 'نعم، نستخدم تشفير SSL/TLS، Row Level Security (RLS)، وContent Security Policy (CSP) لحماية بياناتك. نحن لا نشارك بياناتك مع أطراف ثالثة.'
        : 'Yes, we use SSL/TLS encryption, Row Level Security (RLS), and Content Security Policy (CSP) to protect your data. We do not share your data with third parties.',
    },
  ];
  
  const faqLd = getFAQPageLd(faqs, locale as 'ar' | 'en');
  const supportLd = getSupportPageLd(locale as 'ar' | 'en');
  
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(supportLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />
      <SupportContent locale={locale as 'ar' | 'en'} faqs={faqs} />
    </>
  );
}

