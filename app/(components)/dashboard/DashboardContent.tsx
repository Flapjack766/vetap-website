'use client';

import { useState, useEffect, useRef } from 'react';
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
  const [activeTab, setActiveTab] = useState('profile');
  const [activeSection, setActiveSection] = useState<string | undefined>(undefined);
  const [mounted, setMounted] = useState(false);
  const supabase = createClient();
  const tabsContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Set mounted to true after component mounts on client
    setMounted(true);
    
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

  // Scroll to top of tabs content when tab changes
  useEffect(() => {
    if (tabsContainerRef.current && !activeSection) {
      // Small delay to ensure the tab content is rendered
      setTimeout(() => {
        const element = tabsContainerRef.current;
        if (element) {
          // Get the position of the element relative to the viewport
          const elementPosition = element.getBoundingClientRect().top;
          // Get current scroll position
          const offsetPosition = elementPosition + window.pageYOffset;
          // Account for fixed header (approximately 64px = 16 * 4 = pt-16)
          const headerHeight = 64;
          // Scroll to position minus header height
          window.scrollTo({
            top: offsetPosition - headerHeight,
            behavior: 'smooth'
          });
        }
      }, 150);
    }
    // Reset activeSection after navigation
    if (activeSection) {
      setTimeout(() => {
        setActiveSection(undefined);
      }, 1000);
    }
  }, [activeTab, activeSection]);

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
            onNavigateToTab={(tab) => {
              setActiveTab(tab);
              if (tab === 'link') {
                setActiveSection('custom-username');
              }
            }}
          />

          {/* Tabs */}
          <div ref={tabsContainerRef}>
            {mounted ? (
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <div className="mb-8 w-full overflow-x-auto">
                  <TabsList className="inline-flex w-auto min-w-full sm:grid sm:w-full sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
                    <TabsTrigger value="profile" className="whitespace-nowrap flex-shrink-0 text-xs sm:text-sm">{t('DASH3')}</TabsTrigger>
                    <TabsTrigger value="links" className="whitespace-nowrap flex-shrink-0 text-xs sm:text-sm">{t('DASH4')}</TabsTrigger>
                    <TabsTrigger value="templates" className="whitespace-nowrap flex-shrink-0 text-xs sm:text-sm">{t('DASH5')}</TabsTrigger>
                    <TabsTrigger value="link" className="whitespace-nowrap flex-shrink-0 text-xs sm:text-sm">{t('DASH6')}</TabsTrigger>
                    <TabsTrigger value="analytics" className="whitespace-nowrap flex-shrink-0 text-xs sm:text-sm">{t('DASH54')}</TabsTrigger>
                    <TabsTrigger value="reports" className="whitespace-nowrap flex-shrink-0 text-xs sm:text-sm">{t('DASH55')}</TabsTrigger>
                  </TabsList>
                </div>

                <TabsContent value="profile">
                <ProfileTab 
                  profile={currentProfile} 
                  locale={locale}
                  onUpdate={(updated) => setCurrentProfile(updated)}
                  onNext={() => setActiveTab('links')}
                />
              </TabsContent>

              <TabsContent value="links">
                <LinksTab 
                  profile={currentProfile} 
                  locale={locale}
                  onUpdate={(updated) => setCurrentProfile(updated)}
                  onNext={() => setActiveTab('templates')}
                  onPrevious={() => setActiveTab('profile')}
                />
              </TabsContent>

              <TabsContent value="templates">
                <TemplatesTab 
                  profile={currentProfile} 
                  locale={locale}
                  onUpdate={(updated) => setCurrentProfile(updated)}
                  onNext={() => setActiveTab('link')}
                  onPrevious={() => setActiveTab('links')}
                  onNavigateToTab={(tab) => {
                    setActiveTab(tab);
                    if (tab === 'link') {
                      setActiveSection('custom-template');
                    }
                  }}
                />
              </TabsContent>

              <TabsContent value="link">
                <LinkTab 
                  profile={currentProfile} 
                  locale={locale}
                  activeSection={activeSection}
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
            ) : (
              <div className="w-full">
                <div className="mb-8 w-full overflow-x-auto">
                  <div className="inline-flex w-auto min-w-full sm:grid sm:w-full sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 h-9 items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground">
                    <div className="inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-xs sm:text-sm font-medium bg-background text-foreground shadow">{t('DASH3')}</div>
                    <div className="inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-xs sm:text-sm font-medium">{t('DASH4')}</div>
                    <div className="inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-xs sm:text-sm font-medium">{t('DASH5')}</div>
                    <div className="inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-xs sm:text-sm font-medium">{t('DASH6')}</div>
                    <div className="inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-xs sm:text-sm font-medium">{t('DASH54')}</div>
                    <div className="inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-xs sm:text-sm font-medium">{t('DASH55')}</div>
                  </div>
                </div>
                <ProfileTab 
                  profile={currentProfile} 
                  locale={locale}
                  onUpdate={(updated) => setCurrentProfile(updated)}
                  onNext={() => setActiveTab('links')}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

