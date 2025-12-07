import TrackingLinkPage from '../../../r/[slug]/page';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function LocalizedTrackingLinkPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; slug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { slug } = await params;

  // Reuse the existing non-localized tracking page logic,
  // but only pass the slug through.
  return TrackingLinkPage({
    params: Promise.resolve({ slug }),
    searchParams,
  });
}


