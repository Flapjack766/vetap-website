'use client';

import { useState, useEffect } from 'react';
import { useLocale } from 'next-intl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/app/(components)/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/app/(components)/ui/label';
import { Loader2, Link as LinkIcon, CheckCircle2, XCircle, ExternalLink } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/components/ui/toaster';
import { getDirection } from '@/lib/utils/rtl';
import { useRouter, useSearchParams } from 'next/navigation';

interface BusinessSettingsProps {
  businessId: string;
}

interface GoogleConnection {
  id: string;
  google_account_email: string;
  created_at: string;
}

export function BusinessSettings({ businessId }: BusinessSettingsProps) {
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isArabic = locale === 'ar';
  const dir = getDirection(locale);
  const supabase = createClient();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [syncingEnabled, setSyncingEnabled] = useState(false);
  const [googleConnection, setGoogleConnection] = useState<GoogleConnection | null>(null);
  const [connecting, setConnecting] = useState(false);

  useEffect(() => {
    fetchConnectionStatus();
    
    // Check if redirected from OAuth callback
    if (searchParams.get('google') === 'connected') {
      toast({
        title: isArabic ? 'تم الربط بنجاح' : 'Connected Successfully',
        description: isArabic 
          ? 'تم ربط حساب Google Business بنجاح'
          : 'Google Business account connected successfully',
      });
      // Remove query param
      router.replace(`/${locale}/dashboard/tracking?businessId=${businessId}`);
    }
  }, [businessId, searchParams]);

  const fetchConnectionStatus = async () => {
    try {
      setLoading(true);
      
      const { data: connection, error } = await supabase
        .from('google_business_connections')
        .select('id, google_account_email, created_at')
        .eq('business_id', businessId)
        .maybeSingle();

      if (error) throw error;

      if (connection) {
        setGoogleConnection(connection);
        setSyncingEnabled(true);
      }
    } catch (error: any) {
      console.error('Error fetching connection:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConnectGoogle = async () => {
    try {
      setConnecting(true);
      
      // Redirect to OAuth start endpoint
      window.location.href = `/api/google-business/oauth/start?businessId=${businessId}`;
    } catch (error: any) {
      console.error('Error starting OAuth:', error);
      toast({
        title: isArabic ? 'خطأ' : 'Error',
        description: error.message || (isArabic ? 'فشل بدء عملية الربط' : 'Failed to start connection'),
        variant: 'destructive',
      });
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      const { error } = await supabase
        .from('google_business_connections')
        .delete()
        .eq('business_id', businessId);

      if (error) throw error;

      setGoogleConnection(null);
      setSyncingEnabled(false);
      
      toast({
        title: isArabic ? 'تم إلغاء الربط' : 'Disconnected',
        description: isArabic 
          ? 'تم إلغاء ربط حساب Google Business'
          : 'Google Business account disconnected',
      });
    } catch (error: any) {
      console.error('Error disconnecting:', error);
      toast({
        title: isArabic ? 'خطأ' : 'Error',
        description: error.message || (isArabic ? 'فشل إلغاء الربط' : 'Failed to disconnect'),
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6" dir={dir}>
      <Card>
        <CardHeader>
          <CardTitle>
            {isArabic ? 'مزامنة التقييمات من Google' : 'Google Reviews Sync'}
          </CardTitle>
          <CardDescription>
            {isArabic 
              ? 'ربط حساب Google Business Profile لمزامنة التقييمات تلقائياً'
              : 'Connect your Google Business Profile to sync reviews automatically'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Enable Sync Toggle */}
          <div className="flex items-center justify-between">
            <div className={`space-y-0.5 ${isArabic ? 'text-right' : 'text-left'}`}>
              <Label htmlFor="sync-enabled" className="text-base">
                {isArabic ? 'تفعيل مزامنة التقييمات من Google' : 'Enable Google Reviews Sync'}
              </Label>
              <p className="text-sm text-muted-foreground">
                {isArabic 
                  ? 'مزامنة تلقائية لعدد التقييمات ومتوسط النجوم من Google Maps'
                  : 'Automatically sync review count and average rating from Google Maps'}
              </p>
            </div>
            <Switch
              id="sync-enabled"
              checked={syncingEnabled}
              onCheckedChange={(checked) => {
                if (checked && !googleConnection) {
                  // If enabling but not connected, start connection flow
                  handleConnectGoogle();
                } else if (!checked && googleConnection) {
                  // If disabling, show disconnect option
                  handleDisconnect();
                } else {
                  setSyncingEnabled(checked);
                }
              }}
              disabled={connecting}
            />
          </div>

          {/* Connection Status */}
          {googleConnection ? (
            <div className="rounded-lg border p-4 bg-muted/50">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                <div className={`flex-1 ${isArabic ? 'text-right' : 'text-left'}`}>
                  <p className="font-medium">
                    {isArabic ? 'مرتبط بحساب Google' : 'Connected to Google Account'}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {googleConnection.google_account_email}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {isArabic 
                      ? `تم الربط في: ${new Date(googleConnection.created_at).toLocaleDateString('ar-SA')}`
                      : `Connected on: ${new Date(googleConnection.created_at).toLocaleDateString('en-US')}`}
                  </p>
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleConnectGoogle}
                  disabled={connecting}
                  className={`gap-2 ${isArabic ? 'flex-row-reverse' : ''}`}
                >
                  {connecting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {isArabic ? 'جاري الربط...' : 'Connecting...'}
                    </>
                  ) : (
                    <>
                      <LinkIcon className="h-4 w-4" />
                      {isArabic ? 'إعادة الربط' : 'Re-connect'}
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDisconnect}
                  className={`gap-2 ${isArabic ? 'flex-row-reverse' : ''}`}
                >
                  <XCircle className="h-4 w-4" />
                  {isArabic ? 'إلغاء الربط' : 'Disconnect'}
                </Button>
              </div>
            </div>
          ) : (
            <div className="rounded-lg border p-4 bg-muted/30">
              <div className="flex items-start gap-3">
                <XCircle className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div className={`flex-1 ${isArabic ? 'text-right' : 'text-left'}`}>
                  <p className="font-medium">
                    {isArabic ? 'غير مرتبط' : 'Not Connected'}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {isArabic 
                      ? 'قم بربط حساب Google Business Profile لتفعيل المزامنة'
                      : 'Connect your Google Business Profile account to enable sync'}
                  </p>
                </div>
              </div>
              <Button
                className="mt-4 gap-2"
                onClick={handleConnectGoogle}
                disabled={connecting}
              >
                {connecting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {isArabic ? 'جاري الربط...' : 'Connecting...'}
                  </>
                ) : (
                  <>
                    <ExternalLink className="h-4 w-4" />
                    {isArabic ? 'ربط حساب Google Business' : 'Connect Google Business Account'}
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Info */}
          <div className="rounded-lg border p-4 bg-blue-50 dark:bg-blue-950/20">
            <p className="text-sm text-blue-900 dark:text-blue-100">
              {isArabic ? (
                <>
                  <strong>ملاحظة:</strong> بعد الربط، سيتم مزامنة بيانات التقييمات تلقائياً كل ساعة. 
                  تأكد من أن فروعك تحتوي على <code className="text-xs bg-blue-100 dark:bg-blue-900 px-1 rounded">google_place_id</code> أو <code className="text-xs bg-blue-100 dark:bg-blue-900 px-1 rounded">google_maps_url</code>.
                </>
              ) : (
                <>
                  <strong>Note:</strong> After connecting, reviews will be synced automatically every hour. 
                  Make sure your branches have a <code className="text-xs bg-blue-100 dark:bg-blue-900 px-1 rounded">google_place_id</code> or <code className="text-xs bg-blue-100 dark:bg-blue-900 px-1 rounded">google_maps_url</code>.
                </>
              )}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

