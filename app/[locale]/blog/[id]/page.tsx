import { setRequestLocale } from 'next-intl/server';
import { getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { getOrganizationLd, getBreadcrumbLd, getFAQPageLd } from '@/app/(seo)/jsonld';
import { BlogPostContent } from '@/app/(components)/blog/BlogPostContent';
import { promises as fs } from 'fs';
import { join } from 'path';

export async function generateMetadata({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { locale, id } = await params;
  const t = await getTranslations({ locale });
  const siteUrl = process.env.SITE_URL || 'https://vetaps.com';
  
  const postId = parseInt(id);
  if (postId < 1 || postId > 6) {
    return {
      title: 'Post Not Found',
    };
  }

  const titleKey = `BLOG_POST${postId}_TITLE`;
  const excerptKey = `BLOG_POST${postId}_EXCERPT`;
  
  return {
    title: `${t(titleKey)} - VETAP Blog`,
    description: t(excerptKey),
    openGraph: {
      title: t(titleKey),
      description: t(excerptKey),
      url: `${siteUrl}/${locale}/blog/${id}`,
      siteName: 'VETAP',
      locale: locale,
      type: 'article',
    },
    alternates: {
      canonical: `${siteUrl}/${locale}/blog/${id}`,
      languages: {
        'ar': `${siteUrl}/ar/blog/${id}`,
        'en': `${siteUrl}/en/blog/${id}`,
      },
    },
  };
}

export default async function BlogPostPage({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const siteUrl = process.env.SITE_URL || 'https://vetaps.com';
  const isArabic = locale === 'ar';
  const t = await getTranslations({ locale });
  
  const postId = parseInt(id);
  if (postId < 1 || postId > 6) {
    notFound();
  }

  const organizationLd = getOrganizationLd(locale as 'ar' | 'en');
  const breadcrumbLd = getBreadcrumbLd([
    { name: isArabic ? 'الرئيسية' : 'Home', item: `${siteUrl}/${locale}` },
    { name: isArabic ? 'المدونة' : 'Blog', item: `${siteUrl}/${locale}/blog` },
    { name: `Post ${postId}`, item: `${siteUrl}/${locale}/blog/${id}` },
  ], locale as 'ar' | 'en');

  // FAQ Schema for Posts 1-6
  let faqLd = null;
  if (postId === 1) {
    const faqs = [
      {
        question: isArabic ? 'ما هو Next.js 15؟' : 'What is Next.js 15?',
        answer: isArabic 
          ? 'Next.js 15 هو أحدث إصدار رئيسي من إطار عمل React الذي يقدم ميزات ثورية مثل React Server Components و Partial Prerendering.'
          : 'Next.js 15 is the latest major version of the React framework that introduces revolutionary features like React Server Components and Partial Prerendering.',
      },
      {
        question: isArabic ? 'ما الجديد في Next.js 15؟' : "What's new in Next.js 15?",
        answer: isArabic
          ? 'الميزات الرئيسية تشمل React Server Components، Partial Prerendering، Turbopack (أسرع 700 مرة)، وتحسينات TypeScript.'
          : 'Key features include React Server Components, Partial Prerendering, Turbopack (700x faster), and TypeScript improvements.',
      },
      {
        question: isArabic ? 'هل Next.js 15 جاهز للإنتاج؟' : 'Is Next.js 15 production-ready?',
        answer: isArabic
          ? 'نعم، Next.js 15 مستقر وجاهز للإنتاج. شركات كبرى تستخدمه في الإنتاج.'
          : 'Yes, Next.js 15 is stable and production-ready. Major companies use it in production.',
      },
      {
        question: isArabic ? 'كم أسرع Next.js 15؟' : 'How much faster is Next.js 15?',
        answer: isArabic
          ? 'التطبيقات الواقعية ترى تحميل صفحات أسرع 40%، حزم أصغر 30%، ودرجات Lighthouse أفضل 50%.'
          : 'Real-world applications see 40% faster page loads, 30% smaller bundles, and 50% better Lighthouse scores.',
      },
      {
        question: isArabic ? 'هل أحتاج لإعادة كتابة تطبيق Next.js 14؟' : 'Do I need to rewrite my Next.js 14 app?',
        answer: isArabic
          ? 'لا، معظم كود Next.js 14 يعمل دون تغييرات. الترحيل التدريجي موصى به.'
          : 'No, most Next.js 14 code works without changes. Gradual migration is recommended.',
      },
      {
        question: isArabic ? 'ما منحنى التعلم لـ Next.js 15؟' : "What's the learning curve for Next.js 15?",
        answer: isArabic
          ? 'إذا كنت تعرف React و Next.js 14، ستكون منتجاً في Next.js 15 خلال يوم. Server Components هي المفهوم الجديد الرئيسي.'
          : 'If you know React and Next.js 14, you will be productive in Next.js 15 within a day. Server Components are the main new concept.',
      },
    ];
    
    faqLd = getFAQPageLd(faqs, locale as 'ar' | 'en');
  } else if (postId === 2) {
    const faqs = [
      {
        question: isArabic ? 'ما هي تقنية NFC؟' : 'What is NFC technology?',
        answer: isArabic
          ? 'NFC (Near Field Communication) هي تقنية اتصال لاسلكي قصيرة المدى تتيح تبادل البيانات بين الأجهزة عندما تكون على بعد 4 سم من بعضها.'
          : 'NFC (Near Field Communication) is a short-range wireless communication technology that enables data exchange between devices when they are within 4cm of each other.',
      },
      {
        question: isArabic ? 'هل تعمل بطاقات NFC مع جميع الهواتف الذكية؟' : 'Do NFC cards work with all smartphones?',
        answer: isArabic
          ? 'معظم الهواتف الذكية الحديثة تدعم NFC. iPhone 7 والإصدارات الأحدث يمكنها قراءة علامات NFC مع التطبيقات، بينما معظم أجهزة Android لديها دعم NFC مدمج.'
          : 'Most modern smartphones support NFC. iPhone 7 and later can read NFC tags with apps, while most Android devices have built-in NFC support.',
      },
      {
        question: isArabic ? 'كم من البيانات يمكن لبطاقة NFC تخزينها؟' : 'How much data can an NFC card store?',
        answer: isArabic
          ? 'بطاقات NFC التجارية النموذجية تستخدم علامات NTAG215 بسعة 504 بايت، كافية لمعلومات الاتصال وعدة URLs. علامات أكبر (حتى 8KB) متاحة للتطبيقات المتقدمة.'
          : 'Typical NFC business cards use NTAG215 tags with 504 bytes capacity, enough for contact info and multiple URLs. Larger tags (up to 8KB) are available for advanced applications.',
      },
      {
        question: isArabic ? 'هل يمكنني تحديث المعلومات على بطاقة NFC؟' : 'Can I update the information on an NFC card?',
        answer: isArabic
          ? 'نعم، إذا كانت العلامة قابلة للكتابة. ومع ذلك، تستخدم معظم البطاقات التجارية علامات للكتابة مرة واحدة للأمان. الحل هو الربط بصفحة هبوط يمكنك تحديثها في أي وقت.'
          : 'Yes, if the tag is writable. However, most business cards use write-once tags for security. The solution is to link to a landing page that you can update anytime.',
      },
      {
        question: isArabic ? 'ما الفرق بين NFC و QR codes؟' : "What's the difference between NFC and QR codes?",
        answer: isArabic
          ? 'NFC لا يتطلب تطبيقاً ويعمل بلمسة بسيطة، بينما QR codes تتطلب كاميرا وتطبيق مسح. NFC أسرع وأكثر ملاءمة، لكن QR codes تعمل مع أي كاميرا هاتف ذكي.'
          : 'NFC requires no app and works with a simple tap, while QR codes require a camera and scanning app. NFC is faster and more convenient, but QR codes work with any smartphone camera.',
      },
      {
        question: isArabic ? 'كم تدوم بطاقات NFC؟' : 'How long do NFC cards last?',
        answer: isArabic
          ? 'يمكن لعلامات NFC أن تدوم 10+ سنوات مع العناية المناسبة. مادة البطاقة المادية (PVC، معدن) عادة ما تدوم أكثر من العلامة نفسها.'
          : 'NFC tags can last 10+ years with proper care. The physical card material (PVC, metal) typically outlasts the tag itself.',
      },
    ];
    
    faqLd = getFAQPageLd(faqs, locale as 'ar' | 'en');
  } else if (postId === 3) {
    const faqs = [
      {
        question: isArabic ? 'كم من الوقت يستغرق رؤية نتائج SEO؟' : 'How long does it take to see SEO results?',
        answer: isArabic
          ? 'عادة 3-6 أشهر لنتائج ملحوظة، مع تأثير كامل مرئي بعد 12-18 شهراً من التحسين المستمر.'
          : 'Typically 3-6 months for noticeable results, with full impact visible after 12-18 months of consistent optimization.',
      },
      {
        question: isArabic ? 'هل SEO لا يزال ذا صلة في 2025؟' : 'Is SEO still relevant in 2025?',
        answer: isArabic
          ? 'بالتأكيد! SEO أكثر أهمية من أي وقت مضى. البحث العضوي يدفع 53% من حركة مرور الموقع، ومحركات البحث تستمر في التطور.'
          : 'Absolutely! SEO is more important than ever. Organic search drives 53% of website traffic, and search engines continue to evolve.',
      },
      {
        question: isArabic ? 'ما أهم عامل SEO؟' : "What's the most important SEO factor?",
        answer: isArabic
          ? 'لا يوجد عامل واحد، لكن Core Web Vitals وجودة المحتوى (E-A-T) و Technical SEO هي الأولويات الرئيسية في 2025.'
          : 'There is no single factor, but Core Web Vitals, content quality (E-A-T), and technical SEO are the top priorities in 2025.',
      },
    ];
    faqLd = getFAQPageLd(faqs, locale as 'ar' | 'en');
  } else if (postId === 4) {
    const faqs = [
      {
        question: isArabic ? 'كم مرة يجب أن أحدث تدابير الأمان الخاصة بي؟' : 'How often should I update my security measures?',
        answer: isArabic
          ? 'الأمان مستمر. حدّث التبعيات شهرياً، راجع السياسات ربع سنوياً، وأجرِ عمليات تدقيق كاملة سنوياً.'
          : 'Security is ongoing. Update dependencies monthly, review policies quarterly, and conduct full audits annually.',
      },
      {
        question: isArabic ? 'هل RLS كافٍ لأمان قاعدة البيانات؟' : 'Is RLS enough for database security?',
        answer: isArabic
          ? 'RLS ضروري لكنه غير كافٍ بمفرده. اجمع مع التشفير وضوابط الوصول وعمليات التدقيق المنتظمة.'
          : 'RLS is essential but not sufficient alone. Combine with encryption, access controls, and regular audits.',
      },
    ];
    faqLd = getFAQPageLd(faqs, locale as 'ar' | 'en');
  } else if (postId === 5) {
    const faqs = [
      {
        question: isArabic ? 'هل TypeScript يستحق التعلم؟' : 'Is TypeScript worth learning?',
        answer: isArabic
          ? 'بالتأكيد! TypeScript هو المعيار الصناعي لتطوير الويب الحديث. يحسن جودة الكود ويقلل الأخطاء ويعزز تجربة المطور.'
          : 'Absolutely! TypeScript is the industry standard for modern web development. It improves code quality, reduces bugs, and enhances developer experience.',
      },
      {
        question: isArabic ? 'هل يمكنني استخدام TypeScript تدريجياً؟' : 'Can I use TypeScript gradually?',
        answer: isArabic
          ? 'نعم! يمكنك ترحيل مشاريع JavaScript إلى TypeScript تدريجياً. ابدأ بملفات `.ts` وأضف الأنواع تدريجياً.'
          : 'Yes! You can migrate JavaScript projects to TypeScript incrementally. Start with `.ts` files and gradually add types.',
      },
    ];
    faqLd = getFAQPageLd(faqs, locale as 'ar' | 'en');
  } else if (postId === 6) {
    const faqs = [
      {
        question: isArabic ? 'ما وقت تحميل صفحة جيد؟' : "What's a good page load time?",
        answer: isArabic
          ? 'أقل من ثانية واحدة ممتاز، 1-2 ثانية جيد، 2-3 ثوان مقبول، وأكثر من 3 ثوان يحتاج تحسين.'
          : 'Under 1 second is excellent, 1-2 seconds is good, 2-3 seconds is acceptable, and over 3 seconds needs improvement.',
      },
      {
        question: isArabic ? 'هل يجب أن أستخدم SSR أو SSG؟' : 'Should I use SSR or SSG?',
        answer: isArabic
          ? 'استخدم SSG للمحتوى الثابت (المدونات، التوثيق) و SSR للمحتوى الديناميكي/الخاص بالمستخدم. Next.js يجعل هذا سهلاً مع التحسين التلقائي.'
          : 'Use SSG for static content (blogs, docs) and SSR for dynamic/user-specific content. Next.js makes this easy with automatic optimization.',
      },
    ];
    faqLd = getFAQPageLd(faqs, locale as 'ar' | 'en');
  }

  // Get translations for Posts 1-6 (with markdown content)
  // Read directly from JSON to avoid next-intl parsing issues with Markdown
  let postContent = null;
  if (postId >= 1 && postId <= 6) {
    try {
      const contentPath = join(process.cwd(), 'content', `${locale}.json`);
      const contentFile = await fs.readFile(contentPath, 'utf-8');
      const contentJson = JSON.parse(contentFile);
      
      if (postId === 1) {
        postContent = {
          title: contentJson.BLOG_POST1_TITLE || t('BLOG_POST1_TITLE'),
          excerpt: contentJson.BLOG_POST1_EXCERPT || t('BLOG_POST1_EXCERPT'),
          intro: contentJson.BLOG_POST1_INTRO || '',
          whatIs: contentJson.BLOG_POST1_WHAT_IS || '',
          rsc: contentJson.BLOG_POST1_RSC || '',
          ppr: contentJson.BLOG_POST1_PPR || '',
          caching: contentJson.BLOG_POST1_CACHING || '',
          useCases: contentJson.BLOG_POST1_USE_CASES || '',
          pitfalls: contentJson.BLOG_POST1_PITFALLS || '',
          performance: contentJson.BLOG_POST1_PERFORMANCE || '',
          gettingStarted: contentJson.BLOG_POST1_GETTING_STARTED || '',
          faq: contentJson.BLOG_POST1_FAQ || '',
          conclusion: contentJson.BLOG_POST1_CONCLUSION || '',
        };
      } else if (postId === 2) {
        postContent = {
          title: contentJson.BLOG_POST2_TITLE || t('BLOG_POST2_TITLE'),
          excerpt: contentJson.BLOG_POST2_EXCERPT || t('BLOG_POST2_EXCERPT'),
          intro: contentJson.BLOG_POST2_INTRO || '',
          whatIs: contentJson.BLOG_POST2_WHAT_IS || '',
          howItWorks: contentJson.BLOG_POST2_HOW_IT_WORKS || '',
          benefits: contentJson.BLOG_POST2_BENEFITS || '',
          useCases: contentJson.BLOG_POST2_USE_CASES || '',
          implementation: contentJson.BLOG_POST2_IMPLEMENTATION || '',
          bestPractices: contentJson.BLOG_POST2_BEST_PRACTICES || '',
          pitfalls: contentJson.BLOG_POST2_PITFALLS || '',
          statistics: contentJson.BLOG_POST2_STATISTICS || '',
          faq: contentJson.BLOG_POST2_FAQ || '',
          conclusion: contentJson.BLOG_POST2_CONCLUSION || '',
        };
      } else if (postId === 3) {
        postContent = {
          title: contentJson.BLOG_POST3_TITLE || t('BLOG_POST3_TITLE'),
          excerpt: contentJson.BLOG_POST3_EXCERPT || t('BLOG_POST3_EXCERPT'),
          intro: contentJson.BLOG_POST3_INTRO || '',
          whatIs: contentJson.BLOG_POST3_WHAT_IS || '',
          structuredData: contentJson.BLOG_POST3_STRUCTURED_DATA || '',
          coreWebVitals: contentJson.BLOG_POST3_CORE_WEB_VITALS || '',
          contentStrategy: contentJson.BLOG_POST3_CONTENT_STRATEGY || '',
          technicalSeo: contentJson.BLOG_POST3_TECHNICAL_SEO || '',
          localSeo: contentJson.BLOG_POST3_LOCAL_SEO || '',
          useCases: contentJson.BLOG_POST3_USE_CASES || '',
          pitfalls: contentJson.BLOG_POST3_PITFALLS || '',
          statistics: contentJson.BLOG_POST3_STATISTICS || '',
          faq: contentJson.BLOG_POST3_FAQ || '',
          conclusion: contentJson.BLOG_POST3_CONCLUSION || '',
        };
      } else if (postId === 4) {
        postContent = {
          title: contentJson.BLOG_POST4_TITLE || t('BLOG_POST4_TITLE'),
          excerpt: contentJson.BLOG_POST4_EXCERPT || t('BLOG_POST4_EXCERPT'),
          intro: contentJson.BLOG_POST4_INTRO || '',
          whatIs: contentJson.BLOG_POST4_WHAT_IS || '',
          rls: contentJson.BLOG_POST4_RLS || '',
          csp: contentJson.BLOG_POST4_CSP || '',
          encryption: contentJson.BLOG_POST4_ENCRYPTION || '',
          authentication: contentJson.BLOG_POST4_AUTHENTICATION || '',
          rateLimiting: contentJson.BLOG_POST4_RATE_LIMITING || '',
          inputValidation: contentJson.BLOG_POST4_INPUT_VALIDATION || '',
          useCases: contentJson.BLOG_POST4_USE_CASES || '',
          pitfalls: contentJson.BLOG_POST4_PITFALLS || '',
          statistics: contentJson.BLOG_POST4_STATISTICS || '',
          faq: contentJson.BLOG_POST4_FAQ || '',
          conclusion: contentJson.BLOG_POST4_CONCLUSION || '',
        };
      } else if (postId === 5) {
        postContent = {
          title: contentJson.BLOG_POST5_TITLE || t('BLOG_POST5_TITLE'),
          excerpt: contentJson.BLOG_POST5_EXCERPT || t('BLOG_POST5_EXCERPT'),
          intro: contentJson.BLOG_POST5_INTRO || '',
          whatIs: contentJson.BLOG_POST5_WHAT_IS || '',
          basics: contentJson.BLOG_POST5_BASICS || '',
          advanced: contentJson.BLOG_POST5_ADVANCED || '',
          nextjs: contentJson.BLOG_POST5_NEXTJS || '',
          bestPractices: contentJson.BLOG_POST5_BEST_PRACTICES || '',
          useCases: contentJson.BLOG_POST5_USE_CASES || '',
          pitfalls: contentJson.BLOG_POST5_PITFALLS || '',
          statistics: contentJson.BLOG_POST5_STATISTICS || '',
          faq: contentJson.BLOG_POST5_FAQ || '',
          conclusion: contentJson.BLOG_POST5_CONCLUSION || '',
        };
      } else if (postId === 6) {
        postContent = {
          title: contentJson.BLOG_POST6_TITLE || t('BLOG_POST6_TITLE'),
          excerpt: contentJson.BLOG_POST6_EXCERPT || t('BLOG_POST6_EXCERPT'),
          intro: contentJson.BLOG_POST6_INTRO || '',
          whatIs: contentJson.BLOG_POST6_WHAT_IS || '',
          ssrSsg: contentJson.BLOG_POST6_SSR_SSG || '',
          imageOptimization: contentJson.BLOG_POST6_IMAGE_OPTIMIZATION || '',
          codeSplitting: contentJson.BLOG_POST6_CODE_SPLITTING || '',
          caching: contentJson.BLOG_POST6_CACHING || '',
          useCases: contentJson.BLOG_POST6_USE_CASES || '',
          pitfalls: contentJson.BLOG_POST6_PITFALLS || '',
          statistics: contentJson.BLOG_POST6_STATISTICS || '',
          faq: contentJson.BLOG_POST6_FAQ || '',
          conclusion: contentJson.BLOG_POST6_CONCLUSION || '',
        };
      }
    } catch (error) {
      console.error('Error loading translations from file:', error);
      // If file reading fails, set postContent to null
      // BlogPostContent will use default translations from t()
      postContent = null;
    }
  }
  
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />
      {faqLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }}
        />
      )}
      <BlogPostContent locale={locale as 'ar' | 'en'} postId={postId} postContent={postContent} />
    </>
  );
}

