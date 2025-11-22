'use client';

import { useState, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ProfileTab } from './tabs/ProfileTab';
import { LinksTab } from './tabs/LinksTab';
import { TemplatesTab } from './tabs/TemplatesTab';
import { LinkTab } from './tabs/LinkTab';
import { AnalyticsTab } from './tabs/AnalyticsTab';
import { ReportsTab } from './tabs/ReportsTab';
import { Button } from '@/app/(components)/ui/button';
import { Shield } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { ProfileSelector } from './ProfileSelector';

interface DashboardContentProps {
  profile: any;
  locale: string;
}

export function DashboardContent({ profile, locale }: DashboardContentProps) {
  const t = useTranslations();
  const router = useRouter();
  const [currentProfile, setCurrentProfile] = useState(profile);
  const [isAdmin, setIsAdmin] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    // Check if user is admin (admin@vetaps.com)
    const checkAdmin = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.email === 'admin@vetaps.com') {
          setIsAdmin(true);
        }
      } catch (error) {
        console.error('Error checking admin status:', error);
      }
    };

    checkAdmin();
  }, []);

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <div className="container mx-auto px-4 py-8 md:py-12 max-w-full">
        <div className="mx-auto max-w-6xl w-full">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold mb-2">{t('DASH1')}</h1>
                <p className="text-muted-foreground">{t('DASH2')}</p>
              </div>
              {isAdmin && (
                <Button
                  variant="outline"
                  onClick={() => router.push(`/${locale}/admin`)}
                  className="gap-2"
                >
                  <Shield className="h-4 w-4" />
                  {t('DASH53')}
                </Button>
              )}
            </div>
          </div>

          {/* Profile Selector */}
          <ProfileSelector
            currentProfile={currentProfile}
            locale={locale}
            onProfileChange={setCurrentProfile}
          />

          {/* Tabs */}
          <Tabs defaultValue="profile" className="w-full">
            <div className="mb-8 w-full overflow-x-auto">
              <TabsList className="inline-flex w-auto min-w-full md:grid md:w-full md:grid-cols-3 lg:grid-cols-6">
                <TabsTrigger value="profile" className="whitespace-nowrap flex-shrink-0">{t('DASH3')}</TabsTrigger>
                <TabsTrigger value="links" className="whitespace-nowrap flex-shrink-0">{t('DASH4')}</TabsTrigger>
                <TabsTrigger value="templates" className="whitespace-nowrap flex-shrink-0">{t('DASH5')}</TabsTrigger>
                <TabsTrigger value="link" className="whitespace-nowrap flex-shrink-0">{t('DASH6')}</TabsTrigger>
                <TabsTrigger value="analytics" className="whitespace-nowrap flex-shrink-0">{t('DASH54')}</TabsTrigger>
                <TabsTrigger value="reports" className="whitespace-nowrap flex-shrink-0">{t('DASH55')}</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="profile">
              <ProfileTab 
                profile={currentProfile} 
                locale={locale}
                onUpdate={(updated) => setCurrentProfile(updated)}
              />
            </TabsContent>

            <TabsContent value="links">
              <LinksTab 
                profile={currentProfile} 
                locale={locale}
                onUpdate={(updated) => setCurrentProfile(updated)}
              />
            </TabsContent>

            <TabsContent value="templates">
              <TemplatesTab 
                profile={currentProfile} 
                locale={locale}
                onUpdate={(updated) => setCurrentProfile(updated)}
              />
            </TabsContent>

            <TabsContent value="link">
              <LinkTab 
                profile={currentProfile} 
                locale={locale}
              />
            </TabsContent>

            <TabsContent value="analytics">
              <AnalyticsTab 
                profile={currentProfile} 
                locale={locale}
              />
            </TabsContent>

            <TabsContent value="reports">
              <ReportsTab 
                profile={currentProfile} 
                locale={locale}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

