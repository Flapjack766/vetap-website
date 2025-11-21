'use client';

import { useTranslations } from 'next-intl';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UsernameRequestsTab } from './tabs/UsernameRequestsTab';
import { TemplateRequestsTab } from './tabs/TemplateRequestsTab';

interface AdminDashboardProps {
  locale: string;
}

export function AdminDashboard({ locale }: AdminDashboardProps) {
  const t = useTranslations();

  return (
    <div className="vetap-container py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">{t('ADMIN1')}</h1>
        <p className="text-muted-foreground">{t('ADMIN2')}</p>
      </div>

      <Tabs defaultValue="username-requests" className="space-y-6">
        <TabsList>
          <TabsTrigger value="username-requests">
            {t('ADMIN3')}
          </TabsTrigger>
          <TabsTrigger value="template-requests">
            {t('TEMPLATE44')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="username-requests" className="space-y-4">
          <UsernameRequestsTab locale={locale} />
        </TabsContent>

        <TabsContent value="template-requests" className="space-y-4">
          <TemplateRequestsTab locale={locale} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

