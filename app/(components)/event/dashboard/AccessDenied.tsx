'use client';

import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { ShieldX, ArrowLeft } from 'lucide-react';
import { Button } from '@/app/(components)/ui/button';

interface AccessDeniedProps {
  locale: string;
}

export function AccessDenied({ locale }: AccessDeniedProps) {
  const router = useRouter();
  const t = useTranslations();

  return (
    <div className="flex items-center justify-center py-12">
      <div className="text-center max-w-md">
        <div className="bg-red-500/10 p-4 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
          <ShieldX className="h-10 w-10 text-red-500" />
        </div>
        <h1 className="text-2xl font-bold mb-2">{t('EVENT_ACCESS_DENIED')}</h1>
        <p className="text-muted-foreground mb-6">{t('EVENT_ACCESS_DENIED_DESC')}</p>
        <Button onClick={() => router.push(`/${locale}/event/dashboard`)}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          {t('EVENT_BACK_TO_EVENTS')}
        </Button>
      </div>
    </div>
  );
}

