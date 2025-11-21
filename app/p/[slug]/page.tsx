import { redirect } from 'next/navigation';
import { defaultLocale } from '@/lib/i18n/config';

// Redirect /p/[slug] to /[locale]/p/[slug]
export default async function PublicProfileRedirect({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  redirect(`/${defaultLocale}/p/${slug}`);
}

