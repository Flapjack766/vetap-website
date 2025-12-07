'use client';

import { useState, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BusinessesTab } from './tabs/BusinessesTab';
import { BranchesTab } from './tabs/BranchesTab';
import { NFCCardsTab } from './tabs/NFCCardsTab';
import { BusinessSettings } from './settings/BusinessSettings';
import { Loader2, Link as LinkIcon, BarChart3, Settings } from 'lucide-react';
import { getDirection } from '@/lib/utils/rtl';
import { useRouter } from 'next/navigation';
import { Button } from '@/app/(components)/ui/button';

interface BranchTrackingDashboardProps {
  locale: string;
}

export function BranchTrackingDashboard({ locale }: BranchTrackingDashboardProps) {
  const t = useTranslations();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState('businesses');
  const [selectedBusinessId, setSelectedBusinessId] = useState<string | null>(null);
  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isRTL = locale === 'ar';
  const dir = getDirection(locale);

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background overflow-x-hidden" dir={dir}>
      <div className="container mx-auto px-4 py-8 md:py-12 max-w-full">
        <div className="mx-auto max-w-7xl w-full">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-start justify-between">
              <div className={isRTL ? 'text-right' : 'text-left'}>
                <h1 className="text-3xl md:text-4xl font-bold mb-2">
                  {t('TRACKING_PAGE_TITLE').replace(' - VETAP', '')}
                </h1>
                <p className="text-muted-foreground">
                  {t('BRANCH_TRACKING_MANAGE_BUSINESSES')}
                </p>
              </div>
              <div className={`flex gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <Button
                  variant="outline"
                  onClick={() => router.push(`/${locale}/dashboard/tracking/links`)}
                  className={`gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}
                >
                  <LinkIcon className="h-4 w-4" />
                  {t('BRANCH_TRACKING_CREATE_LINK')}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => router.push(`/${locale}/dashboard/tracking/analytics`)}
                  className={`gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}
                >
                  <BarChart3 className="h-4 w-4" />
                  {t('BRANCH_TRACKING_ANALYTICS')}
                </Button>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="mb-8 w-full overflow-x-auto">
              <TabsList className="inline-flex w-auto min-w-full sm:grid sm:w-full sm:grid-cols-4">
                <TabsTrigger value="businesses" className="whitespace-nowrap flex-shrink-0 text-xs sm:text-sm">
                  {t('BRANCH_TRACKING_BUSINESSES')}
                </TabsTrigger>
                <TabsTrigger 
                  value="branches" 
                  className="whitespace-nowrap flex-shrink-0 text-xs sm:text-sm"
                  disabled={!selectedBusinessId}
                >
                  {t('BRANCH_TRACKING_BRANCHES')}
                </TabsTrigger>
                <TabsTrigger 
                  value="cards" 
                  className="whitespace-nowrap flex-shrink-0 text-xs sm:text-sm"
                  disabled={!selectedBranchId}
                >
                  {t('BRANCH_TRACKING_NFC_CARDS')}
                </TabsTrigger>
                <TabsTrigger 
                  value="settings" 
                  className="whitespace-nowrap flex-shrink-0 text-xs sm:text-sm"
                  disabled={!selectedBusinessId}
                >
                  <Settings className="h-4 w-4 mr-1" />
                  {t('BRANCH_TRACKING_SETTINGS')}
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="businesses">
              <BusinessesTab 
                locale={locale}
                onBusinessSelect={(businessId) => {
                  setSelectedBusinessId(businessId);
                  setActiveTab('branches');
                }}
              />
            </TabsContent>

            <TabsContent value="branches">
              <BranchesTab 
                locale={locale}
                businessId={selectedBusinessId}
                onBranchSelect={(branchId) => {
                  setSelectedBranchId(branchId);
                  setActiveTab('cards');
                }}
              />
            </TabsContent>

            <TabsContent value="cards">
              <NFCCardsTab 
                locale={locale}
                branchId={selectedBranchId}
              />
            </TabsContent>

            <TabsContent value="settings">
              {selectedBusinessId ? (
                <BusinessSettings businessId={selectedBusinessId} />
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  {t('BRANCH_TRACKING_SELECT_BUSINESS_FIRST')}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

