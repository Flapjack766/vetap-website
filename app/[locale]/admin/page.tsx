import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { unstable_noStore as noStore } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { AdminDashboard } from '@/app/(components)/admin/AdminDashboard';

export const dynamic = 'force-dynamic';

// Simple admin check: user_id must be in this list
// TODO: Replace with actual admin user IDs or implement role-based system
const ADMIN_USER_IDS = [
  '15f7e23f-8b8f-4f73-ae2d-e75201d788bc',
  // Example: '123e4567-e89b-12d3-a456-426614174000'
];

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale });
  const siteUrl = process.env.SITE_URL || 'https://vetaps.com';
  const isArabic = locale === 'ar';

  return {
    title: isArabic ? `${t('ADMIN1')} - VETAP` : `${t('ADMIN1')} - VETAP`,
    description: t('ADMIN2'),
    robots: {
      index: false,
      follow: false,
    },
    openGraph: {
      title: isArabic ? `${t('ADMIN1')} - VETAP` : `${t('ADMIN1')} - VETAP`,
      description: t('ADMIN2'),
      url: `${siteUrl}/${locale}/admin`,
      siteName: 'VETAP',
      locale: locale,
      type: 'website',
    },
    alternates: {
      canonical: `${siteUrl}/${locale}/admin`,
      languages: {
        'ar': `${siteUrl}/ar/admin`,
        'en': `${siteUrl}/en/admin`,
      },
    },
  };
}

export default async function AdminPage({ params }: { params: Promise<{ locale: string }> }) {
  noStore(); // Prevent caching
  const { locale } = await params;
  const supabase = await createClient();

  // Check authentication
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${locale}/login`);
  }

  // Simple admin check: user_id must be in ADMIN_USER_IDS list
  // TODO: Implement proper role-based system
  const isAdmin = ADMIN_USER_IDS.includes(user.id);

  if (!isAdmin) {
    redirect(`/${locale}/dashboard`);
  }

  return <AdminDashboard locale={locale} />;
}

