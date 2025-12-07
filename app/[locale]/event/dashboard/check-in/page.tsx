import { CheckInScanner } from '@/app/(components)/event/dashboard/CheckInScanner';
import { use } from 'react';

interface CheckInPageProps {
  params: Promise<{ locale: string }>;
}

export default function CheckInPage({ params }: CheckInPageProps) {
  const { locale } = use(params);
  return <CheckInScanner locale={locale} />;
}

