'use client';

import { useTranslations } from 'next-intl';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UsernameRequestsTab } from './tabs/UsernameRequestsTab';
import { TemplateRequestsTab } from './tabs/TemplateRequestsTab';
import { UsersTab } from './tabs/UsersTab';
import { VisitorsTab } from './tabs/VisitorsTab';

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
        <div className="w-full">
          <TabsList className="w-full min-w-max inline-flex md:w-auto md:grid md:grid-cols-4">
            <TabsTrigger value="username-requests" className="whitespace-nowrap flex-shrink-0">
              {t('ADMIN3')}
            </TabsTrigger>
            <TabsTrigger value="template-requests" className="whitespace-nowrap flex-shrink-0">
              {t('TEMPLATE44')}
            </TabsTrigger>
            <TabsTrigger value="users" className="whitespace-nowrap flex-shrink-0">
              {t('ADMIN46')}
            </TabsTrigger>
            <TabsTrigger value="visitors" className="whitespace-nowrap flex-shrink-0">
              {locale === 'ar' ? 'الزوار' : 'Visitors'}
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="username-requests" className="space-y-4">
          <UsernameRequestsTab locale={locale} />
        </TabsContent>

        <TabsContent value="template-requests" className="space-y-4">
          <TemplateRequestsTab locale={locale} />
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <UsersTab locale={locale} />
        </TabsContent>

        <TabsContent value="visitors" className="space-y-4">
          <VisitorsTab locale={locale} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

