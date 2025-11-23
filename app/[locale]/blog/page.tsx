import { setRequestLocale } from 'next-intl/server';
import { getTranslations } from 'next-intl/server';
import { getOrganizationLd, getBreadcrumbLd, getBlogPageLd } from '@/app/(seo)/jsonld';
import { BlogContent } from '@/app/(components)/blog/BlogContent';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale });
  const siteUrl = process.env.SITE_URL || 'https://vetaps.com';
  
  return {
    title: locale === 'ar' ? 'المدونة - VETAP | مقالات عن تطوير المواقع والتقنيات الرقمية' : 'Blog - VETAP | Web Development & Digital Technology Articles',
    description: locale === 'ar' 
      ? 'اكتشف أحدث المقالات حول تطوير المواقع، تقنيات NFC، SEO، وأفضل الممارسات في التطوير الرقمي من خبراء VETAP'
      : 'Discover the latest articles on web development, NFC technology, SEO, and digital development best practices from VETAP experts',
    openGraph: {
      title: locale === 'ar' ? 'المدونة - VETAP' : 'Blog - VETAP',
      description: locale === 'ar' 
        ? 'مقالات احترافية عن تطوير المواقع والتقنيات الرقمية'
        : 'Professional articles on web development and digital technologies',
      url: `${siteUrl}/${locale}/blog`,
      siteName: 'VETAP',
      locale: locale,
      type: 'website',
    },
    alternates: {
      canonical: `${siteUrl}/${locale}/blog`,
      languages: {
        'ar': `${siteUrl}/ar/blog`,
        'en': `${siteUrl}/en/blog`,
      },
    },
  };
}

export default async function BlogPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const siteUrl = process.env.SITE_URL || 'https://vetaps.com';
  const isArabic = locale === 'ar';
  
  const organizationLd = getOrganizationLd(locale as 'ar' | 'en');
  const breadcrumbLd = getBreadcrumbLd([
    { name: isArabic ? 'الرئيسية' : 'Home', item: `${siteUrl}/${locale}` },
    { name: isArabic ? 'المدونة' : 'Blog', item: `${siteUrl}/${locale}/blog` },
  ], locale as 'ar' | 'en');
  const blogPageLd = getBlogPageLd(locale as 'ar' | 'en');
  
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(blogPageLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />
      <BlogContent locale={locale as 'ar' | 'en'} />
    </>
  );
}

