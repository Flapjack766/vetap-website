import { CheckInScanner } from '@/app/(components)/event/dashboard/CheckInScanner';

interface CheckInPageProps {
  params: { locale: string };
}

export default function CheckInPage({ params: { locale } }: CheckInPageProps) {
  return <CheckInScanner locale={locale} />;
}

